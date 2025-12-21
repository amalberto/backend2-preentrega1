// src/services/carts.service.js
import mongoose from 'mongoose';
import cartRepository from '../repositories/carts.repository.js';
import productRepository from '../repositories/products.repository.js';

/**
 * CartService
 * Lógica de negocio para carritos
 */
class CartService {
    constructor() {
        this.repository = cartRepository;
        this.productRepository = productRepository;
    }

    /**
     * Crear carrito vacío
     * @returns {Promise<Object>}
     */
    async create() {
        return this.repository.create({ products: [] });
    }

    /**
     * Obtener carrito por ID con productos populados
     * @param {string} id - ID del carrito
     * @returns {Promise<Object>}
     */
    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }

        const cart = await this.repository.getByIdWithProducts(id);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return cart;
    }

    /**
     * Agregar producto al carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {number} quantity - Cantidad (default: 1)
     * @param {Object} user - Usuario autenticado (para validar propiedad)
     * @returns {Promise<Object>}
     */
    async addProduct(cartId, productId, quantity = 1, user = null) {
        // Validar IDs
        if (!mongoose.isValidObjectId(cartId)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }
        if (!mongoose.isValidObjectId(productId)) {
            const error = new Error('ID de producto inválido');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 2:** Validar y normalizar quantity
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1) {
            const error = new Error('La cantidad debe ser un entero positivo');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 1:** Verificar que el carrito pertenece al usuario
        if (user && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        // Verificar que el carrito existe
        const cart = await this.repository.getById(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Verificar que el producto existe y está activo
        const product = await this.productRepository.getById(productId);
        if (!product) {
            const error = new Error('Producto no encontrado');
            error.statusCode = 404;
            throw error;
        }
        if (!product.status) {
            const error = new Error('Producto no disponible');
            error.statusCode = 400;
            throw error;
        }

        // Agregar al carrito
        await this.repository.addProduct(cartId, productId, qty);
        
        // **AJUSTE 3:** Devolver carrito populado para consistencia
        return this.repository.getByIdWithProducts(cartId);
    }

    /**
     * Eliminar producto del carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {Object} user - Usuario autenticado
     * @returns {Promise<Object>}
     */
    async removeProduct(cartId, productId, user = null) {
        if (!mongoose.isValidObjectId(cartId) || !mongoose.isValidObjectId(productId)) {
            const error = new Error('ID inválido');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 1:** Verificar propiedad del carrito
        if (user && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        await this.repository.removeProduct(cartId, productId);
        
        // **AJUSTE 3:** Devolver carrito populado
        const cart = await this.repository.getByIdWithProducts(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return cart;
    }

    /**
     * Vaciar carrito
     * @param {string} cartId - ID del carrito
     * @param {Object} user - Usuario autenticado
     * @returns {Promise<Object>}
     */
    async clear(cartId, user = null) {
        if (!mongoose.isValidObjectId(cartId)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 1:** Verificar propiedad del carrito
        if (user && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        const cart = await this.repository.clear(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return cart;
    }
}

// Exportar instancia singleton
export default new CartService();
