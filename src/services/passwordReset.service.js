// src/services/passwordReset.service.js
import User from '../models/User.js';
import { generateToken, hashToken, verifyToken } from '../utils/tokenGenerator.js';
import { sendMail } from '../utils/mailer.js';
import config from '../config/environment.js';

const TTL_MINUTES = parseInt(config.RESET_PASSWORD_TTL_MINUTES) || 60;
const BASE_URL = config.RESET_PASSWORD_URL_BASE || 'http://localhost:8080';

/**
 * Validación simple de email
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Normalizar email (trim + lowercase)
 * @param {string} email
 * @returns {string}
 */
const normalizeEmail = (email) => {
    return String(email).trim().toLowerCase();
};

/**
 * Solicitar reset de contraseña
 * @param {string} email - Email del usuario
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const requestPasswordReset = async (email) => {
    const normalizedEmail = normalizeEmail(email);

    // Validar formato de email
    if (!isValidEmail(normalizedEmail)) {
        console.log(`[PASSWORD_RESET] Email inválido: ${email}`);
        // Por seguridad, misma respuesta que si no existe
        return { 
            success: true, 
            message: 'Si el email existe, recibirás un correo con instrucciones' 
        };
    }

    // 1. Buscar usuario
    const user = await User.findOne({ email: normalizedEmail });
    
    // Por seguridad, siempre respondemos igual (no revelar si email existe)
    if (!user) {
        console.log(`[PASSWORD_RESET] Email no encontrado: ${normalizedEmail}`);
        return { 
            success: true, 
            message: 'Si el email existe, recibirás un correo con instrucciones' 
        };
    }

    // 2. Generar token
    const token = generateToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

    // 3. Guardar hash y expiración en user
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    // 4. Construir link
    const resetLink = `${BASE_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // 5. Nombre para el saludo (con fallback)
    const displayName = user.first_name || 'Usuario';

    // 6. Enviar email
    try {
        await sendMail({
            to: user.email,
            subject: '🔐 Restablecer tu contraseña - Backend2',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333; text-align: center;">Restablecer Contraseña</h1>
                    
                    <p style="color: #666; font-size: 16px;">
                        Hola <strong>${displayName}</strong>,
                    </p>
                    
                    <p style="color: #666; font-size: 16px;">
                        Recibimos una solicitud para restablecer tu contraseña. 
                        Hacé clic en el botón de abajo para continuar:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #007bff; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 5px; font-size: 16px;
                                  display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px;">
                        Este link expira en <strong>${TTL_MINUTES} minutos</strong>.
                    </p>
                    
                    <p style="color: #999; font-size: 14px;">
                        Si no solicitaste este cambio, podés ignorar este email.
                        Tu contraseña no será modificada.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #aaa; font-size: 12px; text-align: center;">
                        Si el botón no funciona, copiá y pegá este link en tu navegador:<br>
                        <a href="${resetLink}" style="color: #007bff; word-break: break-all;">
                            ${resetLink}
                        </a>
                    </p>
                </div>
            `
        });

        console.log(`[PASSWORD_RESET] Email enviado a: ${user.email}`);
    } catch (err) {
        console.error('[PASSWORD_RESET] Error enviando email:', err.message);
        
        // Rollback: limpiar token si falla el envío
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        await user.save();
        
        console.log(`[PASSWORD_RESET] Token limpiado por fallo de envío para: ${user.email}`);
        // No revelamos el error al usuario por seguridad
    }

    return { 
        success: true, 
        message: 'Si el email existe, recibirás un correo con instrucciones' 
    };
};

/**
 * Confirmar reset de contraseña
 * @param {string} email - Email del usuario
 * @param {string} token - Token de reset
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const confirmPasswordReset = async (email, token, newPassword) => {
    const normalizedEmail = normalizeEmail(email);

    // 1. Buscar usuario
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
        const error = new Error('Token inválido o expirado');
        error.statusCode = 400;
        throw error;
    }

    // 2. Verificar que tiene token pendiente
    if (!user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
        const error = new Error('No hay solicitud de reset pendiente');
        error.statusCode = 400;
        throw error;
    }

    // 3. Verificar expiración
    if (new Date() > user.passwordResetExpiresAt) {
        // Limpiar token expirado
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        await user.save();

        const error = new Error('El link ha expirado. Solicitá uno nuevo.');
        error.statusCode = 400;
        throw error;
    }

    // 4. Verificar token (blindado contra errores)
    if (!verifyToken(token, user.passwordResetTokenHash)) {
        const error = new Error('Token inválido o expirado');
        error.statusCode = 400;
        throw error;
    }

    // 5. Verificar que la nueva password no sea igual a la anterior
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
        const error = new Error('La nueva contraseña no puede ser igual a la anterior');
        error.statusCode = 400;
        throw error;
    }

    // 6. Actualizar password y limpiar token
    user.password = newPassword; // El pre-save hook hashea automáticamente
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    console.log(`[PASSWORD_RESET] Contraseña actualizada para: ${user.email}`);

    return { 
        success: true, 
        message: 'Contraseña actualizada correctamente' 
    };
};

export default { requestPasswordReset, confirmPasswordReset };
