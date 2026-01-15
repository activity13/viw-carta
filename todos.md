# Nuevas funcionalidas

- Cambiar de nombre a la colección, 'restaurants' por 'business'.

  # Sistema de control de suscripciones y manejo de clientes

  Posibles soluciones:

  - Agregar un apartado a la super-admin page
  - Agregar una subruta que se accede desde la super-admin page
  - Agregar una ruta nueva dedicada al manejo de clientes y sus suscripciones

  ¿Que debe hacer?

  - Ver una lista de los clientes registrados en VIW-CARTA
  - Caja de herramientas básica para control de clientes
  - Perfil del cliente donde se pueda ver con más detalles dicho cliente.

  MISIÓN: Desde un perfil de experto en maquetación MongoDB (mongoose) define la mejor solución. Revisar lo que yo propongo que haga, y complementar y/o corregir lo que debe hacer una pagina de este tipo con funciones básicas de control.

  ## Solución recomendada (arquitectura)

  - Mantener `/backoffice/super-admin` como **Dashboard** (stats + invitaciones).
  - Agregar una **subruta dedicada**: `/backoffice/super-admin/customers`.
  - Agregar un **perfil por cliente**: `/backoffice/super-admin/customers/[restaurantId]`.

  Motivo: el dashboard actual ya existe y crece rápido; separar “Clientes/Suscripciones” evita una página monolítica y permite permisos/queries dedicadas.

  ## Definición de “cliente” (tenant)

  - Cliente = `Restaurant` (tenant) + sus `User` asociados (`User.restaurantId`).
  - `Restaurant.ownerId` debe representar el usuario “principal” cuando exista (si es null, resolverlo buscando el `admin` del tenant).

  ## Modelo de suscripción (Mongoose)

  Estado actual: `Restaurant.plan` solo distingue `standard|premium`.

  Propuesta mínima y escalable: agregar `Restaurant.subscription` (subdocumento) y mantener `plan` por compatibilidad:

  - `subscription.plan`: `standard|premium` (fuente de verdad a futuro)
  - `subscription.status`: `trialing|active|past_due|canceled|paused` (o el set que prefieras)
  - `subscription.startedAt`, `trialEndsAt`, `currentPeriodEnd`
  - `subscription.provider`: `manual|stripe` (u otros)
  - `subscription.providerCustomerId`, `subscription.providerSubscriptionId` (opcionales)
  - `subscription.notes`: notas internas
  - `subscription.audit[]`: { at, byUserId, change, note } (historial mínimo de cambios)

  Índices sugeridos:

  - `slug` unique (ya existe)
  - `plan` y/o `subscription.plan`
  - `subscription.status`
  - `subscription.currentPeriodEnd`

  ## ¿Qué debe hacer la UI? (funciones básicas)

  **Lista de clientes** (`/backoffice/super-admin/customers`)

  - Buscar por `name`, `slug`, email de owner (via lookup a `User`).
  - Mostrar: nombre, slug, plan/estado, owner, #usuarios activos.
  - Acciones rápidas: abrir perfil, cambiar plan/estado (si es manual), desactivar acceso.

  **Perfil del cliente** (`/backoffice/super-admin/customers/[id]`)

  - Resumen del negocio (name/slug/contacto).
  - Caja “Suscripción”: editar plan/estado/fechas/notas.
  - Usuarios del tenant: listar y permitir `activar/desactivar` + cambiar rol.
  - Métricas mínimas (si existen colecciones): #categorías, #platos, #órdenes.

  ## API admin (backend)

  - `GET /api/admin/customers`: lista + búsqueda + paginación.
  - `GET /api/admin/customers/[id]`: detalle (Restaurant + Users + counts).
  - `PATCH /api/admin/customers/[id]`: actualizar `subscription` (y sincronizar `plan` legacy si aplica).
  - `PATCH /api/admin/users/[id]`: toggles básicos (`isActive`, `role`).
  - Todo protegido por `getServerSession(authOptions)` y rol `superadmin`.

  ## Backfill / Migración

  - Para tenants existentes: `subscription.plan = plan`, `subscription.status = active` por defecto.
  - Si falta `ownerId`: asignar el primer usuario `admin` del tenant.

  # Sistema de generación de ventas.

  Contexto: Dado que viw-carta cuenta con un plan premium, me gustaria integrar un sistema de pedidos/ordenes básico y super útil. QUe ayude al usuario del negocio a generar pedidos y poder anotarlos y cobrarlos rápido.

  Solución propuesta:

  El inicio de la backoffice muestra la lista de platos, podemos usar esa mismo esquema de visualización de datos para agregar una opción de agregar al pedido. Previamente el botón de generación de pedido estará integrado en el smart-fab y será tan simple como apretarlo para generar una orden/pedido. El sistema no estará basado en stock por lo que la venta multi device es un requerimiento muy facil de lograr. El sistema debe tener un botón de orden en espera que permita almacenarlo en espera por si hay otra cuenta que cobrar al mismo tiempo.

  Los datos importantes, por lo menos los que se me ocurren en este momento son:

  - identificador facil de recordar de pedido.
  - nombre de cliente
  - tipo y numero de documento si se requiere (pasaporte, dni, ci, carné de conducir, CE)
  - lista de platos/productos de la orden con un input para editar las cantidades y un selector de +- para agregar o quitar una unidad.
  - forma de pago que sea un array de par tipo/cantidad con logica para llegar al total de la cuenta
  - botón de pagar cuenta cuando se haya registrado el pago.

    # Proximos pasos:

    - Agregar logica de validación de documentos de identidad según parametros de peru.
    <!-- - Agregar campo para número de mesa en la orden. -->
    - sistema de cuentas de crédito para clientes especiales.

    # Observaciones de desarrollo

       <!-- - Las notificaciones están cubriendo el fab button haciendo que se pierda tiempo en la espera que desaparezcan para volver a apretar el fab button.  -->
       <!-- -  A medida que incrementa la lista de productos el modal baja y se vuelve inaccesible accionar. -->
       <!-- - Al poner orden activa le botón fab sigue mostrando el botoón de ordenes en espera y no podemos seguir con la venta hasta que se refresca y carga el botón de orden activa.   -->

    Experimento:

    1. Genero una orden y la pongo en espera.
    2. Genero una segunda orden y la pongo en espera.
    3. Refresco la página
    4. Activo la primera orden.
    5. Refresco la página
    6. La vulevo a poner en espera.
    7. Genero una tercera orden.

    # Modo de Uso

    Paso 1. Pulsar el botón de botón de acción.
    Paso 2. Pulsar el botón de Nueva Orden.
    Paso 3. Registrar al cliente y guardar sus datos.
    Paso 4. Agregar los productos desde la lista general pulsando sobre el botón "+"
    Paso 5. Registrar las formas de pago que igualen la cuenta total.
    Paso 6. Finalizar pulsando el botón de pago.

    Casos especiales.
    Poner una orden en espera.
    Paso 1. Pulsar el botón abajo a la izquierda "Orden en espera"
    Paso 2. Pulsar el botón de botón de acción.
    Paso 3. Pulsar el botón de Ordenes.
    Paso 4. Activar la orden deseada
    Paso 5. Pulsar el botón de acción.
    Paso 6. Seguir con la venta.
    Paso 7. Para activar otra orden se debe poner en espera la activa y repetir los pasos.

