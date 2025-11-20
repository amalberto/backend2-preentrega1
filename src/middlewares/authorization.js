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
            console.log('[AUTHORIZATION] No hay req.user - usuario no autenticado');
            return res.status(401).json({ 
                error: 'No autenticado. Debes iniciar sesión primero.' 
            });
        }
        
        // Verificar rol
        const userRole = req.user.role;
        
        if (!roles.includes(userRole)) {
            console.log('[AUTHORIZATION] Acceso denegado:', {
                user: req.user.email,
                userRole,
                requiredRoles: roles
            });
            
            return res.status(403).json({ 
                error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` 
            });
        }
        
        console.log('[AUTHORIZATION] Acceso permitido:', {
            user: req.user.email,
            role: userRole
        });
        
        next();
    };
}
