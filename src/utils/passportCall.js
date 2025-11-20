// src/utils/passportCall.js
// Wrapper para passport.authenticate con mejor manejo de errores

import passport from 'passport';

/**
 * Custom middleware: passportCall
 * Wrapper de passport.authenticate que permite mejor control de errores
 * 
 * @param {string} strategy - Nombre de la estrategia ('jwt', 'local', etc.)
 * @returns {Function} Middleware de Express
 */
export const passportCall = (strategy) => {
    return (req, res, next) => {
        passport.authenticate(strategy, { session: false }, (err, user, info) => {
            // Error en la estrategia
            if (err) {
                console.error(`[PASSPORT CALL] Error en estrategia '${strategy}':`, err.message);
                return next(err);
            }
            
            // Token ausente, corrupto o expirado
            if (!user) {
                const message = info?.message || 'No autenticado';
                console.log(`[PASSPORT CALL] Sin usuario en '${strategy}':`, message);
                
                // Mensajes más descriptivos
                if (message.includes('No auth token')) {
                    return res.status(401).json({ 
                        error: 'Token ausente. Por favor inicia sesión.' 
                    });
                }
                if (message.includes('jwt expired')) {
                    return res.status(401).json({ 
                        error: 'Token expirado. Por favor inicia sesión nuevamente.' 
                    });
                }
                if (message.includes('jwt malformed') || message.includes('invalid')) {
                    return res.status(401).json({ 
                        error: 'Token corrupto o inválido.' 
                    });
                }
                if (message.includes('User not found')) {
                    return res.status(401).json({ 
                        error: 'Usuario no encontrado. La cuenta puede haber sido eliminada.' 
                    });
                }
                
                return res.status(401).json({ error: message });
            }
            
            // Todo OK - asignar usuario a req
            req.user = user;
            console.log(`[PASSPORT CALL] Usuario autenticado:`, {
                id: user._id || user.id,
                email: user.email,
                role: user.role
            });
            
            next();
        })(req, res, next);
    };
};
