// src/router/CustomRouter.js
// Custom Router con políticas de acceso y respuestas personalizadas 

import { Router } from 'express';
import jwt from 'jsonwebtoken';

export default class CustomRouter {
    constructor() {
        this.router = Router();
        this.init();
    }

    /**
     * Inicializa el router inyectando middlewares globales
     */
    init() {
        // Middleware que agrega métodos de respuesta custom a res
        this.router.use((req, res, next) => {
            // Respuesta exitosa estandarizada
            res.sendSuccess = (data) => {
                res.status(200).json({
                    status: 'success',
                    payload: data
                });
            };

            // Respuesta de error controlado
            res.sendError = (message) => {
                res.status(400).json({
                    status: 'error',
                    error: message
                });
            };

            // Respuesta de error del servidor
            res.sendServerError = (error) => {
                console.error('[SERVER ERROR]', error);
                res.status(500).json({
                    status: 'error',
                    error: 'Error interno del servidor'
                });
            };

            next();
        });
    }

    /**
     * Middleware de políticas de acceso
     * @param {Array<string>} policies - ['PUBLIC', 'USER', 'ADMIN']
     */
    handlePolicies(policies) {
        return (req, res, next) => {
            // Si la política es PUBLIC, permitir acceso
            if (policies.includes('PUBLIC')) {
                return next();
            }

            // Extraer token del header Authorization: Bearer <token>
            const authHeader = req.headers.authorization || '';
            const [scheme, token] = authHeader.split(' ');

            if (scheme !== 'Bearer' || !token) {
                return res.status(401).json({
                    status: 'error',
                    error: 'No autenticado - Token requerido'
                });
            }

            try {
                const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret';
                const payload = jwt.verify(token, jwtSecret);

                // Guardar datos del usuario en req
                req.user = payload; // { id, email, role, iat, exp }

                // Verificar si el rol del usuario está en las políticas permitidas
                if (!policies.includes(payload.role?.toUpperCase())) {
                    return res.status(403).json({
                        status: 'error',
                        error: `Acceso denegado - Se requiere rol: ${policies.join(' o ')}`
                    });
                }

                next();
            } catch (err) {
                console.log('[POLICY] JWT error:', err.message);
                return res.status(401).json({
                    status: 'error',
                    error: 'Token inválido o expirado'
                });
            }
        };
    }

    /**
     * Procesa y envuelve los callbacks con manejo de errores
     * @param {Array<Function>} callbacks
     */
    applyCallbacks(callbacks) {
        return callbacks.map(callback => {
            return async (req, res, next) => {
                try {
                    await callback(req, res, next);
                } catch (error) {
                    console.error('[CALLBACK ERROR]', error);
                    next(error);
                }
            };
        });
    }

    /**
     * Métodos HTTP con políticas integradas
     */
    get(path, policies = ['PUBLIC'], ...callbacks) {
        this.router.get(
            path,
            this.handlePolicies(policies),
            ...this.applyCallbacks(callbacks)
        );
    }

    post(path, policies = ['PUBLIC'], ...callbacks) {
        this.router.post(
            path,
            this.handlePolicies(policies),
            ...this.applyCallbacks(callbacks)
        );
    }

    put(path, policies = ['PUBLIC'], ...callbacks) {
        this.router.put(
            path,
            this.handlePolicies(policies),
            ...this.applyCallbacks(callbacks)
        );
    }

    patch(path, policies = ['PUBLIC'], ...callbacks) {
        this.router.patch(
            path,
            this.handlePolicies(policies),
            ...this.applyCallbacks(callbacks)
        );
    }

    delete(path, policies = ['PUBLIC'], ...callbacks) {
        this.router.delete(
            path,
            this.handlePolicies(policies),
            ...this.applyCallbacks(callbacks)
        );
    }

    /**
     * Devuelve el router configurado
     */
    getRouter() {
        return this.router;
    }
}
