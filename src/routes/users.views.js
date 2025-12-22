// src/routes/users.views.js
// Router de VISTAS (/users) - Handlebars

import { Router } from 'express';
import { passportCall } from '../utils/passportCall.js';
import User from '../models/User.js';

const router = Router();

/**
 * Middleware para verificar si el usuario NO está autenticado
 * Redirige a /users/current si ya tiene sesión
 */
function isNotAuthenticated(req, res, next) {
    const token = req.signedCookies.currentUser;
    
    if (token) {
        return res.redirect('/users/current');
    }
    
    next();
}

/**
 * GET /users/login
 * Vista de login
 * Restricción: usuario logueado no puede acceder (redirige a /users/current)
 */
router.get('/login', isNotAuthenticated, (req, res) => {
    res.render('login', {
        title: 'Login',
        success: req.query.registered ? '¡Registro exitoso! Ya podés iniciar sesión' : null,
        error: req.query.error ? 'Credenciales inválidas' : null
    });
});

/**
 * GET /users/register
 * Vista de registro
 */
router.get('/register', isNotAuthenticated, (req, res) => {
    let errorMsg = null;
    if (req.query.error === 'exists') {
        errorMsg = 'El email ya está registrado';
    } else if (req.query.error) {
        errorMsg = 'Error al registrar usuario';
    }
    
    res.render('register', {
        title: 'Registro',
        error: errorMsg
    });
});

/**
 * POST /users/register
 * Procesa formulario de registro y redirige a login
 */
router.post('/register', isNotAuthenticated, async (req, res) => {
    try {
        const { first_name, last_name, age, email, password } = req.body;

        // Validación básica
        if (!first_name || !last_name || !email || !password) {
            return res.redirect('/users/register?error=1');
        }

        // Age opcional (default 18)
        const userAge = age ? parseInt(age, 10) : 18;

        // Normalizar email
        const normEmail = String(email).toLowerCase().trim();

        // Verificar si ya existe
        const existingUser = await User.findOne({ email: normEmail });
        if (existingUser) {
            return res.redirect('/users/register?error=exists');
        }

        // Determinar rol
        const isAdmin = (normEmail === 'admin@ejemplo.com' && password === 'adminejemplO123');

        // Crear usuario
        await User.create({
            first_name,
            last_name,
            age: userAge,
            email: normEmail,
            password,
            role: isAdmin ? 'admin' : 'user'
        });

        // Redirigir a login con mensaje de éxito
        return res.redirect(303, '/users/login?registered=1');

    } catch (err) {
        console.error('[REGISTER VIEW] Error:', err.message);
        return res.redirect('/users/register?error=1');
    }
});

/**
 * GET /users/current
 * Vista de perfil del usuario actual
 * Restricción: usuario no logueado no puede acceder (redirige a /users/login)
 */
router.get('/current', passportCall('jwt'), (req, res) => {
    // Si passportCall falla, redirige a login
    if (!req.user) {
        return res.redirect('/users/login');
    }
    
    res.render('current', {
        title: 'Perfil',
        user: {
            first_name: req.user.first_name,
            last_name: req.user.last_name,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt
        }
    });
});

export default router;
