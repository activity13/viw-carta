# 1. Wiki del Cliente: Manual de Operaciones Viw-Carta

¡Bienvenido al centro de mando de tu restaurante! Viw-Carta es la plataforma profesional diseñada para llevar la experiencia de tus comensales y el control de tu negocio al siguiente nivel. 

Nuestro sistema sincroniza tu administración en tiempo real: cualquier cambio que realices aquí se reflejará al instante, y con un diseño de lujo, en los teléfonos de tus clientes mediante su menú digital. 

A continuación, te guiamos por los pilares fundamentales para operar tu restaurante con seguridad y excelencia.

---

## 🍽️ Gestión de la Carta: Tu Vitrina Digital

Tu menú es la carta de presentación de tu marca. Una estructura clara y apetitosa impulsa a tus clientes a ordenar más y más rápido.

### Creación de Categorías
Las categorías agrupan tus platillos (ej. *Entradas*, *Cortes Especiales*, *Mixología*). 
1. Dirígete a **Catálogo > Categorías**.
2. Haz clic en **+ Nueva Categoría**.
3. Asigna un nombre atractivo y una breve descripción.

> [!TIP]
> **Estrategia de Menú Oculto:** ¿Se agotó un insumo clave? No borres la categoría. Simplemente desactiva el interruptor de "Visible" y ocúltala temporalmente de la vista de tus clientes.

### Creación de Platillos y Variantes
Es el momento de hacer brillar tus creaciones culinarias:
1. Ve a la sección **Catálogo** y selecciona **+ Nuevo Plato**.
2. Completa la ficha con el precio (impuestos incluidos) y una descripción que despierte antojo.
   - **Código Interno / SKU / Barras:** Asigna un identificador corto y limpio a tu plato (ej. `CEV-01`). Si lo ingresas, este código premium se enviará a Nubefact/Efact en tus comprobantes en lugar del ID largo de base de datos, facilitando tus reportes contables.
3. **Fotografías:** Sube imágenes cuadradas y bien iluminadas. ¡Una buena foto es la mejor herramienta de ventas!
4. **Alérgenos y Etiquetas:** Protege a tus clientes marcando si un plato es picante, vegano o contiene mariscos. Se mostrarán iconos visuales premium en tu carta.
5. **Variantes y Extras (Upselling):** Configura opciones personalizables. Por ejemplo, tamaños (*Personal* / *Familiar*) o extras (*Adición de queso*, *Doble carne*). ¡Aquí es donde aumentas tu ticket promedio!

---

## 🔐 Flujo de Caja y Seguridad Financiera

Viw-Carta no es solo un menú, es la bóveda de tu negocio. Hemos implementado un sistema estricto de control de ingresos para garantizar que cada centavo esté contabilizado.

### El Principio de la Caja Obligatoria
En Viw-Carta, **no se puede registrar ni una sola orden si no existe una "Sesión de Caja" abierta**. 
- **¿Por qué?** Esto impide manipulaciones, ventas fantasma o movimientos fuera de horario. 
- **¿Cómo protege tu dinero?** Cada turno (mañana/noche) o cajero debe abrir su propia sesión. Al finalizar, el sistema emite un reporte exacto de lo que debe haber en efectivo, tarjetas y transferencias, calculando milimétricamente impuestos y recargos. Si hay un descuadre, sabrás exactamente en qué turno y bajo qué usuario ocurrió.

> [!IMPORTANT]
> **Cierre de Turno Seguro:** Asegúrate de que tu personal cierre la caja al finalizar su jornada. El sistema está preparado para registrar la hora exacta del operador y evitar los temidos "desplazamientos de medianoche" en tus finanzas.

---

## 🚀 Toma de Órdenes y Tickets

La coordinación entre la sala (meseros) y el corazón del restaurante (cocina) nunca fue tan precisa.

