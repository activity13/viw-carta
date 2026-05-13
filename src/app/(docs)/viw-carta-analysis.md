# Estudio Técnico y de Mejora Continua: Infraestructura Viw-Carta

Este documento analiza la arquitectura actual de **Viw-Carta** (basado en el archivo `ARCHITECTURE.md` y el código fuente examinado), identifica posibles riesgos de seguridad, cuellos de botella en escalabilidad y propone soluciones técnicas orientadas a construir una plataforma de clase mundial, segura y centrada en una experiencia de usuario fluida.

---

Si me pides que implemente todas estas mejoras de golpe, aquí tienes mi evaluación franca y técnica de las probabilidades y los riesgos involucrados:

1. Probabilidad de bugear la app a un punto crítico (Difícil de recuperar): Baja (Si usamos Git) / Alta (Si somos imprudentes)
   Seré completamente transparente: intentar hacer todos estos cambios el mismo día en tu rama principal (main) es un suicidio técnico.

El cambio más peligroso es el Patrón de Centavos (Finanzas). Cambiar la forma en que la base de datos guarda el dinero (de decimales a enteros) significa que todo componente que lea o escriba un precio (el carrito, la creación de menú, el renderizado del ticket, el dashboard de ganancias) se va a romper temporalmente.

Sin embargo, la probabilidad de "no poder sacarla adelante" es prácticamente 0% si seguimos las reglas de oro de la ingeniería:

Control de Versiones (Git): Nunca trabajaremos en main. Crearemos ramas aisladas (ej. feat/financial-refactor). Si algo sale terriblemente mal, simplemente borramos la rama y volvemos a la versión estable en un segundo.
Migración de Datos: Si ya tienes datos reales en MongoDB (órdenes o platos creados con decimales), tendré que escribir un script de migración para convertir todos los 15.50 existentes a 1550 antes de aplicar el nuevo código, para no corromper la BD. 2. Probabilidad de cubrir todo con éxito y lograr el objetivo: 95% (Con ejecución por Fases)
Soy perfectamente capaz de escribir el código para cada uno de esos puntos. La probabilidad de éxito es altísima siempre y cuando dividamos el trabajo en fases quirúrgicas y testeamos cada una antes de pasar a la siguiente.

Si me das luz verde, no haría un "Big Bang". Te propondría este orden exacto de ataque (del menos riesgoso al más profundo):

Fase 1: Victorias Rápidas y UX (Riesgo Bajo). Implementar el caché (ISR) en el menú de los clientes y refactorizar el Ticket para usar un componente React invisible en lugar del Iframe (Eliminar el riesgo de inyección XSS).
Fase 2: Blindaje de Seguridad Multi-Tenant (Riesgo Medio). Modificar los modelos de Mongoose para inyectar automáticamente el restaurantId. Aquí tendríamos que testear bien que el Dashboard siga cargando tus datos correctamente.
Fase 3: Optimización del NextAuth y Sesiones (Riesgo Medio). Limpiar la lógica de sesión para dejar de golpear MongoDB en cada click, implementando una caché simple o modificando los callbacks.
Fase 4: Cirugía Abierta - El Refactor Financiero (Riesgo Alto). Migración de la BD al patrón de Centavos y re-escritura de las matemáticas en order-utils.ts.
Veredicto
Podemos hacerlo y dejar la plataforma en un nivel técnico de élite corporativa. Pero requiere que actuemos como un equipo de ingeniería maduro: avanzamos un ticket a la vez, validas en tu entorno local que todo funcione, hacemos el commit, y pasamos al siguiente problema.

¿Por cuál de estas fases te gustaría que empecemos a meter mano al código?

## 1. Autenticación y Rendimiento de Sesiones (NextAuth)

### 🔴 Estado Actual y Problema

Actualmente, el sistema utiliza **JSON Web Tokens (JWT)** para la sesión. Sin embargo, en el callback de `session()` (en `src/lib/auth.ts`), se realiza una consulta a MongoDB por **cada petición** para verificar si el usuario sigue activo (`isActive`) o si cambió su contraseña (`passwordChangedAt`).

- **Lo que está mal:** Consultar la base de datos en cada request anula por completo la ventaja de rendimiento de usar JWT (que es _stateless_). En un entorno de alto tráfico (ej. 50 meseros pidiendo datos simultáneamente en varios restaurantes), esto creará un cuello de botella masivo en la base de datos y aumentará la latencia (lentitud) percibida por el usuario.

### 🟢 Solución Propuesta

1.  **JWT de Corta Duración + Refresh Tokens:** Haz que el JWT expire en 15 minutos. Si el token es válido, asume que el usuario tiene acceso (cero consultas a la BD). Cuando expire, usa un Refresh Token silencioso para generar uno nuevo, y **solo en ese momento** consulta la BD para ver si el usuario sigue activo.
2.  **Caché en Memoria (Redis):** Si prefieres mantener JWTs largos, implementa **Redis** (ej. Upstash) para guardar una "lista negra" de usuarios desactivados o contraseñas cambiadas. Leer de Redis toma milisegundos y libera a MongoDB de carga innecesaria.

---

## 2. Precisión Financiera (Módulo POS)

### 🔴 Estado Actual y Problema

