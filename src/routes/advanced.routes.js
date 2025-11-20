// src/routes/advanced.routes.js
// Router de ejemplo usando CustomRouter con políticas 

import CustomRouter from '../router/CustomRouter.js';

class AdvancedRouter extends CustomRouter {
    constructor() {
        super();
        this.setupRoutes();
    }

    setupRoutes() {
        // Ruta pública - sin autenticación
        this.get('/public', ['PUBLIC'], (req, res) => {
            res.sendSuccess({ message: 'Ruta pública accesible para todos' });
        });

        // Ruta solo para usuarios autenticados (USER o ADMIN)
        this.get('/user', ['USER', 'ADMIN'], (req, res) => {
            res.sendSuccess({
                message: 'Ruta protegida para usuarios',
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role
                }
            });
        });

        // Ruta exclusiva para administradores
        this.get('/admin', ['ADMIN'], (req, res) => {
            res.sendSuccess({
                message: 'Ruta exclusiva para administradores',
                admin: req.user.email
            });
        });

        // Ejemplo de error controlado
        this.get('/error', ['PUBLIC'], (req, res) => {
            res.sendError('Este es un error de ejemplo');
        });

        // Ejemplo de error del servidor
        this.get('/crash', ['PUBLIC'], (req, res) => {
            throw new Error('Error intencional para probar manejo de errores');
        });
    }
}

const advancedRouter = new AdvancedRouter();
export default advancedRouter.getRouter();
