// src/middlewares/jwtAuth.js
// Middleware sencillo para verificar JWT desde el header Authorization: Bearer <token>

import jwt from 'jsonwebtoken';

export function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token requerido (Bearer)' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret';
        const payload = jwt.verify(token, jwtSecret);

        // Guardamos el payload para uso posterior en la request
        req.jwt = payload; // { id, email, role, iat, exp }

        return next();
    } catch (err) {
        console.log('[JWT] error verificación', err.message);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
