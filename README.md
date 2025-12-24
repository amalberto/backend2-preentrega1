# Backend2 - Entrega Final

Backend con Express, MongoDB, autenticación JWT, autorización por roles, carrito de compras con TTL, stock en tiempo real, tickets con detalle de productos y mailing.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- MongoDB 6+

### Instalación

```bash
# Clonar e instalar dependencias
git clone <repo>
cd Backend2
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar
node server.js --env development
```

El servidor corre en **http://localhost:3000** por defecto.

---

## 🌐 Vistas (Frontend)

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/users/login` | Público | Formulario de login |
| `/users/register` | Público | Formulario de registro |
| `/users/current` | Autenticado | Perfil del usuario |
| `/products` | Público | Catálogo de productos |
| `/my-cart` | User | Carrito de compras |
| `/my-tickets` | User | Historial de compras |
| `/admin-panel` | Admin | Panel con tabs: Mail, Tickets, Carritos |
| `/admin-products` | Admin | CRUD de productos |
| `/forgot-password` | Público | Solicitar reset de password |
| `/reset-password` | Público | Formulario para nueva contraseña |

---

##  Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```env
# === SERVER ===
NODE_ENV=development
PORT=3000

# === DATABASE ===
MONGO_URI=mongodb://localhost:27017/backend2

# === SECRETS ===
JWT_SECRET=tu_jwt_secret_seguro
SESSION_SECRET=tu_session_secret
COOKIE_SECRET=tu_cookie_secret
SESSION_TTL_MIN=30

# === MAIL (Gmail con 2FA + App Password) ===
MAIL_SERVICE=gmail
MAIL_USER=tu-email@gmail.com
MAIL_PASS=xxxx-xxxx-xxxx-xxxx
MAIL_FROM_NAME=Backend2 App

# === PASSWORD RESET ===
RESET_PASSWORD_TTL_MINUTES=60
RESET_PASSWORD_URL_BASE=http://localhost:3000

