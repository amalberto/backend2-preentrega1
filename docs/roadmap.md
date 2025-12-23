# Roadmap Front (Handlebars + JS) — Backend2

Objetivo: agregar UI para operar las mismas funcionalidades que la API:
- Ver productos (público)
- Login/Register + sesión JWT en cookie (currentUser)
- Carrito: crear/usar, agregar, editar qty, eliminar ítems, vaciar
- Compra: /purchase, ticket resultante + unprocessedProducts
- Admin: panel + CRUD productos desde UI (usando la API)

> Nota importante: como el JWT vive en cookie HTTP-only, los `fetch()` deben usar:
> `credentials: "include"` para que viaje la cookie.

---

## Fase 0 — Preflight (debe quedar sólido antes de sumar features)

### Commit F0-01 — Error handler consistente
- Fix: middleware de error soporta `err.statusCode` además de `err.status`

### Commit F0-02 — “Wiring” de vistas de auth (evitar que el browser muestre JSON)
Elegí 1 enfoque:

**Enfoque A (recomendado, “pro”):** rutas de vistas que redirigen
- `POST /users/register` crea usuario y redirige a `/users/login?registered=1`
- `POST /users/login` hace login, setea cookie y redirige a `/products`

**Enfoque B:** mantener API JSON y manejar redirect con JS en el front
- interceptar submit en `login/register` y redirigir con `window.location`

---

## Fase 1 — Base UI + sesión

### Commit F1-01 — “Session bootstrap” en el front
Crear helper JS:
- `public/js/session.js`
  - `GET /api/sessions/current` (con credentials include)
  - retorna user/role o 401
  - permite mostrar/ocultar botones (“Perfil”, “Admin”, “Logout”)

Integración:
- inyectar `<script src="/js/session.js"></script>` en layouts/vistas necesarias.

---

## Fase 2 — Productos + “Agregar al carrito”

### Commit F2-01 — Botón “Agregar al carrito” en /products
Archivos:
- `src/views/products.handlebars` (agregar UI del botón + qty opcional)
- `public/js/products.js` (nuevo o extender el actual)
Flujo:
1. Si no hay sesión → redirigir a `/users/login`
2. Conseguir cartId:
   - opción 1 (rápida): guardar `cartId` en localStorage cuando se crea
   - opción 2 (mejor): que el backend garantice `user.cart` (ver F2-02)
3. `POST /api/carts/:cid/products/:pid` con `{ quantity }`

### Commit F2-02 (recomendado) — “Ensure cart” para el usuario
Para que el front no “adivine” el cartId, lo ideal es:
- al registrar/login: si `user.cart` es null → crear carrito y guardarlo en user
- o exponer endpoint tipo `POST /api/carts/mine` que cree/retorne el carrito del usuario

> Esto vuelve el front mucho más simple y evita inconsistencias.

---

## Fase 3 — Vista de carrito (CRUD del carrito)

### Commit F3-01 — `GET /my-cart` (vista) + JS
Archivos sugeridos:
- `src/views/cart.handlebars` (nuevo)
- `public/js/cart.js` (nuevo)
Acciones:
- Render de items: `GET /api/carts/:cid`
- Update qty: `PUT /api/carts/:cid/products/:pid` body `{ quantity }`
- Remove item: `DELETE /api/carts/:cid/products/:pid`
- Clear cart: `DELETE /api/carts/:cid`

UX:
- mostrar subtotal por ítem
- total estimado
- botones +/− y “Eliminar”

---

## Fase 4 — Compra + Ticket

### Commit F4-01 — Botón “Finalizar compra”
- `POST /api/carts/:cid/purchase`
- Mostrar resultado:
  - `ticket` (si hubo procesados)
  - `unprocessedProducts` (si compra parcial o fallida)
- Actualizar vista del carrito luego de comprar

Archivos:
- `public/js/cart.js` (agregar handler purchase)
- opcional: `src/views/purchaseResult.handlebars` (si querés página separada)

---

## Fase 5 — Tickets (opcional, si querés “historial” real)

Situación: hoy típicamente el ticket solo vuelve por response de purchase.
Si querés “Mis compras”:
- crear API de tickets:
  - `GET /api/tickets/mine` (user) → por purchaser
  - `GET /api/tickets/:code` (user) → por code (si corresponde)

Luego:
- `src/views/tickets.handlebars`
- `public/js/tickets.js`

---

## Fase 6 — Admin UI (panel + CRUD productos)

### Commit A1-01 — Panel Admin (mail checks)
- Vista `/admin-panel`
- Botones:
  - `GET /api/mail/status`
  - `GET /api/mail/status/smtp`
  - `POST /api/mail/test` (admin)

### Commit A1-02 — CRUD productos desde UI (admin)
Vistas sugeridas:
- `src/views/adminProducts.handlebars`
- `public/js/adminProducts.js`

Acciones:
- List: `GET /api/products`
- Create: `POST /api/products` (admin)
- Update: `PUT /api/products/:pid` (admin)
- Delete: `DELETE /api/products/:pid` (admin)

---

## Fase 7 — Polish final
- README actualizado + `.env.example`
- limpieza de archivos temporales
- checklist de pruebas manuales (roles, purchase, reset password, mailing)