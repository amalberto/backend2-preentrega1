// src/routes/tickets.api.js
import { Router } from 'express';
import ticketService from '../services/tickets.service.js';
import { passportCall } from '../utils/passportCall.js';
import { authorization } from '../middlewares/authorization.js';

const router = Router();

/**
 * GET /api/tickets/mine
 * Obtener historial de tickets del usuario autenticado
 */
router.get('/mine',
    passportCall('current'),
    authorization('user'),
    async (req, res, next) => {
        try {
            const tickets = await ticketService.getByPurchaser(req.user.email);
            
            res.json({
                status: 'success',
                payload: tickets
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/tickets/:code
 * Obtener ticket por código (solo si pertenece al usuario)
 */
router.get('/:code',
    passportCall('current'),
    authorization('user'),
    async (req, res, next) => {
        try {
            const { code } = req.params;
            const ticket = await ticketService.getByCode(code);
            
            // Verificar que el ticket pertenece al usuario
            if (ticket.purchaser !== req.user.email) {
                return res.status(403).json({
                    status: 'error',
                    error: 'No tenés acceso a este ticket'
                });
            }
            
            res.json({
                status: 'success',
                payload: ticket
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
