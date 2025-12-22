// src/routes/passwordReset.api.js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requestReset, confirmReset } from '../controllers/passwordReset.controller.js';

const router = Router();

/**
 * Rate limiter para /request
 * - Máximo 5 requests por IP cada 15 minutos
 * - Evita spam de emails
 */
const requestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 requests por ventana
    message: {
        status: 'error',
        message: 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false // Disable `X-RateLimit-*` headers
});

/**
 * Rate limiter para /confirm
 * - Máximo 10 requests por IP cada 15 minutos
 * - Evita brute force del token
 */
const confirmLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 requests por ventana
    message: {
        status: 'error',
        message: 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * POST /api/password-reset/request
 * Body: { email: string }
 * Envía email con link de reset (si existe el usuario)
 */
router.post('/request', requestLimiter, requestReset);

/**
 * POST /api/password-reset/confirm
 * Body: { email: string, token: string, newPassword: string }
 * Valida token y actualiza contraseña
 */
router.post('/confirm', confirmLimiter, confirmReset);

export default router;
