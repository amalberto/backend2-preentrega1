// src/controllers/passwordReset.controller.js
import { requestPasswordReset, confirmPasswordReset } from '../services/passwordReset.service.js';

/**
 * POST /api/password-reset/request
 * Solicitar email de reset
 */
export const requestReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'El campo "email" es requerido'
            });
        }

        const result = await requestPasswordReset(email);

        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/password-reset/confirm
 * Confirmar reset con token + nueva password
 */
export const confirmReset = async (req, res, next) => {
    try {
        const { email, token, newPassword } = req.body;

        // Validaciones básicas
        if (!email || !token || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Los campos "email", "token" y "newPassword" son requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const result = await confirmPasswordReset(email, token, newPassword);

        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

export default { requestReset, confirmReset };
