// src/controllers/carts.controller.js
import cartService from '../services/carts.service.js';

/**
 * CartController
 * Maneja las requests HTTP para carritos
 */
class CartController {
    /**
     * GET /api/carts/admin/all
     * [ADMIN] Obtener todos los carritos con info de usuarios
     */
    async getAllAdmin(req, res, next) {
        try {
            const carts = await cartService.getAllForAdmin();
            
            res.json({
                status: 'success',
                payload: carts
            });
        } catch (error) {
            next(error);
        }
    }

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
     * GET/POST /api/carts/mine
     * Crear u obtener el carrito del usuario autenticado
     */
    async mine(req, res, next) {
        try {
            const cart = await cartService.ensureUserCart(req.user);

            res.json({
                status: 'success',
                payload: {
                    cartId: cart._id,
                    cart
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/carts/:cid
     * Obtener carrito por ID (valida propiedad)
     */
    async getById(req, res, next) {
        try {
            const { cid } = req.params;
            const cart = await cartService.getById(cid, req.user);
            
            res.json({
                status: 'success',
                payload: cart
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/carts/:cid/products/:pid
     * Actualizar cantidad de producto en carrito
     */
    async updateProductQuantity(req, res, next) {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;
            const cart = await cartService.updateProductQuantity(cid, pid, quantity, req.user);
            
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

    /**
     * POST /api/carts/:cid/purchase
     * Finalizar compra del carrito
     */
    async purchase(req, res, next) {
        try {
            const { cid } = req.params;
            const result = await cartService.purchase(cid, req.user);
            
            // Si no se procesó ningún producto, devolver 400
            if (result.status === 'error') {
                return res.status(400).json(result);
            }
            
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

// Exportar instancia
export default new CartController();
