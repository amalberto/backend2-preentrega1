// src/routes/sessions.routes.js

/**
 * flujo de auth con sesiones
 * register: crea usuario , le da rol admin o user según el caso
 * login guarda datos mínimos en req.session.user
 * me inspecciona la sesión actual
 * logout destruye la sesión + limpia cookie
 * 
 * -----------------------------------------
 * Rutas de sesión:
 * - POST /register -> crea usuario (rol 'admin' si usa credenciales de práctica)
 * - POST /login -> setea req.session.user
 * - GET /me -> devuelve datos de sesión
 * - POST /logout -> destruye sesión + limpia cookie
 * 
 * Respuestas:
 * - 200 OK: { ok: true } (si login correcto, ya dejó la sesión lista)
 * - 400 Bad Request: faltan campos
 * - 401 Unauthorized: credenciales inválidas
 * */

import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { passportCall } from '../utils/passportCall.js';
const router = Router();

// POST /register - Crea usuario
router.post('/register', async (req, res, next) => {
    try {
        // 1) Tomo datos del body (asumo que express.json() ya está montado en app.js)
        const { first_name, last_name, age, email, password } = req.body || {};

        // 2) Validación mínima para no guardar basura (dejamos lo fino para otra clase)
        if (!first_name || !last_name || !email || !password) {
            return res
                .status(400)
                .json({ error: 'Faltan campos requeridos: first_name, last_name, email, password' });
        }

        // Age es opcional (default 18)
        const userAge = age ? parseInt(age, 10) : 18;

        // 3) Normalizamos email (evita duplicados @Gmail.com)
        const normEmail = String(email).toLowerCase().trim();

        // 4) hash ocurre en User.pre('save')(bcrypt)
        const isAdmin = (normEmail === 'admin@ejemplo.com' && password === 'adminejemplO123');
        const user = await User.create({ 
            first_name, 
            last_name, 
            age: userAge, 
            email: normEmail, 
            password,
            role: isAdmin ? 'admin' : 'user'
        });

        // 5) Devolvemos 201 (or el id (NO devolvemos el user completo ni el password)
        return res.status(201).json({ ok: true, id: user._id });
    } catch (err) {
        // 6) Si el error es (dup key, validación, etc.), lo maneja el error handler global.
        return next(err);
    }
});

/* =================== LOGIN (Passport + logs) ========================= */
/**
 * POST /api/sessions/login
 * - Usa Passport local para verificar credenciales y luego:
 *   - Regenera la sesión (seguridad)
 *   - Llama a req.login(user) para fijar req.user (Passport)
 *   - Setea req.session.user con un objeto mínimo (tu contrato actual)
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        // Seguridad: evitar session fixation → regenerar el id de sesión
        req.session.regenerate(err2 => {
            if (err2) {
                return next(err2);
            }

            // Integracion Passport <-> Sesion (crea req.user)
            req.login(user, err3 => {
                if (err3) {
                    return next(err3);
                }

                // Tu contrato minimalista (lo que consumen tus rutas actuales) via sesión
                req.session.user = {
                    id: user._id.toString(),
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role || 'user'
                };

                // ====== JWT sencillo ======
                const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret';
                const token = jwt.sign(
                    {
                        id: user._id.toString(),
                        email: user.email,
                        role: user.role || 'user',
                    },
                    jwtSecret,
                    { expiresIn: '1h' }
                );

                // Ahora devolvemos ok + token (además de dejar la sesión lista)
                return res.json({ ok: true, token });
            });
        });
    })(req, res, next);
});

/* =================== Middleware: autenticación con logs =============== */

function isAuthenticated(req, res, next) {
    if (req.session?.user) return next();
    return res.status(401).json({ error: "No autenticado" });
}

// GET /api/sessions/me -------------PRIVADA (usa sesión)
router.get("/me", isAuthenticated, (req, res) => {
    //devolver sólo datos no sensibles
    res.json({ user: req.session.user })
});

/**
 * GET /api/sessions/current
 * Obtener datos del usuario actual validando JWT
 * Estrategia "current" que valida el token JWT y devuelve los datos del usuario
 */
router.get('/current', passportCall('jwt'), (req, res) => {
    // El middleware passportCall('jwt') valida el token y carga req.user
    res.json({
        ok: true,
        user: {
            id: req.user._id,
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            age: req.user.age,
            role: req.user.role,
            cart: req.user.cart
        }
    });
});

//POST /logout
router.post("/logout", (req, res, next) => {
    req.session.destroy(err => {
        if(err) return next(err);
        res.clearCookie('connect.sid');
        res.json({ ok: true, message: 'Sesión finalizada' });
    })
})

export default router;