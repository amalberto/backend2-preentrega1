// src/config/environment.js
// Configuración de variables de entorno

import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Exportar configuración consolidada
export default {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret',
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev_session_secret',
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_cookie_secret',
    SESSION_TTL_MIN: parseInt(process.env.SESSION_TTL_MIN) || 30,
    
    // Mail configuration (Gmail requiere 2FA + App Password)
    MAIL_SERVICE: process.env.MAIL_SERVICE || '',
    MAIL_USER: process.env.MAIL_USER || '',
    MAIL_PASS: process.env.MAIL_PASS || '',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Backend2 App',
    
    // Password Reset configuration
    RESET_PASSWORD_TTL_MINUTES: process.env.RESET_PASSWORD_TTL_MINUTES || '60',
    RESET_PASSWORD_URL_BASE: process.env.RESET_PASSWORD_URL_BASE || 'http://localhost:3000',
    
    // Cart TTL (tiempo de expiración del carrito en minutos)
    CART_TTL_MINUTES: parseInt(process.env.CART_TTL_MINUTES) || 60
};