# Sistema de control de suscripciones

- Este sistema se maneja desde el superadmin. cuando un usuario registra el pago de suscripción, el equipo de viw-carta muy diligentemente registraán y activaran la suscripción del cliente.
- El sistema debe ser capaz de habilitar/inhabilitar funciones y accesos a rutas.
- El sistema debe alertar a los clientes sobre estados de membresía, proxima facturación: fecha y monto y un enlace para que vea como pagar.
- El sistema también debe alertar a los clientes morosos que que sus suscripción está cerca a la fecha de corte y deben pagar. LLegada la fecha de corte y el no pago, en el backoffice solo se podrá logear y acceder a la pagina de billing y la carta mostrara el anuncio de negocio disponible en este momento.
  ---------------------------------------- FAST MARKET --------------------------------------------------------------------------------

# Estilo

<!-- - [x] El custom style de fast-market no está aplicando sobre los modals de carrito y detalles del producto. -->

# Destacados

<!-- - [x] Será un nuevo componente de la sección de la página que mostrará los productos highlighteados, alguna información especial y relevante, algun anuncio, etc. Se mostrará como un slider minimalista y muy bien hecho. La idea es que la primera impresión sea la de ver este escaparate y justo abajo muy bien puesto se mostrará fila de categorías.
- [x] Nombre del componente: ShowcaseCarousel. -->

# Categorias

<!-- - [x] El como se muestran las categorías está mal. Para empezar se debe agregar espacio entre ellas.
- [x] En vista de tablet/escritorio el ancho del componente corta las primeras y últimas categorías dando una mala imagen.
- [x] Separar la barra de busqueda de las categorias. La barra debe ir directo en el navbar (que actualemnte esta en integrada en el layout de la pagina). La busqueda debe cumplir la misma función que ahora hace. -->

# Ordenes Express

<!-- - [x] Vamos a dar por terminada la funcionalidad de nombre clave: Refactorizar todos los componentes que tratan este tema. ELiminar archivos que hayan estado dedicados completamente a la función. -->

----- GEneral ------

## Funcionalidades generales

# Seguridad y sistemas de redirección

