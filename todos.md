Funcionalidades y pendientes:

- Arreglar el redireccionamiento de la página 404
- Cambiar de nombre a la colección, 'restaurants' por 'business'.

-------------------------------- POST PRODUCTION --------------------------------------------------------

[para hoy]

## Funcionalidades generales

# Seguridad

- [x] Asegurar en el backend los endpoints sensibles que no deben ser publicos, pues /api esta abierto.
- [x] Cuando no hay una sesión, la pagina sin importar eso carga los datos y no redirige a login hasta que se intenta una acción que llame al chequeo de session.

# Rendimiento

- Terminar de arrgelar el ISR, pienso que no esta funcionando como debe y no se que más hacer.

# Botones

// - Mejorar el grupo de botones de acción, empezar con un botón para mirar la carta.

# Navbar

- Arreglar conjuntos de herramientas.

## Centro de ajustes.

# Business Profile

<!-- - los bordes de los inputs deben contrastar con su fondo. -->

- Al editar los datos del perfil, el botón de guardado solo debe mostrarse si ocurren cambios.
- El botón de acción guardar/editar debe estar anexado al botón viw de acción.

## Textos (considerar renombrar esta herramienta principal)

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
- Establecer un loadre para el botón de crear/guardar producto.

# Categorías

- CONSIDERAR si en la seleccion de categorias del master, al deseleccionar todas que el comportamiento sea seleccionar todas.
- Al crear categorías: mejorar la generación de recomendación de código de categoria.
- Hay un error al cancelar la eliminación de una categoría.

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
