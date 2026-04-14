# Viw-Carta: The Intelligent Restaurant Management System

**Viw-Carta** es una plataforma profesional para la gestión de restaurantes, que combina un menú digital avanzado de cara al cliente con un potente backoffice (POS, finanzas y control de inventarios). La estética y la funcionalidad deben transmitir extrema calidad técnica, seguridad financiera y una asombrosa experiencia de usuario.

---

### 🎨 Diseño y UX (Aesthetic)
- **Modo Oscuro Premium:** Toda la interfaz del Dashboard debe adherirse a un Dark Mode pulido. Utiliza fondos sólidos oscuros (ej. `bg-[#1c1b1b]`), bordes sutiles (`border-[#3d4947]`) y acentos de brillo vibrante como menta/teal (`text-[#70d8c8]`) para acciones primarias, o colores pastel rojos/rosados (`#ffb4ab`) para alertas destructivas.
- **Componentes Nativos Prohibidos:** Está ESTRICTAMENTE PROHIBIDO utilizar popups nativos del navegador como `window.alert()`, `window.confirm()` o `window.prompt()`. Cualquier flujo interactivo, error o alerta debe manifestarse a través de modales bellamente estilizados usando React/Tailwind.
- **Animaciones y Micro-acciones:** Usa transiciones fluidas en hover (`transition-all`) y opacidades variables para lograr ese feel de sistema vivo.

---

### 🛡️ Arquitectura y TypeScript
- **Cero Tolerancia a `any`:** Está absolutamente prohibido el uso de la palabra clave `any`. Si un tipo no es conocido inmediatamente, usa `unknown` o `Record<string, unknown>`.
- **Interfaces Obligatorias:** Cada vez que trabajemos con un objeto (órdenes, clientes, sesiones, pagos), su contrato debe ser tipeado explícitamente mediante una `interface` en la cabecera del archivo o provisto de manera exportable. 
- **Verificación Asíncrona (Next.js 15):** Recuerda que métodos como `searchParams` y los parámetros dinámicos de ruta de Next.js 15 (`params`) exigen resolverse mediante Promesas (`await`).

---

### 💼 Lógica de Negocio y Backend
- **Control de Acceso (RBAC):** Toda nueva ruta de API interna o vista de backoffice debe estar estrictamente vigilada bajo los Roles (Admin, Cocina, Waiter). Nunca asumas que el usuario tiene acceso universal.
- **Husos Horarios Cautelosos:** Dado el carácter financiero de la plataforma, todas las consultas históricas de la base de datos de MongoDB deben compensar estrictamente el Timezone local de la operadora (ej. GMT-05:00 de Perú), para evitar el "desplazamiento de medianoche" a nivel UTC donde ventas pasadas las 7 PM pasen falsamente al día siguiente.
- **Seguridad en Integraciones Contables:** Todos los cálculos matemáticos críticos (subtotales, recargos dinámicos e impuestos) deben computarse rigurosamente tanto en Frontend como en los endpoints del back-end.