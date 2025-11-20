# Backend2 - Preentrega 1

## Descripción

Backend con Express, MongoDB, autenticación JWT y vistas Handlebars que implementa los requisitos de la primera preentrega del curso.

---

## Requisitos Implementados

### ✅ Modelo de Usuario Completo
- `first_name`, `last_name` (String, requerido)
- `email` (String, único, requerido)
- `age` (Number, requerido)
- `password` (String, hasheado con bcrypt)
- `cart` (ObjectId, referencia a Cart)
- `role` (String: 'user' o 'admin', default: 'user')

### ✅ Hasheo de Contraseñas
- **bcrypt** en hook `pre('save')` del modelo User
- Salt rounds: 10
- Validación con método `comparePassword()`

### ✅ Estrategias Passport
- **passport-local**: autenticación con email/password
- **passport-jwt**: validación de token JWT desde cookie

### ✅ Sistema JWT
- Generación de token en login
- Almacenamiento en cookie HTTP-only firmada (`currentUser`)
- Expiración: 1 hora
- Extractor personalizado para Passport-JWT

### ✅ Vistas con Handlebars
- Layout principal con CSS
- Login (`/users/login`)
- Registro (`/users/register`)
- Perfil de usuario (`/users/current`)
- Helpers: `eq`, `formatDate`, `json`

---

## Instalación

```powershell
npm install
```

Configura `.env.development`:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/backend2_dev
JWT_SECRET=tu_secreto_jwt
SESSION_SECRET=tu_secreto_sesion
COOKIE_SECRET=tu_secreto_cookie
```

---

## Ejecutar

```powershell
# Desarrollo
node server.js --env development

# Producción
node server.js --env production
```

---

## Endpoints Principales

### Autenticación

**POST /api/sessions/register**
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "age": 25,
  "email": "juan@example.com",
  "password": "123456"
}
```

**POST /api/sessions/login**
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```
Respuesta: `{ "ok": true, "token": "..." }` + cookie `currentUser`

**GET /api/sessions/current**
- Requiere JWT en cookie
- Devuelve datos del usuario autenticado

**POST /api/sessions/logout**
- Destruye la sesión y limpia cookies

### Usuarios (API)

**POST /api/users/register** - Crear usuario  
**POST /api/users/login** - Login con JWT en cookie  
**GET /api/users/current** - Datos del usuario actual (JWT requerido)  
**GET /api/users** - Listar usuarios (admin)  
**POST /api/users/logout** - Cerrar sesión

### Vistas (Handlebars)

**GET /users/login** - Formulario de login  
**GET /users/register** - Formulario de registro  
**GET /users/current** - Perfil del usuario (requiere JWT)

---

## Estructura del Proyecto

```
Backend2/
├── server.js                    # Punto de entrada
├── src/
│   ├── app.js                   # Configuración Express
│   ├── config/
│   │   ├── passport.js          # Passport Local
│   │   ├── passport.jwt.js      # Passport JWT
│   │   ├── session.js           # Express Session
│   │   ├── handlebars.js        # Handlebars config
│   │   └── environment.js       # Variables de entorno
│   ├── models/
│   │   └── User.js              # Modelo con bcrypt
│   ├── routes/
│   │   ├── sessions.routes.js   # Rutas de sesión
│   │   ├── users.api.js         # API de usuarios
│   │   └── users.views.js       # Vistas Handlebars
│   ├── middlewares/
│   │   ├── authorization.js     # Autorización por rol
│   │   └── error.js             # Manejo de errores
│   ├── utils/
│   │   ├── cookieExtractor.js   # Extractor JWT de cookie
│   │   └── passportCall.js      # Wrapper de Passport
│   └── views/
│       ├── layouts/
│       │   └── main.handlebars  # Layout principal
│       ├── login.handlebars
│       ├── register.handlebars
│       └── current.handlebars
└── public/
    ├── css/styles.css
    └── js/main.js
```

---

## Pruebas

### 1. Registrar usuario

```http
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "age": 25,
  "email": "juan@test.com",
  "password": "123456"
}
```

### 2. Login

```http
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "juan@test.com",
  "password": "123456"
}
```

El JWT se guarda automáticamente en cookie `currentUser`.

### 3. Consultar usuario actual

```http
GET http://localhost:3000/api/sessions/current
```

La cookie `currentUser` se envía automáticamente.

---

## Tecnologías

- Express 5.1.0
- MongoDB + Mongoose 8.19.4
- Passport.js (passport-local, passport-jwt)
- bcrypt 6.0.0
- jsonwebtoken 9.0.2
- express-handlebars 8.0.1
- express-session + connect-mongo
- cookie-parser

---

## Seguridad

✅ Contraseñas hasheadas con bcrypt  
✅ JWT firmado con secreto  
✅ Cookies HTTP-only y firmadas  
✅ Sesiones persistentes en MongoDB  
✅ Helmet para headers de seguridad  
✅ CORS configurado

---

## Notas

- Usuario admin: `admincoder@coder.com` / `adminCod3r123`
- JWT expira en 1 hora
- Las vistas requieren autenticación JWT
- El endpoint `/api/sessions/current` valida JWT desde cookie

---