<!-- - [x] Asegurar en el backend los endpoints sensibles que no deben ser publicos, pues /api esta abierto.
- [x] Cuando no hay una sesión, la pagina sin importar eso aacede a la ruta, no redirige a login hasta que se intenta una acción que llame al chequeo de session.
- Probar la implementación de cambio de contraseña. Iniciar sesión en dos pestañas, cambiar la contraseña en una, revisar si los cambios surtieron efecto, refrescar la segunda a pestaña.
- [x] Al visitar viw-carta.com me manda al login. Comportamiento esperado: que cargue la landing page para mostrar el producto a cualquier persona.
- [x] app.viw-carta.com siempre deberá mostrar el login si se está no-logeado y redigirgir al home de la backoffice luego de verificar el acceso. Actualmente lleva a la landing Page. Además al logearme me redirige de nuevo a la landing, es como si el comportamiento que hace que si uno está no-logeado y aacede a una ruta protegida, el sistema luego de logearte te lleva a esa primera locación, lo cuál está bien pero no en el caso por ejemplo de la landing. -->

# Rendimiento

- Terminar de arrgelar el ISR, pienso que no esta funcionando como debe y no se que más hacer.

# Botones

// - Mejorar el grupo de botones de acción, empezar con un botón para mirar la carta.

# Navbar

- Arreglar conjuntos de herramientas.

## Centro de ajustes.

# Business Profile

<!-- - los bordes de los inputs deben contrastar con su fondo. -->

- El botón de acción guardar/editar debe estar anexado al botón viw de acción.
- Si el usuario es premium el componente de selección tema/fuente no se debe mostrar.

## Textos (considerar renombrar esta herramienta principal)

# Mensajes

- EL modulo de mensajes me parece que debería cambiar de nombre, mensajes me suena como a que ahi me escribiran y yo podre de alguna manera responder. La palabra no encaja con la funcionalidad que es la de informar a traves de textos marketeados o informativos colocados estrategicamente en la carta custom del cliente. Propongo que el módulo se renombre a Textos (por favor, haz un análisis sobre cuál sería la palabra más adecuada para este módulo)
- Se debe permitir eliminar textos, al hacerlo un confir m salta para advertir que

# Traducciones

- La traducción automática no esta funcionando sobre los mensajes.
<!-- - Loaders pendientes: Traducciones individuales de categorías y platos.
- Las traducciones de categorías editadas a mano son sobrescritas cuando se ejecuta la traducción automática, corregier ese comportamiento. -->

## Centro de Super Admin

- el panel de super-admin debe tener la capacidad de manejar a los clientes.

## Home

## Form Section de platos/productos.

- Distinguir entre comidas, bienes y servicios y segun se indique mostrar un modelo de datos determinado.
- Hacer funcional el formulario en su totalidad: almacenado de todos los campos segun se desee y subida de hasta 3 imágenes por producto.
<!-- - Establecer un loader para el botón de crear/guardar producto. -->

# Categorías

- Al crear categorías: mejorar la generación de recomendación de código de categoria.
- Hay un error al cancelar la eliminación de una categoría.

// - CONSIDERAR si en la seleccion de categorias del master, al deseleccionar todas que el comportamiento sea seleccionar todas.
// - En la página dedicada a las categorías agregar: toasts para mensajes de información de operación. Agregar Loaders. Aqui se sigue usando el término slug para indicarle al usuario que agregue uno para la descr. cambiar por un término amigable para el usuario. Refactorizar la UI basado en los ultimos diseños de la marca viwpowered.

// - Cambiar en el selector de categoria de master que cuando se seleccione una categoria estando todas habilitadas, se seleccione sola esa y que las demás se deseleccionen. se mantendrá el comportamiento de doble click para habilitar todas, pero no el doble click para deshabilitar todas.
// - Agregar botón para ir a la página de editor de categorías /backoffice/categories
// - la elección de la paleta de colores es solo para cartas genéricas.
// - El sistema de generación qr debe mirarse: deberia generarse una sola vez el QR, se puede inhabilitar el botón o trsladar module para operaciones del staff.
//- la palabra slug debería redefinirse como subdominio, o que termino usar que no sea slug.
//- Los placeholders no deben mencionar ni referir a negocios de la zona, todos los placeholders deben ser ficticios, y ante cualquier casualidad yo te informaré.
//- menu online debería ser subodminio, indicando la posesión de un subdominio unico.
//- en onboarding/categorías, cuando el nombre de la categoría es muy largo los botones de edit y eliminar se salen de la tarjeta.
//- Mejor el slug generator de las categorías, podría ponerse el nombre del negocio al final?
//- en onboarding/productos, cambiar el color del tema a otro más xvre.
//- el botón de eliminar plato no sirve.
