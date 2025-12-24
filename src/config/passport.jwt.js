// src/config/passport.jwt.js
// Estrategia Passport-JWT para extraer tokens desde cookies

import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
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

/**
 * Callback compartido para verificar JWT y cargar usuario
 * NOTA: Se excluye password del usuario para defense-in-depth
 */
const jwtCallback = async (jwt_payload, done) => {
    try {
        // Buscar usuario por ID del payload (SIN password)
        const user = await User.findById(jwt_payload.id).select('-password');
        
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        
        // Devolver usuario (se asignará a req.user)
        return done(null, user);
        
    } catch (error) {
        console.error('[PASSPORT JWT] Error:', error.message);
        return done(error, false);
    }
};

// Registrar estrategia 'jwt' (compatibilidad hacia atrás)
passport.use('jwt', new JwtStrategy(jwtOptions, jwtCallback));

// Registrar estrategia 'current' (alias requerido por la entrega final)
passport.use('current', new JwtStrategy(jwtOptions, jwtCallback));

export default passport;
