// src/controllers/carts.controller.js
import cartService from '../services/carts.service.js';

/**
 * CartController
 * Maneja las requests HTTP para carritos
 */
class CartController {
    /**
     * POST /api/carts
     * Crear carrito vacío
     */
    async create(req, res, next) {
        try {
            const cart = await cartService.create();
            
            res.status(201).json({
                status: 'success',
                payload: cart
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/carts/:cid
     * Obtener carrito por ID
     */
    async getById(req, res, next) {
        try {
            const { cid } = req.params;
            const cart = await cartService.getById(cid);
            
            res.json({
                status: 'success',
                payload: cart
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/carts/:cid/products/:pid
     * Agregar producto al carrito (solo user)
     */
    async addProduct(req, res, next) {
        try {
            const { cid, pid } = req.params;
            const { quantity = 1 } = req.body;
            
            // Pasar user para validar propiedad del carrito
            const cart = await cartService.addProduct(cid, pid, quantity, req.user);
            
            res.json({
                status: 'success',
                payload: cart
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/carts/:cid/products/:pid
     * Eliminar producto del carrito
     */
    async removeProduct(req, res, next) {
        try {
            const { cid, pid } = req.params;
            const cart = await cartService.removeProduct(cid, pid, req.user);
            
            res.json({
                status: 'success',
                payload: cart
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/carts/:cid
     * Vaciar carrito
     */
    async clear(req, res, next) {
        try {
            const { cid } = req.params;
            const cart = await cartService.clear(cid, req.user);
            
            res.json({
                status: 'success',
                message: 'Carrito vaciado',
                payload: cart
            });
        } catch (error) {
            next(error);
        }
    }
}

// Exportar instancia
export default new CartController();
