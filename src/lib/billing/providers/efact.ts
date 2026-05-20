import { IBillingProvider, InvoiceRequest, InvoiceResponse } from '../types';

export class EfactAdapter implements IBillingProvider {
  readonly providerName = 'Efact';
  private readonly endpoint?: string;
  private readonly token?: string;

  constructor(endpoint?: string, token?: string) {
    this.endpoint = endpoint;
    this.token = token;
  }

  async emitInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    // eslint-disable-next-line no-console
    console.warn(`[EfactAdapter] Simulación de emisión de comprobante para: ${request.serie}-${request.correlativo}`);
    
    // Mientras esperamos la homologación y credenciales oficiales de La K, lanzamos una respuesta mockeada o aviso controlado.
    if (!this.endpoint || !this.token) {
      return {
        success: false,
        errorCode: 'EFACT_CREDENTIALS_MISSING',
        errorMessage: 'Faltan credenciales y documentación oficial del sandbox de Efact. La integración está pendiente de homologación por parte del cliente La K.',
        rawResponse: { message: 'Pendiente de credenciales' }
      };
    }

    // TODO: Implementar la integración con la API REST (Dynamic+) de Efact una vez provista la especificación técnica.
    return {
      success: true,
      invoiceId: `${request.serie}-${request.correlativo}`,
      pdfUrl: 'https://efact.pe/download/pdf/mock',
      xmlUrl: 'https://efact.pe/download/xml/mock',
      cdrUrl: 'https://efact.pe/download/cdr/mock',
      rawResponse: { status: 'mocked_success', message: 'Efact integration pending homologation' }
    };
  }

  async cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceResponse> {
    // eslint-disable-next-line no-console
    console.warn(`[EfactAdapter] Simulación de anulación para ${invoiceId}. Razón: ${reason}`);
    
    if (!this.endpoint || !this.token) {
      return {
        success: false,
        errorCode: 'EFACT_CREDENTIALS_MISSING',
        errorMessage: 'Faltan credenciales de Efact para realizar la anulación.',
        rawResponse: { message: 'Pendiente de credenciales' }
      };
    }

    return {
      success: true,
      invoiceId,
      rawResponse: { status: 'mocked_success', action: 'cancel' }
    };
  }

  async getInvoiceStatus(invoiceId: string): Promise<InvoiceResponse> {
    if (!this.endpoint || !this.token) {
      return {
        success: false,
        errorCode: 'EFACT_CREDENTIALS_MISSING',
        errorMessage: 'Faltan credenciales de Efact para consultar el estado.',
        rawResponse: { message: 'Pendiente de credenciales' }
      };
    }

    return {
      success: true,
      invoiceId,
      rawResponse: { status: 'mocked_success', action: 'status' }
    };
  }
}
