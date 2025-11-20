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
    SESSION_TTL_MIN: parseInt(process.env.SESSION_TTL_MIN) || 30
};
