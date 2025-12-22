// src/routes/users.api.js
// Router de API (/api/users) - servicios JSON

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { passportCall } from '../utils/passportCall.js';
import { authorization } from '../middlewares/authorization.js';
import config from '../config/environment.js';
import UserCurrentDTO from '../dto/user/UserCurrentDTO.js';

const router = Router();

/**
 * POST /api/users/register
 * Registrar nuevo usuario
 */
router.post('/register', async (req, res, next) => {
    try {
        const { first_name, last_name, age, email, password } = req.body;
        
        // Validación básica
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos: first_name, last_name, email, password'
            });
        }
        
        // Age es opcional (default 18)
        const userAge = age ? parseInt(age, 10) : 18;
        
        // Normalizar email
        const normEmail = String(email).toLowerCase().trim();
        
        // Verificar si el email ya existe
        const existingUser = await User.findOne({ email: normEmail });
        if (existingUser) {
            return res.status(400).json({
                error: 'El email ya está registrado'
            });
        }
        
        // Determinar rol (admin si usa credenciales específicas)
        const isAdmin = (normEmail === 'admin@ejemplo.com' && password === 'adminejemplO123');
        
        // Crear usuario (password se hashea automáticamente en pre-save)
        const user = await User.create({
            first_name,
            last_name,
            age: userAge,
            email: normEmail,
            password,
            role: isAdmin ? 'admin' : 'user'
        });
        
        console.log('[REGISTER] Usuario creado:', {
            id: user._id,
            email: user.email,
            role: user.role
        });
        
        res.status(201).json({
            ok: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users/login
 * Login con JWT guardado en cookie HTTP-only firmada 'currentUser'
 * Redirige según éxito o error (para vistas)
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        console.log('[LOGIN API] Intento de login:', { email });
        
        // Validación básica
        if (!email || !password) {
            // Si viene desde formulario HTML, redirigir con error
            if (req.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
                return res.redirect('/users/login?error=1');
            }
            return res.status(400).json({ error: 'Email y password son requeridos' });
        }
        
        // Normalizar email
        const normEmail = String(email).toLowerCase().trim();
        
        // Buscar usuario
        const user = await User.findOne({ email: normEmail });
        
        if (!user) {
            console.log('[LOGIN API] Usuario no encontrado:', normEmail);
            if (req.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
                return res.redirect('/users/login?error=1');
            }
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // Verificar password
        const isValid = await user.comparePassword(password);
        
        if (!isValid) {
            console.log('[LOGIN API] Password incorrecto');
            if (req.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
                return res.redirect('/users/login?error=1');
            }
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // Generar JWT
        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email,
                role: user.role
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('[LOGIN API] JWT generado para:', user.email);
        
        // Guardar en cookie HTTP-only firmada 'currentUser'
        res.cookie('currentUser', token, {
            httpOnly: true,
            signed: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            sameSite: 'lax',
            secure: false // true en producción con HTTPS
        });
        
        console.log('[LOGIN API] Cookie currentUser seteada');
        
        // Si viene desde formulario, redirigir a /users/current
        if (req.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
            return res.redirect('/users/current');
        }
        
        // Si es API JSON, devolver token
        res.json({
            ok: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/current
 * Obtener datos del usuario actual (requiere JWT)
 */
router.get('/current', passportCall('current'), (req, res) => {
    // Usar DTO para devolver solo datos seguros
    const userDTO = UserCurrentDTO.from(req.user);
    
    res.json({
        ok: true,
        user: userDTO
    });
});

/**
 * POST /api/users/logout
 * Cerrar sesión (limpiar cookie)
 */
router.post('/logout', (req, res) => {
    res.clearCookie('currentUser');
    console.log('[LOGOUT] Cookie limpiada');
    
    // Si viene desde formulario, redirigir a login
    if (req.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
        return res.redirect('/users/login');
    }
    
    res.json({ ok: true, message: 'Sesión cerrada' });
});

/**
 * GET /api/users (solo admin)
 * Listar todos los usuarios
 */
router.get('/', passportCall('jwt'), authorization('admin'), async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        
        res.json({
            ok: true,
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/users/:id (solo admin)
 * Eliminar usuario
 */
router.delete('/:id', passportCall('jwt'), authorization('admin'), async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            ok: true,
            message: 'Usuario eliminado',
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