# === CART ===
CART_TTL_MINUTES=60
```

> **Gmail**: Requiere 2FA + App Password. [Crear aquí](https://myaccount.google.com/apppasswords)

---

## 🔐 Autenticación y Autorización

### Dos familias de endpoints de Auth

Este proyecto tiene **dos conjuntos de endpoints** para autenticación:

| Familia | Base URL | Respuestas | Uso recomendado |
|---------|----------|------------|-----------------|
| **Users** | `/api/users/*` | Redirects (302) | Vistas Handlebars, formularios HTML |
| **Sessions** | `/api/sessions/*` | JSON puro | API REST, fetch desde JS, Postman |

> 📌 **Para consumir como API JSON**, usá `/api/sessions/*`. Los endpoints `/api/users/*` hacen redirects pensados para navegación con vistas.

### Roles
| Rol | Permisos |
|-----|----------|
| `user` | Ver productos, agregar al carrito, **comprar (purchase)** |
| `admin` | Ver productos, **CRUD productos**, ver usuarios/tickets/carritos, enviar mails de prueba |

> ⚠️ **Importante**: Solo `user` puede agregar productos al carrito y realizar compras. El `admin` no puede comprar, solo gestionar el catálogo.

### JWT
- Token en cookie HTTP-only firmada (`currentUser`)
- Expiración: 24h
- Estrategias Passport: `jwt`, `current`
- **En fetch**: usar `credentials: 'include'` para enviar la cookie

---

## 📚 Endpoints

### Sesiones (`/api/sessions`) - API JSON

> ✅ **Usar estos endpoints para consumo programático (fetch, Postman, etc.)**

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/register` | - | Registrar usuario → JSON |
| POST | `/login` | - | Login → JSON con datos de usuario |
| GET | `/current` | JWT | Usuario actual → JSON |
| POST | `/logout` | JWT | Cerrar sesión → JSON |

### Usuarios (`/api/users`) - Vistas/Redirects

> ⚠️ **Estos endpoints hacen redirects (302), pensados para formularios HTML**

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| POST | `/register` | - | - | Registrar → redirect a login |
| POST | `/login` | - | - | Login → redirect a /users/current |
| POST | `/logout` | - | - | Logout → redirect a login |
| GET | `/current` | JWT | - | Usuario actual (DTO seguro) → JSON |
| GET | `/` | JWT | admin | Listar usuarios → JSON |
| DELETE | `/:id` | JWT | admin | Eliminar usuario → JSON |

### Productos (`/api/products`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | - | - | Listar (paginado) |
| GET | `/:pid` | - | - | Detalle producto |
| POST | `/` | JWT | admin | Crear producto |
| PUT | `/:pid` | JWT | admin | Actualizar producto |
| DELETE | `/:pid` | JWT | admin | Eliminar producto |

**Query params para GET /:**
- `limit` (default: 10)
- `page` (default: 1)
- `sort` ('asc' | 'desc' por precio)
- `category` (filtro)
- `status` (true/false)
- `withAvailableStock` (true) - Incluye stock disponible en tiempo real

> **Stock Disponible**: Con `withAvailableStock=true`, cada producto incluye `availableStock` que descuenta las unidades reservadas en carritos activos de otros usuarios.

### Carritos (`/api/carts`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-----------|
| POST | `/` | - | - | Crear carrito vacío |
| POST | `/mine` | JWT | user | Obtener/crear mi carrito |
| GET | `/mine` | JWT | user | Obtener mi carrito (incluye `expiresAt`) |
| GET | `/admin/all` | JWT | admin | Ver todos los carritos activos |
| GET | `/:cid` | - | - | Ver carrito |
| POST | `/:cid/products/:pid` | JWT | user | Agregar producto |
| PUT | `/:cid/products/:pid` | JWT | user | Modificar cantidad |
| DELETE | `/:cid/products/:pid` | JWT | user | Quitar producto |
| DELETE | `/:cid` | JWT | user | Vaciar carrito |
| POST | `/:cid/purchase` | JWT | user | **Finalizar compra** |

> **TTL del Carrito**: Los carritos expiran automáticamente después de `CART_TTL_MINUTES` minutos de inactividad (default: 60 min, configurable en `.env`). Cada operación en el carrito renueva el tiempo de expiración. Un timer visual en la UI muestra el tiempo restante.

### Tickets (`/api/tickets`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-----------|
| GET | `/mine` | JWT | user | Historial de compras (con detalle de productos) |
| GET | `/admin/all` | JWT | admin | Ver todos los tickets |
| GET | `/:code` | JWT | user | Detalle de ticket (solo propio) |

> **Detalle de Productos**: Los tickets ahora incluyen un snapshot de los productos comprados (título, precio, cantidad) al momento de la compra.

### Password Reset (`/api/password-reset`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/request` | - | Solicitar reset (envía email) |
| POST | `/confirm` | - | Confirmar con token |

### Mail (`/api/mail`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/status` | - | - | Verificar config de env vars |
| GET | `/status/smtp` | - | - | Verificar conexión SMTP real |
| POST | `/test` | JWT | admin | Enviar email de prueba |

---

## 🛒 Flujo de Compra

> **Roles**: Solo usuarios con rol `user` pueden agregar al carrito y comprar. El `admin` gestiona productos pero no puede comprar.

```
1. [ADMIN] Crea productos en el catálogo
   POST /api/products (requiere rol admin)

2. [USER] Agrega productos al carrito
   POST /api/carts/:cid/products/:pid (requiere rol user)

3. [USER] Finaliza compra
   POST /api/carts/:cid/purchase (requiere rol user)

4. Sistema procesa:
   - Verifica stock de cada producto
   - Descuenta stock de productos comprados
   - Genera Ticket con code único (UUID)
   - Items sin stock quedan en carrito para próxima compra

5. Respuesta:
   - ticket: { code, amount, purchaser, purchase_datetime }
   - unprocessedProducts: [ids sin stock] (si aplica)
```

---

## 🏗️ Arquitectura

```
src/
├── config/           # Configuración (env, passport, session, handlebars)
├── controllers/      # Manejo de HTTP requests
├── dao/mongo/        # Data Access Objects (CRUD MongoDB)
├── dto/              # Data Transfer Objects (transformación)
├── middlewares/      # Auth, authorization, error handling
├── models/           # Schemas Mongoose
├── repositories/     # Abstracción sobre DAOs
├── routes/           # Definición de endpoints
├── services/         # Lógica de negocio
├── utils/            # Helpers (mailer, passportCall, tokenGenerator)
└── views/            # Templates Handlebars
```

**Flujo de datos:**
```
Request → Router → Controller → Service → Repository → DAO → Model → MongoDB
```

---

## 📊 Códigos de Respuesta HTTP Comunes

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| `200` | OK | Request exitoso |
| `201` | Created | Recurso creado (POST exitoso) |
| `302` | Redirect | Endpoints `/api/users/*` redirigen después de login/logout |
| `304` | Not Modified | Cache del navegador (ETag), no es error |
| `400` | Bad Request | Datos inválidos o faltantes |
| `401` | Unauthorized | Sin sesión JWT o token inválido |
| `403` | Forbidden | Rol sin permisos para la acción |
| `404` | Not Found | Recurso no existe |

> 💡 **Tip**: Si ves `401` en `/api/users/current` al cargar la página, es normal si no hay sesión. Una vez logueado, asegurate de usar `credentials: 'include'` en fetch.

---

##  Configuración de Gmail

1. Habilitar verificación en 2 pasos en tu cuenta Google
2. Crear App Password: https://myaccount.google.com/apppasswords
3. Usar la App Password en `MAIL_PASS` (no tu contraseña normal)

---

##  Usuario Admin por Defecto

Al registrar con estas credenciales se crea automáticamente como admin:

```
Email: admin@ejemplo.com
Password: adminejemplO123
```

---

## 🔒 Seguridad Implementada

- ✅ Passwords hasheados con bcrypt (salt 10)
- ✅ JWT firmado con secreto, en cookie HTTP-only
- ✅ Tokens de reset hasheados (SHA-256)
- ✅ Rate limiting en endpoints de password reset
- ✅ No exposición de datos sensibles (DTO en `/current`)
- ✅ Validación de ObjectIds en todos los endpoints
- ✅ Autorización por roles (middleware)

---

## 📦 Dependencias Principales

- express 5.1.0
- mongoose 8.19.4
- passport / passport-jwt / passport-local
- bcrypt 6.0.0
- jsonwebtoken 9.0.2
- nodemailer
- express-rate-limit
- express-handlebars
- helmet, cors, morgan, cookie-parser

---

## 🧪 Probar la API

### 1. Registrar usuario admin
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Admin","last_name":"User","email":"admin@ejemplo.com","password":"adminejemplO123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","password":"adminejemplO123"}' \
  -c cookies.txt
```

### 3. Crear producto (admin)
```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Producto Test","description":"Desc","price":100,"stock":10,"code":"PROD001","category":"test"}'
```

### 4. Usuario actual
```bash
curl http://localhost:8080/api/users/current -b cookies.txt
```

### Alternativa: PowerShell (Windows)

En Windows PowerShell, `curl` tiene problemas con cookies. Usar `Invoke-WebRequest` con `-SessionVariable`:

```powershell
# Login (guarda sesión con cookie JWT)
$login = Invoke-WebRequest -Uri "http://localhost:3000/api/users/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@ejemplo.com","password":"adminejemplO123"}' `
  -SessionVariable session

# Crear producto (usa la sesión guardada)
Invoke-WebRequest -Uri "http://localhost:3000/api/products" `
  -Method POST -ContentType "application/json" `
  -WebSession $session `
  -Body '{"title":"Laptop","description":"Gaming","price":1299.99,"stock":10,"code":"LAP001","category":"electronics"}'

# Ver usuario actual
Invoke-WebRequest -Uri "http://localhost:3000/api/users/current" -WebSession $session
```

> **Nota**: La cookie JWT se almacena automáticamente en `$session` y se envía en requests posteriores con `-WebSession`.

---

## ✅ Checklist de Pruebas Manuales

### Autenticación
- [ ] Registrar usuario normal → rol `user`
- [ ] Registrar admin (`admin@ejemplo.com` / `adminejemplO123`) → rol `admin`
- [ ] Login redirige a `/users/current`
- [ ] Logout limpia cookie y redirige a login
- [ ] Toggle de visibilidad en campos de contraseña (ojito)

### Roles y Permisos
- [ ] User puede ver `/products`, `/my-cart`, `/my-tickets`
- [ ] User **NO** puede acceder a `/admin-panel`, `/admin-products`
- [ ] Admin puede ver `/admin-panel`, `/admin-products`
- [ ] Admin **NO** puede agregar al carrito ni comprar

### Carrito y Compra (como User)
- [ ] Agregar producto al carrito desde `/products`
- [ ] Ver stock disponible (descuenta reservados en otros carritos)
- [ ] Ver carrito en `/my-cart`
- [ ] Ver timer de expiración del carrito (colores: azul/amarillo/rojo)
- [ ] Modificar cantidad (+/-)
- [ ] Eliminar producto del carrito
- [ ] Vaciar carrito completo
- [ ] Finalizar compra → genera ticket con detalle de productos
- [ ] Ver ticket en `/my-tickets` con detalle expandible
- [ ] Producto sin stock → queda en carrito como `unprocessedProducts`

### Admin Panel
- [ ] Tab Mail: Verificar config y SMTP, enviar mail de prueba
- [ ] Tab Tickets: Ver todos los tickets con detalle de productos
- [ ] Tab Carritos: Ver carritos activos (con productos) por usuario
- [ ] Filtrar tickets y carritos por email

### CRUD Productos (como Admin)
- [ ] Crear producto desde `/admin-products`
- [ ] Editar producto (carga datos en form)
- [ ] Eliminar producto (con confirmación)
- [ ] Producto inactivo se muestra diferente

### Password Reset
- [ ] Solicitar reset desde `/forgot-password`
- [ ] Recibir email con link
- [ ] Restablecer contraseña desde el link
- [ ] Login con nueva contraseña

---

## 📄 Licencia

ISC
