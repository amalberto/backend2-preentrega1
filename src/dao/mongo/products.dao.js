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
}

// Exportar instancia singleton
export default new ProductDAO();
