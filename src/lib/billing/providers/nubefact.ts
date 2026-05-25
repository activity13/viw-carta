import { IBillingProvider, InvoiceRequest, InvoiceResponse } from '../types';

export class NubefactAdapter implements IBillingProvider {
  readonly providerName = 'Nubefact';
  private readonly endpoint: string;
  private readonly token: string;

  constructor(endpoint: string, token: string) {
    if (!endpoint || !token) {
      throw new Error('NubefactAdapter: Se requiere endpoint y token de autenticación.');
    }
    
    // 1. Sanitizar espacios en blanco
    let cleanEndpoint = endpoint.trim();

    // 2. Auto-curación de URL duplicada/concatenada accidentalmente (ej: https://...https://...)
    const httpMatches = cleanEndpoint.match(/https?:\/\//gi);
    if (httpMatches && httpMatches.length > 1) {
      const parts = cleanEndpoint.split(/https?:\/\//i);
      const firstValidPart = parts.find(p => p.trim().length > 0);
      if (firstValidPart) {
        const protocol = cleanEndpoint.toLowerCase().startsWith('https') ? 'https://' : 'http://';
        cleanEndpoint = `${protocol}${firstValidPart.trim()}`;
      }
    }

    // 3. Si no especifica protocolo, auto-anteponer https://
    if (!/^https?:\/\//i.test(cleanEndpoint)) {
      if (cleanEndpoint.startsWith('/') || cleanEndpoint.startsWith('.')) {
        // Dejar pasar rutas relativas
      } else {
        cleanEndpoint = `https://${cleanEndpoint}`;
      }
    }

    // 4. Validar si es una URL base de Nubefact sin UUID
    const baseCheck = cleanEndpoint.replace(/\/$/, ""); // quitar barra al final si tiene
    if (
      baseCheck === "https://api.nubefact.com/api/v1" ||
      baseCheck === "https://demo.nubefact.com/api/v1" ||
      baseCheck === "http://api.nubefact.com/api/v1" ||
      baseCheck === "http://demo.nubefact.com/api/v1"
    ) {
      throw new Error(
        'NubefactAdapter: El API Endpoint ingresado está incompleto. Nubefact requiere que la URL incluya el identificador único (UUID) de tu local al final de la ruta (ej: https://api.nubefact.com/api/v1/tu-uuid-aqui).'
      );
    }

    this.endpoint = cleanEndpoint;
    this.token = token.trim();
  }

  /**
   * Obtiene la representación de cadena de la fecha ajustada estrictamente a la zona horaria de Perú (America/Lima)
   * para evitar el desplazamiento de medianoche y problemas de desfase UTC en SUNAT.
   */
  private getPeruDateString(date: Date): string {
    const formatter = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // Formato de retorno de es-PE: "DD/MM/YYYY" -> Reemplazar / con - para obtener "DD-MM-YYYY"
    return formatter.format(date).replace(/\//g, '-');
  }

  /**
   * Mapea el tipo de comprobante de Viw-Carta a los códigos numéricos de Nubefact
   */
  private mapInvoiceType(type: string): number {
    switch (type) {
      case 'FACTURA':
        return 1;
      case 'BOLETA':
        return 2;
      case 'NOTA_CREDITO':
        return 3;
      case 'NOTA_DEBITO':
        return 4;
      default:
        throw new Error(`NubefactAdapter: Tipo de comprobante no soportado: ${type}`);
    }
  }

  /**
   * Mapea el tipo de documento del cliente a los códigos admitidos por SUNAT en Nubefact
   */
  private mapDocumentType(type: string): string {
    switch (type) {
      case 'DNI':
        return '1';
      case 'RUC':
        return '6';
      case 'PASAPORTE':
        return '7';
      case 'CE':
        return '4';
      case 'VARIOS':
      default:
        return '-';
    }
  }

  async emitInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    try {
      const formattedDate = this.getPeruDateString(request.issueDate);
      const tipoComprobante = this.mapInvoiceType(request.invoiceType);
      const clienteTipoDoc = this.mapDocumentType(request.customer.documentType);

      // Mapear ítems de Viw-Carta al esquema estricto de Nubefact
      const nubefactItems = request.items.map((item) => {
        // En Perú, el IGV es típicamente el 18%.
        // El precio unitario de Viw-Carta ya incluye impuestos.
        // Nubefact calcula automáticamente si proveemos unitPrice, qty e igv/subtotal.
        return {
          unidad_de_medida: 'NIU', // NIU es la unidad estándar SUNAT para bienes/servicios en restaurantes
          codigo: item.code || 'PROD-GENERICO',
          descripcion: item.description,
          cantidad: item.quantity,
          valor_unitario: Number(item.subtotal / item.quantity), // Sin IGV
          precio_unitario: Number(item.unitPrice), // Con IGV
          subtotal: Number(item.subtotal), // Sin IGV
          tipo_de_igv: 1, // 1 = Gravado - Operación Onerosa (Venta normal)
          igv: Number(item.total - item.subtotal),
          total: Number(item.total),
          anticipo_regularizacion: false,
        };
      });

      // Payload final de Nubefact
      const payload = {
        operacion: 'generar_comprobante',
        tipo_de_comprobante: tipoComprobante,
        serie: request.serie,
        numero: request.correlativo,
        sunat_transaction: 1, // 1 = Venta Interna (Estándar para restaurantes)
        cliente_tipo_de_documento: clienteTipoDoc,
        cliente_numero_de_documento: request.customer.documentNumber || '00000000',
        cliente_denominacion: request.customer.name,
        cliente_direccion: request.customer.address || '',
        cliente_email: request.customer.email || '',
        fecha_de_emision: formattedDate,
        moneda: 1, // 1 = Soles (PEN)
        porcentaje_de_igv: 18.0,
        total_gravada: Number(request.subtotal),
        total_inafecta: 0,
        total_exonerada: 0,
        total_gratuita: 0,
        total_otros_cargos: 0,
        total_igv: Number(request.taxTotal),
        total: Number(request.total),
        enviar_a_sunat: true,
        items: nubefactItems,
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      let data: Record<string, unknown> = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = (await response.json()) as Record<string, unknown>;
      } else {
        const text = await response.text();
        return {
          success: false,
          errorCode: 'NOT_JSON_RESPONSE',
          errorMessage: `El servidor de facturación devolvió un formato no válido (HTML/Texto) con código ${response.status}. Detalle: ${text.substring(0, 150).trim()}...`,
          rawResponse: { rawBody: text },
        };
      }

      if (!response.ok || data.errors) {
        return {
          success: false,
          errorCode: String(response.status),
          errorMessage: typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors || 'Error desconocido en Nubefact'),
          rawResponse: data,
        };
      }

      // Nubefact devuelve enlaces en campos de respuesta exitosa
      return {
        success: true,
        invoiceId: `${request.serie}-${request.correlativo}`,
        pdfUrl: typeof data.enlace_del_pdf === 'string' ? data.enlace_del_pdf : undefined,
        xmlUrl: typeof data.enlace_del_xml === 'string' ? data.enlace_del_xml : undefined,
        cdrUrl: typeof data.enlace_del_cdr === 'string' ? data.enlace_del_cdr : undefined,
        rawResponse: data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorCode: 'INTERNAL_ADAPTER_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido al procesar la facturación en Nubefact',
        rawResponse: { error },
      };
    }
  }

  async cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceResponse> {
    try {
      // Separar serie y número (ej: 'F001-45' -> serie: 'F001', numero: 45)
      const parts = invoiceId.split('-');
      if (parts.length !== 2) {
        throw new Error('NubefactAdapter: El invoiceId debe tener el formato SERIE-CORRELATIVO (ej: F001-123).');
      }

      const [serie, correlativoStr] = parts;
      const correlativo = parseInt(correlativoStr, 10);
      const isFactura = serie.startsWith('F');

      const payload = {
        operacion: 'generar_anulacion',
        tipo_de_comprobante: isFactura ? 1 : 2, // 1 = Factura, 2 = Boleta
        serie: serie,
        numero: correlativo,
        motivo: reason || 'Anulación de venta por error de digitación o cancelación del pedido',
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      let data: Record<string, unknown> = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = (await response.json()) as Record<string, unknown>;
      } else {
        const text = await response.text();
        return {
          success: false,
          errorCode: 'NOT_JSON_RESPONSE',
          errorMessage: `El servidor de facturación devolvió un formato no válido al anular (código ${response.status}). Detalle: ${text.substring(0, 150).trim()}...`,
          rawResponse: { rawBody: text },
        };
      }

      if (!response.ok || data.errors) {
        return {
          success: false,
          errorCode: String(response.status),
          errorMessage: typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors || 'Error de anulación'),
          rawResponse: data,
        };
      }

      return {
        success: true,
        invoiceId,
        rawResponse: data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorCode: 'INTERNAL_ADAPTER_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Error al anular el comprobante en Nubefact',
        rawResponse: { error },
      };
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<InvoiceResponse> {
    try {
      const parts = invoiceId.split('-');
      if (parts.length !== 2) {
        throw new Error('NubefactAdapter: El invoiceId debe tener el formato SERIE-CORRELATIVO.');
      }

      const [serie, correlativoStr] = parts;
      const correlativo = parseInt(correlativoStr, 10);
      const isFactura = serie.startsWith('F');

      const payload = {
        operacion: 'consultar_comprobante',
        tipo_de_comprobante: isFactura ? 1 : 2,
        serie: serie,
        numero: correlativo,
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      let data: Record<string, unknown> = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = (await response.json()) as Record<string, unknown>;
      } else {
        const text = await response.text();
        return {
          success: false,
          errorCode: 'NOT_JSON_RESPONSE',
          errorMessage: `El servidor de facturación devolvió un formato no válido al consultar estado (código ${response.status}). Detalle: ${text.substring(0, 150).trim()}...`,
          rawResponse: { rawBody: text },
        };
      }

      if (!response.ok || data.errors) {
        return {
          success: false,
          errorCode: String(response.status),
          errorMessage: typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors || 'Error al consultar comprobante'),
          rawResponse: data,
        };
      }

      return {
        success: true,
        invoiceId,
        pdfUrl: typeof data.enlace_del_pdf === 'string' ? data.enlace_del_pdf : undefined,
        xmlUrl: typeof data.enlace_del_xml === 'string' ? data.enlace_del_xml : undefined,
        cdrUrl: typeof data.enlace_del_cdr === 'string' ? data.enlace_del_cdr : undefined,
        rawResponse: data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        errorCode: 'INTERNAL_ADAPTER_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Error al consultar el comprobante en Nubefact',
        rawResponse: { error },
      };
    }
  }
}
