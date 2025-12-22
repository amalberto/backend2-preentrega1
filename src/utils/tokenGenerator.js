// src/utils/tokenGenerator.js
import crypto from 'crypto';

/**
 * Generar token aleatorio seguro
 * @param {number} bytes - Cantidad de bytes (default: 32 = 64 chars hex)
 * @returns {string} - Token en formato hexadecimal
 */
export const generateToken = (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hashear token para almacenamiento seguro
 * Usamos SHA-256 (no bcrypt) porque:
 * - El token ya es aleatorio y largo
 * - Necesitamos comparación rápida
 * - No hay riesgo de diccionario
 * @param {string} token - Token plano
 * @returns {string} - Hash SHA-256
 */
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verificar si un token coincide con su hash
 * Blindado contra:
 * - hash nulo/undefined
 * - hash de largo incorrecto (SHA-256 hex = 64 chars)
 * - token no string
 * 
 * @param {string} token - Token plano a verificar
 * @param {string} hash - Hash almacenado
 * @returns {boolean}
 */
export const verifyToken = (token, hash) => {
    // Validaciones defensivas
    if (typeof token !== 'string' || !token) {
        return false;
    }
    if (typeof hash !== 'string' || hash.length !== 64) {
        // SHA-256 en hex siempre tiene 64 caracteres
        return false;
    }

    try {
        const tokenHash = hashToken(token);
        // Comparación segura contra timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(tokenHash, 'hex'),
            Buffer.from(hash, 'hex')
        );
    } catch {
        // Si algo falla (ej: hash no es hex válido), retornar false
        return false;
    }
};

export default { generateToken, hashToken, verifyToken };
