// src/app.js

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './config/environment.js';

// Configuración de Handlebars
import { configureHandlebars } from './config/handlebars.js';

// Passport strategies
import './config/passport.js'; // passport-local
import './config/passport.jwt.js'; // passport-jwt
import passport from 'passport';

// Rutas API
import usersApiRoutes from './routes/users.api.js'; // API de usuarios
import sessionsRoutes from './routes/sessions.routes.js';
import protectedRoutes from './routes/protected.routes.js';
import advancedRoutes from './routes/advanced.routes.js';
import petsRoutes from './routes/pets.routes.js';
import processRoutes from './routes/process.routes.js';

// Rutas de vistas
import usersViewsRoutes from './routes/users.views.js'; // Vistas Handlebars

// Middlewares
import { createSessionMW } from './config/session.js';
import errorMW from './middlewares/error.js';
import { jwtAuth } from './middlewares/jwtAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ===== Configuración de Handlebars ===== */
configureHandlebars(app);

/* ===== Archivos estáticos (public/) ===== */
app.use(express.static(path.join(__dirname, '../public')));

/* ===== Orden recomendado de middlewares ===== */
app.use(helmet({
    contentSecurityPolicy: false // Permitir estilos inline para desarrollo
}));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET)); // Cookie firmada con secret
app.use(createSessionMW());

app.use(passport.initialize());
// NO usar passport.session() si usamos solo JWT

/* ===== Healthcheck ===== */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ===== Rutas de VISTAS (Handlebars) ===== */
app.use('/users', usersViewsRoutes); // /users/login, /users/current, /users/register

/* ===== Rutas de API (JSON) ===== */
app.use('/api/users', usersApiRoutes); // API usuarios con JWT en cookie
app.use('/api/sessions', sessionsRoutes); // Sesiones
app.use('/private', protectedRoutes); // Rutas protegidas
app.use('/api/advanced', advancedRoutes); // Custom Router
app.use('/api/pets', petsRoutes); // Router.param + regex
app.use('/api/process', processRoutes); // Process + child_process

// Ruta de prueba JWT (header)
app.get('/api/jwt/me', jwtAuth, (req, res) => {
    res.json({ jwt: req.jwt });
});

/* ===== 404 explícito ===== */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

/* ===== Handler de errores (último SIEMPRE) ===== */
app.use(errorMW);

export default app;