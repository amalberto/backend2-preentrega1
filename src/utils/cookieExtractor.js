// src/utils/cookieExtractor.js
// Función para extraer JWT desde cookie (Passport-JWT)

/**
 * Extrae el token JWT desde la cookie 'currentUser'
 * Usado por Passport-JWT strategy
 */
export const cookieExtractor = (req) => {
    let token = null;
    
    if (req && req.signedCookies) {
        token = req.signedCookies.currentUser;
    }
    
    return token;
};
