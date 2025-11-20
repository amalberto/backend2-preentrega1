// src/config/passport.jwt.js
// Estrategia Passport-JWT para extraer tokens desde cookies

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { cookieExtractor } from '../utils/cookieExtractor.js';
import User from '../models/User.js';
import config from './environment.js';

/**
 * Configuración de Passport-JWT
 * Extrae el token desde la cookie 'currentUser' (HTTP-only, firmada)
 */
const jwtOptions = {
    jwtFromRequest: cookieExtractor, // Función personalizada para extraer desde cookie
    secretOrKey: config.JWT_SECRET,
    // Alternativa: también se puede extraer desde headers
    // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

passport.use('jwt', new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
        console.log('[PASSPORT JWT] Verificando token:', {
            userId: jwt_payload.id,
            email: jwt_payload.email,
            exp: new Date(jwt_payload.exp * 1000).toISOString()
        });
        
        // Buscar usuario por ID del payload
        const user = await User.findById(jwt_payload.id);
        
        if (!user) {
            console.log('[PASSPORT JWT] Usuario no encontrado:', jwt_payload.id);
            return done(null, false, { message: 'User not found' });
        }
        
        console.log('[PASSPORT JWT] Usuario encontrado:', {
            id: user._id,
            email: user.email,
            role: user.role
        });
        
        // Devolver usuario (se asignará a req.user)
        return done(null, user);
        
    } catch (error) {
        console.error('[PASSPORT JWT] Error:', error.message);
        return done(error, false);
    }
}));

export default passport;
