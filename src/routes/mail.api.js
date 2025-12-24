// src/routes/mail.api.js
import { Router } from 'express';
import { sendMail, verifyMailConfig, verifyTransporter } from '../utils/mailer.js';
import { passportCall } from '../utils/passportCall.js';
import { authorization } from '../middlewares/authorization.js';

const router = Router();

/**
 * GET /api/mail/status
 * Verificar si el mailing está configurado (solo env vars)
 */
router.get('/status', (req, res) => {
    const result = verifyMailConfig();
    // Transformar a formato esperado por el frontend
    if (result.valid) {
        res.json({ status: 'success', message: 'Configuración de mail OK' });
    } else {
        res.status(400).json({ status: 'error', message: result.error });
    }
});

/**
 * GET /api/mail/status/smtp
 * Verificar conexión SMTP real (más lento pero más preciso)
 */
router.get('/status/smtp', async (req, res, next) => {
    try {
        const result = await verifyTransporter();
        
        if (result.valid) {
            res.json({ status: 'success', message: 'Conexión SMTP verificada' });
        } else {
            res.status(500).json({ status: 'error', message: result.error || 'Error de conexión SMTP' });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/mail/test
 * Enviar email de prueba (solo admin)
 */
router.post('/test',
    passportCall('current'),
    authorization('admin'),
    async (req, res, next) => {
        try {
            const { to } = req.body;
            
            if (!to) {
                return res.status(400).json({
                    status: 'error',
                    message: 'El campo "to" es requerido'
                });
            }

            const result = await sendMail({
                to,
                subject: '🧪 Test de Email - Backend2',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                            ¡Email de prueba!
                        </h1>
                        <p style="font-size: 16px; color: #555;">
                            Si estás leyendo esto, el sistema de mailing está funcionando correctamente.
                        </p>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                <strong>Enviado desde:</strong> Backend2 App<br>
                                <strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}
                            </p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            Este es un email de prueba automático. No requiere respuesta.
                        </p>
                    </div>
                `
            });

            res.json({
                status: 'success',
                message: 'Email de prueba enviado',
                messageId: result.messageId
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
