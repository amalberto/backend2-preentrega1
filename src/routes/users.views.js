// src/routes/users.views.js
// Router de VISTAS (/users) - Handlebars

import { Router } from 'express';
import { passportCall } from '../utils/passportCall.js';

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
        error: req.query.error ? 'Credenciales inválidas' : null
    });
});

/**
 * GET /users/register
 * Vista de registro
 */
router.get('/register', isNotAuthenticated, (req, res) => {
    res.render('register', {
        title: 'Registro',
        error: req.query.error ? 'Error al registrar usuario' : null
    });
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
