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
import productsApiRouter from './routes/products.api.js';
import cartsApiRouter from './routes/carts.api.js';
import mailApiRouter from './routes/mail.api.js';
import passwordResetApiRouter from './routes/passwordReset.api.js';
import ticketsApiRouter from './routes/tickets.api.js';

// Rutas de vistas
import usersViewsRoutes from './routes/users.views.js'; // Vistas Handlebars

// Middlewares
import { createSessionMW } from './config/session.js';
import errorMW from './middlewares/error.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

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
app.use(passport.session()); // Necesario para /api/sessions que usa passport con sesiones

/* ===== Healthcheck ===== */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ===== Rutas de VISTAS (Handlebars) ===== */
app.use('/users', usersViewsRoutes); // /users/login, /users/current, /users/register

// Vista de productos (pública)
app.get('/products', async (req, res) => {
    // Intentar obtener usuario del token si existe
    const token = req.signedCookies?.currentUser;
    let user = null;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            
            // Buscar usuario en BD para obtener first_name
            const userDoc = await User.findById(decoded.id).lean();
            if (userDoc) {
                user = {
                    first_name: userDoc.first_name,
                    email: userDoc.email,
                    role: userDoc.role
                };
            }
        } catch (err) {
            // Token inválido o expirado, user queda null
            console.log('[PRODUCTS] Token error:', err.message);
        }
    }
    
    res.render('products', { 
        title: 'Productos',
        user
    });
});

// Redirect raíz a productos
app.get('/', (req, res) => res.redirect('/products'));

// Vista de "Olvidé mi contraseña"
app.get('/forgot-password', (req, res) => {
    res.render('forgotPassword', {
        title: 'Recuperar Contraseña'
    });
});

// Vista de reset password (desde link del email)
app.get('/reset-password', (req, res) => {
    const { token, email } = req.query;
    
    if (!token || !email) {
        return res.render('resetPassword', {
            title: 'Error',
            error: 'Link inválido. Solicitá un nuevo enlace de recuperación.'
        });
    }
    
    res.render('resetPassword', {
        title: 'Restablecer Contraseña',
        token,
        email
    });
});

/* ===== Rutas de API (JSON) ===== */
app.use('/api/users', usersApiRoutes); // API usuarios con JWT en cookie
app.use('/api/sessions', sessionsRoutes); // Sesiones
app.use('/api/products', productsApiRouter); // Products API
app.use('/api/carts', cartsApiRouter); // Carts API
app.use('/api/mail', mailApiRouter); // Mail API (test)
app.use('/api/password-reset', passwordResetApiRouter); // Password Reset API (público)
app.use('/api/tickets', ticketsApiRouter); // Tickets API (user)

/* ===== Admin Panel (solo admin) ===== */
import { passportCall } from './utils/passportCall.js';
import { authorization } from './middlewares/authorization.js';

app.get('/admin-panel', passportCall('jwt'), authorization('admin'), (req, res) => {
    res.render('adminPanel', { user: req.user });
});

/* ===== Admin Products CRUD (solo admin) ===== */
app.get('/admin-products', passportCall('jwt'), authorization('admin'), (req, res) => {
    res.render('adminProducts', { user: req.user });
});

/* ===== Vista de carrito (solo user) ===== */
app.get('/my-cart', passportCall('jwt'), authorization('user'), (req, res) => {
    res.render('cart', { user: req.user });
});

/* ===== Vista de historial de tickets (solo user) ===== */
app.get('/my-tickets', passportCall('jwt'), authorization('user'), (req, res) => {
    res.render('tickets', { user: req.user });
});

/* ===== 404 explícito ===== */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

/* ===== Handler de errores (último SIEMPRE) ===== */
app.use(errorMW);

export default app;