### Flujo para Meseros
1. El comensal escanea el elegante menú digital QR, revisa las fotos y elige con calma.
2. El mesero, desde su terminal o dispositivo, registra la orden en la mesa correspondiente. Solo visualizará las herramientas necesarias para vender, sin acceso a configuraciones administrativas.
3. El sistema calcula al instante los subtotales, propinas e impuestos. Sin errores humanos ni sumas manuales.

### Flujo para la Cocina (Tickets)
1. Al confirmar la orden, esta se envía automáticamente a las pantallas o impresoras de cocina.
2. Cada ticket ingresa con indicaciones claras sobre variantes (ej. *Término medio*, *Sin cebolla*).
3. Todo es fluido, ordenado y rápido, garantizando que el platillo llegue perfecto a la mesa.

---

## 📄 Facturación Electrónica e Integración SUNAT

Viw-Carta se conecta de forma nativa con los proveedores líderes de facturación electrónica en el Perú (como Nubefact y Efact) para emitir boletas y facturas oficiales a SUNAT sin fricciones.

### Configuración del Proveedor y Credenciales
Los administradores pueden configurar o actualizar sus datos de conexión directamente desde el panel:
1. Dirígete a **Perfil del Negocio**.
2. Ve a la tarjeta **Datos Fiscales e Impuestos**.
3. En la sección **Credenciales del Proveedor de Facturación**, podrás:
   - Elegir el **Proveedor Fiscal** (`Nubefact` o `Efact`).
   - Ingresar el **API Endpoint** y la **Clave de Acceso/Token API** de tu cuenta (demo o producción).
4. Guarda los cambios. A partir de ese momento, cada comprobante emitido desde el módulo de **Finanzas** utilizará tus propias credenciales oficiales.

> [!TIP]
> **Enmascaramiento de Claves:** Para proteger tus claves de accesos oficiales, la interfaz enmascara automáticamente el token API. Puedes hacer clic en el botón del ojo para revelar el texto si necesitas realizar verificaciones de correspondencia.

### 🔄 Flujo de Pago y Timbrado en Caliente (Sincronizado)
En Viw-Carta, la velocidad del mesero y la tranquilidad del cliente son primordiales. Hemos sincronizado el registro del pago y el timbrado fiscal oficial en un solo flujo continuo y elegante:
1. **Registro del Pago:** Al hacer clic en **Procesar Pago**, la caja de Viw-Carta asegura inmediatamente el registro del dinero en tu base de datos y sesión de caja activa.
2. **Espera de Timbrado (CPE):** Si la orden es una Boleta o Factura, el sistema muestra una pantalla premium de carga (*"Timbrando CPE ante SUNAT..."*). Esta pantalla te mantiene al tanto en tiempo real del progreso técnico del timbrado con el OSE.
3. **Impresión Automática con QR Legible:** En cuanto la SUNAT devuelve el código de aprobación (Hash), el sistema abre la ventana de impresión automáticamente.
   - El ticket físico ahora incluye un **código QR 1:1 proporcional real** generado en alta fidelidad. Es 100% escaneable desde celulares o lectores térmicos, y cumple con el estándar de SUNAT (incluye RUC, serie, número, IGV, total y hash).

### 🛡️ Plan de Contingencia ante Fallos de Conectividad o Rechazos
Sabemos que la SUNAT o el internet pueden fallar en el momento menos oportuno. Para que tu negocio nunca se detenga, si ocurre un error de timbrado, Viw-Carta te ofrece tres opciones inmediatas en pantalla:
* **Reintentar Timbrado:** Ideal si el fallo fue un micro-corte de internet. Intenta emitir el documento ante el OSE nuevamente en caliente.
* **Imprimir Respaldo Local (Recomendado en Emergencias):** Imprime inmediatamente un ticket local interno (Nota de Venta de respaldo) para entregar al cliente sin hacerlo esperar. La orden quedará marcada como "pagada" en tu caja y podrás re-emitir el comprobante a la SUNAT con un solo clic más tarde, desde tu panel de **Finanzas > Comprobantes Pendientes**, cuando el servicio se restablezca.
* **Omitir e Ir al Inicio:** Cierra la pantalla de control para seguir atendiendo a otros clientes en la fila.
