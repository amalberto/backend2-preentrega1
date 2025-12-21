// src/repositories/products.repository.js
import BaseRepository from './BaseRepository.js';
import productDAO from '../dao/mongo/products.dao.js';

/**
 * ProductRepository
 * Repository específico para productos
 */
class ProductRepository extends BaseRepository {
    constructor() {
        super(productDAO);
    }

    /**
     * Buscar producto por código
     * @param {string} code - Código del producto
     * @returns {Promise<Object|null>}
     */
    async getByCode(code) {
        return this.dao.getByCode(code);
    }

    /**
     * Buscar productos por categoría
     * @param {string} category - Categoría
     * @param {Object} options - Opciones
     * @returns {Promise<Array>}
     */
    async getByCategory(category, options = {}) {
        return this.dao.getByCategory(category, options);
    }

    /**
     * Obtener productos activos
     * @param {Object} filter - Filtros
     * @param {Object} options - Opciones
     * @returns {Promise<Array>}
     */
    async getActive(filter = {}, options = {}) {
        return this.dao.getActive(filter, options);
    }

    /**
     * Decrementar stock de forma atómica
     * @param {string} productId - ID del producto
     * @param {number} quantity - Cantidad a decrementar
     * @returns {Promise<Object|null>} - Producto actualizado o null si no hay stock
     */
    async decrementStock(productId, quantity) {
        return this.dao.decrementStock(productId, quantity);
    }
}

// Exportar instancia singleton
export default new ProductRepository();
