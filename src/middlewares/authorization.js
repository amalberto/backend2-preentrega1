// src/middlewares/authorization.js
// Middleware de autorización por roles

/**
 * Middleware de autorización por rol
 * Verifica que req.user.role coincida con el rol requerido
 * 
 * @param {string|string[]} allowedRoles - Rol o array de roles permitidos
 * @returns {Function} Middleware de Express
 */
export function authorization(allowedRoles) {
    // Normalizar a array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return (req, res, next) => {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({ 
                error: 'No autenticado. Debes iniciar sesión primero.' 
            });
        }
        
        // Verificar rol
        const userRole = req.user.role;
        
        if (!roles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` 
            });
        }
        
        next();
    };
}
