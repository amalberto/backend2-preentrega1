// src/dao/mongo/products.dao.js
import BaseMongoDAO from './BaseMongoDAO.js';
import Product from '../../models/Product.js';

/**
 * ProductDAO
 * DAO específico para productos, extiende BaseMongoDAO
 */
class ProductDAO extends BaseMongoDAO {
    constructor() {
        super(Product);
    }

    /**
     * Buscar producto por código único
     * @param {string} code - Código del producto
     * @returns {Promise<Object|null>}
     */
    async getByCode(code) {
        return this.getOne({ code: code.toUpperCase() });
    }

    /**
     * Buscar productos por categoría
     * @param {string} category - Categoría
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Array>}
     */
    async getByCategory(category, options = {}) {
        return this.getAll({ category, status: true }, options);
    }

    /**
     * Obtener productos activos con paginación
     * @param {Object} filter - Filtros adicionales
     * @param {Object} options - Opciones (limit, skip, sort)
     * @returns {Promise<Array>}
     */
    async getActive(filter = {}, options = {}) {
        return this.getAll({ ...filter, status: true }, options);
    }

    /**
     * Decrementar stock de forma atómica (evita race conditions)
     * Solo decrementa si hay stock suficiente
     * @param {string} productId - ID del producto
     * @param {number} quantity - Cantidad a decrementar
     * @returns {Promise<Object|null>} - Producto actualizado o null si no hay stock
     */
    async decrementStock(productId, quantity) {
        const doc = await this.model.findOneAndUpdate(
            { 
                _id: productId, 
                stock: { $gte: quantity },
                status: true // Solo productos activos
            },
            { $inc: { stock: -quantity } },
            { new: true }
        );
        return doc ? doc.toObject() : null;
    }
}

// Exportar instancia singleton
export default new ProductDAO();
