empecé Fase 2 / Commit F2-01 (Agregar al carrito desde /products) usando el enfoque rápido con localStorage para guardar el cartId (sin tocar backend todavía).

Qué quedó implementado en este commit (F2-01)

En /products ahora cada producto tiene:

input de cantidad

botón “Agregar al carrito”

Si el usuario no está logueado → al intentar agregar, redirige a /users/login

Si no existe cartId en el browser → crea carrito con POST /api/carts, guarda el id en localStorage y luego agrega el producto.

Muestra feedback con un notice (“✅ Agregado al carrito…”, errores, etc.)

De paso, dejé el logout en /products como POST real (/api/users/logout) en vez de onclick.

Archivos tocados

src/views/products.handlebars (agrega notice + incluye script externo + logout por POST)

public/js/products.page.js (nuevo: render catálogo + add-to-cart)

public/css/styles.css (estilos de qty + notice + acciones de carrito)