El cálculo de dinero en `src/lib/order-utils.ts` usa `Math.round(value * 100) / 100`.

- **Lo que está mal:** Aunque el redondeo mitiga el problema, JavaScript usa aritmética de coma flotante IEEE 754. Cálculos complejos con porcentajes (descuentos, impuestos) pueden generar errores de precisión microscópicos que, al acumularse en miles de órdenes, descuadran los reportes contables (ej. `0.1 + 0.2 = 0.30000000000000004`). En sistemas financieros esto es inaceptable.

### 🟢 Solución Propuesta

- **Patrón de Centavos (Integer Math):** Almacena **todos** los precios en la base de datos como números enteros representando centavos (ej. S/. 15.50 se guarda como `1550`).
- Toda la matemática (suma, resta, impuestos) en el backend y frontend se hace con números enteros.
- **Solo al momento de renderizar** en la UI, divides entre 100 (`(1550 / 100).toFixed(2)`). Esto elimina el 100% de los errores de coma flotante y garantiza seguridad financiera.

---

## 3. Seguridad Multi-Tenant (Aislamiento de Datos)

### 🔴 Estado Actual y Problema

El sistema usa un modelo de "Shared Schema / Single Database". Para separar los datos de un restaurante de otro, se filtra por `restaurantId`.

- **Lo que está mal:** Si un desarrollador junior crea un nuevo endpoint y olvida añadir `where({ restaurantId: session.user.restaurantId })` en la consulta a MongoDB, **filtrará los datos de un restaurante a otro**. Esto es un riesgo crítico de privacidad de datos.

### 🟢 Solución Propuesta

- **Mongoose Middleware (Global Tenant Isolation):** Configura un _pre-hook_ en Mongoose (`schema.pre('find')`, `schema.pre('findOne')`) o utiliza AsyncLocalStorage de Node.js para inyectar automáticamente el `restaurantId` de la sesión actual en todas las consultas de lectura y escritura. Esto asegura que sea _físicamente imposible_ leer datos del "Restaurante B" si estás logueado en el "Restaurante A".
- **Índices Compuestos:** Asegúrate de que todas las colecciones principales (Orders, Meals) tengan un índice en la base de datos que comience por `restaurantId` para que las consultas sean ultra-rápidas.

---

## 4. Estabilidad en la Generación de Órdenes

### 🔴 Estado Actual y Problema

Se usa `Counter.findOneAndUpdate({ $inc: { seq: 1 } })` para generar números de orden correlativos.

- **Lo que está mal:** Si la creación de la orden falla _después_ de haber incrementado el contador (ej. un error de validación en los items), el número de orden se pierde, dejando "huecos" en la correlación de los tickets (ej. Orden #10, Orden #11, Orden #13). Para auditorías fiscales o reportes de la SUNAT, estos huecos pueden ser problemáticos.

### ✅ Solución Propuesta HECHO

- **Transacciones de MongoDB (ACID):** Envuelve el incremento del contador y la creación de la orden dentro de una **Session de Transacción de MongoDB** (`session.startTransaction()`). Si la orden falla, el contador hace _rollback_ y no se pierde el número.

---

## 5. Arquitectura del Menú Digital (Performance para Clientes)

### 🔴 Estado Actual y Problema

El cliente final escanea el QR y entra a `[slug].viw-carta.com`.

- **Posible cuello de botella:** Si un restaurante tiene 100 mesas y 400 personas escanéan el QR al mismo tiempo (ej. hora pico), golpear la base de datos de MongoDB para cargar el catálogo de platos 400 veces seguidas es muy ineficiente, especialmente porque el menú casi nunca cambia durante el servicio.

### ✅ Solución Propuesta

- **Next.js ISR (Incremental Static Regeneration):** Configura la ruta de la carta digital pública para que se genere de forma estática (SSG) con una revalidación periódica (ej. `revalidate: 60` segundos) o Revalidación Bajo Demanda (cuando el Admin edita un plato en el dashboard). Esto hará que el menú cargue en **milisegundos** desde la CDN (caché) sin tocar la base de datos, mejorando la UX radicalmente y soportando tráfico masivo.

---

## 6. UX y Seguridad Frente al Cliente (Impresión de Tickets)

### 🔴 Estado Actual y Problema

La función `printHtmlTicket` inyecta HTML on-the-fly en una ventana/iframe para imprimir.

- **Lo que está bien:** Excelente decisión evadir los popups nativos y depender del OS para la impresora térmica.
- **El Riesgo (XSS):** Si el nombre del cliente o una "nota" del pedido (`notes`) contiene etiquetas maliciosas (ej. `<script>alert('hack')</script>`), podrían ejecutarse dentro de la ventana de impresión. Aunque vi que tienes una función `escapeHtml`, la concatenación de strings para HTML siempre es riesgosa.

### ✅ Solución Propuesta

- Considera renderizar los tickets usando un componente React oculto dentro del DOM, y luego llamar a `window.print()` sobre ese contenedor (usando CSS `@media print` para ocultar el resto de la app). React sanitiza automáticamente todas las variables (protección XSS garantizada por diseño) y hace que el código sea mucho más mantenible que concatenar _Template Strings_ infinitos.
