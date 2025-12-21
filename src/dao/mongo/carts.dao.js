// src/dao/mongo/carts.dao.js
import BaseMongoDAO from './BaseMongoDAO.js';
import Cart from '../../models/Cart.js';

/**
 * CartDAO
 * DAO específico para carritos, extiende BaseMongoDAO
 */
class CartDAO extends BaseMongoDAO {
    constructor() {
        super(Cart);
    }

    /**
     * Obtener carrito con productos populados
     * @param {string} id - ID del carrito
     * @returns {Promise<Object|null>}
     */
    async getByIdWithProducts(id) {
        return this.getById(id, { populate: 'products.product' });
    }

    /**
     * Agregar producto al carrito
     * Si el producto ya existe, incrementa quantity
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {number} quantity - Cantidad a agregar
     * @returns {Promise<Object|null>}
     */
    async addProduct(cartId, productId, quantity = 1) {
        // Buscar si el producto ya está en el carrito
        const cart = await this.model.findById(cartId);
        if (!cart) return null;

        const existingItem = cart.products.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            // Incrementar cantidad
            existingItem.quantity += quantity;
        } else {
            // Agregar nuevo item
            cart.products.push({ product: productId, quantity });
        }

        await cart.save();
        return cart.toObject();
    }

    /**
     * Actualizar cantidad de un producto en el carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {number} quantity - Nueva cantidad
     * @returns {Promise<Object|null>}
     */
    async updateProductQuantity(cartId, productId, quantity) {
        const cart = await this.model.findOneAndUpdate(
            { _id: cartId, 'products.product': productId },
            { $set: { 'products.$.quantity': quantity } },
            { new: true, runValidators: true }
        );
        return cart ? cart.toObject() : null;
    }

    /**
     * Eliminar producto del carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @returns {Promise<Object|null>}
     */
    async removeProduct(cartId, productId) {
        const cart = await this.model.findByIdAndUpdate(
            cartId,
            { $pull: { products: { product: productId } } },
            { new: true }
        );
        return cart ? cart.toObject() : null;
    }

    /**
     * Vaciar carrito
     * @param {string} cartId - ID del carrito
     * @returns {Promise<Object|null>}
     */
    async clear(cartId) {
        const cart = await this.model.findByIdAndUpdate(
            cartId,
            { $set: { products: [] } },
            { new: true }
        );
        return cart ? cart.toObject() : null;
    }
}

// Exportar instancia singleton
export default new CartDAO();
