# Arquitectura de Viw-Carta

Viw-Carta es una plataforma integral SaaS B2B2C para la gestión de restaurantes, que ofrece un menú digital (QR) para clientes finales y un backoffice robusto (POS, finanzas, control de inventario) para el personal del restaurante.

## 1. Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Frontend**: React 19, Tailwind CSS v4, shadcn/ui (Radix UI), Framer Motion para animaciones.
- **Backend**: API Routes de Next.js, Mongoose (MongoDB) para persistencia de datos.
- **Autenticación**: NextAuth.js v4 con estrategia JWT y Credentials Provider.
- **Servicios Externos**:
  - Resend (Envío de correos)
  - UploadThing (Subida y almacenamiento de imágenes/archivos)

## 2. Arquitectura Multi-Tenant (Subdominios)

La plataforma utiliza una arquitectura multi-tenant basada en subdominios, gestionada en el `middleware.ts` en el edge:
- **`viw-carta.com`**: Dominio raíz, expone la Landing Page pública para captar clientes (restaurantes).
- **`app.viw-carta.com`**: Subdominio de aplicación donde el personal (Admin, Waiter, Kitchen) accede al Backoffice (Dashboard, Login, Onboarding).
- **`[slug].viw-carta.com`**: Subdominio para clientes finales de cada restaurante. Redirige dinámicamente a la carta digital pública del restaurante asociado a ese `slug`.

El `middleware.ts` intercepta todas las peticiones, parsea el subdominio y reescribe (`NextResponse.rewrite`) la ruta subyacente (`/[subdomain]/...`), protegiendo además las rutas internas verificando la sesión a través del token de NextAuth.

## 3. Modelo de Datos (MongoDB)

Ubicado en `src/models/`, el backend usa esquemas de Mongoose con un enfoque de "Single Database / Shared Schema con Tenant ID". Esto significa que todos los datos residen en la misma base de datos, separados por un `restaurantId`.

- **Restaurant**: Entidad principal del negocio.
- **User**: Usuarios del backoffice con Roles (Admin, Cocina, Waiter). Pertenece a un `restaurantId`.
- **Order**: Órdenes de mesa. Controla el estado (`active`, `paid`, `cancelled`), subtotales e impuestos.
- **CashSession**: Cajas registradoras. Las órdenes no pueden crearse si no hay una sesión de caja abierta (`status: "open"`).
- **Meals / Categories / Variants**: Inventario del restaurante para el menú.

## 4. Flujo de Autenticación y Autorización (RBAC)

El archivo `src/lib/auth.ts` define la lógica de inicio de sesión:
1. **Login**: Se ingresa username/password. El backend hace un hash check con `bcryptjs` sobre la colección de usuarios.
2. **JWT**: Se guarda en el token la ID, rol, `restaurantId` y el estado de la suscripción del restaurante.
3. **Session Check**: En el callback de sesión, se verifica en cada request la integridad de la base de datos (por si se desactivó al usuario o si su contraseña cambió, `passwordChangedAt`, invalidando su token).
4. **RBAC**: A través de middlewares y wrappers (ej. `requireAuth("waiter")`), las API restringen el acceso a operaciones destructivas según el rol.

## 5. Módulo Financiero y POS (Orders)

La creación y manejo de órdenes (`src/app/api/orders/route.ts`) implementa reglas de negocio financieras:
- Al abrir una orden, el sistema busca en la colección `CashSession` una caja activa para el `restaurantId`. Si no existe, lanza un error 403 `NO_OPEN_SESSION`, bloqueando ventas que no puedan rastrearse contablemente.
- Los IDs de los tickets/órdenes son autoincrementales manejados por la colección `Counter` con transacciones atómicas (`$inc`).
- Los cálculos financieros (subtotales, recargos dinámicos, impuestos) se ejecutan mediante funciones deterministas en `src/lib/order-utils.ts` (`calculateOrderTotal`, `calculateAdjustmentAmount`) para evitar diferencias de redondeo en JavaScript (`Math.round(value * 100) / 100`).

## 6. Frontend y UX/UI (Estética y Diseño)

- **Dark Mode Premium**: Toda la UI administrativa corre sobre una paleta en modo oscuro, utilizando variables configuradas de Tailwind.
- **Gestión de Estado**: Componentes con uso extensivo de `useState` y React Query para invalidación y refetching asíncrono.
- **Tickets**: El sistema no usa PDFs complejos, sino que genera HTML estructurado on-the-fly (`buildTicketHtml`) para impresión térmica (`printHtmlTicket`), inyectado en una ventana de iframe y enviado al driver de impresión del navegador. Evita popups nativos molestos en favor de diálogos de `shadcn/ui`.
