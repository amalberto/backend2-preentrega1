// src/utils/mailer.js
import nodemailer from 'nodemailer';
import config from '../config/environment.js';

/**
 * Verificar que las variables de entorno de mail están configuradas
 * @returns {{ valid: boolean, error?: string }}
 */
export const verifyMailConfig = () => {
    const required = ['MAIL_SERVICE', 'MAIL_USER', 'MAIL_PASS'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
        return {
            valid: false,
            error: `Faltan variables de entorno para mailing: ${missing.join(', ')}`
        };
    }
    return { valid: true };
};

/**
 * Crear transporter de nodemailer
 * Soporta servicios como Gmail, Outlook, etc.
 * 
 * IMPORTANTE para Gmail:
 * - Requiere 2FA habilitado en la cuenta
 * - Usar App Password (no la contraseña normal)
 * - https://myaccount.google.com/apppasswords
 */
const createTransporter = () => {
    const validation = verifyMailConfig();
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    return nodemailer.createTransport({
        service: config.MAIL_SERVICE, // 'gmail', 'outlook', etc.
        auth: {
            user: config.MAIL_USER,
            pass: config.MAIL_PASS // App password para Gmail
        }
    });
};

// Instancia lazy del transporter (se crea al primer uso)
let transporter = null;

/**
 * Obtener transporter (singleton lazy)
 */
const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

/**
 * Verificar conexión SMTP real
 * Útil para healthcheck - detecta credenciales inválidas
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export const verifyTransporter = async () => {
    const configCheck = verifyMailConfig();
    if (!configCheck.valid) {
        return configCheck;
    }

    try {
        const transport = getTransporter();
        await transport.verify();
        return { valid: true };
    } catch (err) {
        return {
            valid: false,
            error: `Error de conexión SMTP: ${err.message}`
        };
    }
};

/**
 * Validación simple de email
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Enviar email
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 * @param {string} [options.text] - Contenido texto plano (fallback)
 * @returns {Promise<Object>} - Resultado del envío
 */
export const sendMail = async ({ to, subject, html, text }) => {
    // Validar configuración
    const validation = verifyMailConfig();
    if (!validation.valid) {
        const error = new Error(validation.error);
        error.statusCode = 500;
        throw error;
    }

    // Validar email destinatario
    if (!to || !isValidEmail(to)) {
        const error = new Error('Email destinatario inválido');
        error.statusCode = 400;
        throw error;
    }

    try {
        const transport = getTransporter();
        
        const mailOptions = {
            from: `"${config.MAIL_FROM_NAME}" <${config.MAIL_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Fallback: strip HTML
        };

        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (err) {
        console.error('[MAILER] Error enviando email:', err.message);
        const error = new Error(`Error enviando email: ${err.message}`);
        error.statusCode = 500;
        throw error;
    }
};

export default { sendMail, verifyMailConfig, verifyTransporter };
