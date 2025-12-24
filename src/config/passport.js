// src/config/passport.js

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

/**
 * Serialización de usuario para sesiones
 * Guarda solo el ID del usuario en la sesión
 */
passport.serializeUser((user, done) => {
    done(null, user._id.toString());
});

/**
 * Deserialización de usuario desde sesiones
 * Recupera el usuario completo desde la DB usando el ID
 */
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

/**
 * Estrategia Local:
 * - usernameField: 'email' (Passport toma req.body.email)
 * - passwordField: 'password' (Passport toma req.body.password)
 * Hace: findOne + comparePassword. Devuelve (err, user|false).
 **/

passport.use(
    new LocalStrategy(
        { usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
            try {
                const normEmail = String(email).toLowerCase().trim();

                const user = await User.findOne({ email: normEmail });
                if (!user) {
                    return done(null, false);
                }

                const ok = await user.comparePassword(password);
                if (!ok) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

export default passport;
