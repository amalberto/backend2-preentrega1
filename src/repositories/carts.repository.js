// src/repositories/carts.repository.js
import BaseRepository from './BaseRepository.js';
import cartDAO from '../dao/mongo/carts.dao.js';

/**
 * CartRepository
 * Repository específico para carritos
 */
class CartRepository extends BaseRepository {
    constructor() {
        super(cartDAO);
    }

    /**
     * Obtener carrito con productos populados
     */
    async getByIdWithProducts(id) {
        return this.dao.getByIdWithProducts(id);
    }

    /**
     * Agregar producto al carrito
     */
    async addProduct(cartId, productId, quantity = 1) {
        return this.dao.addProduct(cartId, productId, quantity);
    }

    /**
     * Actualizar cantidad de producto
     */
    async updateProductQuantity(cartId, productId, quantity) {
        return this.dao.updateProductQuantity(cartId, productId, quantity);
    }

    /**
     * Eliminar producto del carrito
     */
    async removeProduct(cartId, productId) {
        return this.dao.removeProduct(cartId, productId);
    }

    /**
     * Vaciar carrito
     */
    async clear(cartId) {
        return this.dao.clear(cartId);
    }
}

// Exportar instancia singleton
export default new CartRepository();
