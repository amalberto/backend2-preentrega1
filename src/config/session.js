// src/config/session.js
// Configuración de sesiones con express-session y MongoStore

import session from 'express-session';
import MongoStore from 'connect-mongo';
import config from './environment.js';

/**
 * Crea y retorna el middleware de sesión configurado
 */
export function createSessionMW() {
    return session({
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: config.MONGO_URI,
            ttl: (config.SESSION_TTL_MIN || 30) * 60, // segundos
            autoRemove: 'native'
        }),
        cookie: {
            httpOnly: true,
            secure: false, // true en producción con HTTPS
            maxAge: (config.SESSION_TTL_MIN || 30) * 60 * 1000, // milisegundos
            sameSite: 'lax'
        }
    });
}
