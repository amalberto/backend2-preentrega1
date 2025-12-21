// src/dao/mongo/BaseMongoDAO.js
// DAO base para operaciones CRUD con MongoDB/Mongoose

/**
 * BaseMongoDAO
 * Clase base abstracta que proporciona operaciones CRUD genéricas
 * para cualquier modelo de Mongoose.
 * 
 * Uso: extender esta clase para cada entidad (ProductDAO, CartDAO, etc.)
 * 
 * NOTA sobre retornos:
 * - get* devuelven .lean() (objetos planos, mejor performance)
 * - create/update/delete devuelven .toObject() (objeto plano del doc guardado)
 * - Ambos son objetos planos JS, pero .lean() no tiene getters/virtuals de Mongoose
 */
export default class BaseMongoDAO {
    constructor(model) {
        if (!model) {
            throw new Error('BaseMongoDAO requiere un modelo de Mongoose');
        }
        this.model = model;
    }

    /**
     * Obtener todos los documentos
     * @param {Object} filter - Filtros opcionales
     * @param {Object} options - Opciones (limit, skip, sort, populate)
     * @returns {Promise<Array>}
     */
    async getAll(filter = {}, options = {}) {
        const { limit, skip, sort, populate } = options;
        let query = this.model.find(filter);
        
        if (populate) query = query.populate(populate);
        if (sort) query = query.sort(sort);
        if (typeof skip === 'number') query = query.skip(skip);
        if (typeof limit === 'number') query = query.limit(limit);
        
        return query.lean();
    }

    /**
     * Obtener documento por ID
     * @param {string} id - ID del documento
     * @param {Object} options - Opciones (populate)
     * @returns {Promise<Object|null>}
     */
    async getById(id, options = {}) {
        const { populate } = options;
        let query = this.model.findById(id);
        
        if (populate) query = query.populate(populate);
        
        return query.lean();
    }

    /**
     * Obtener un documento por filtro
     * @param {Object} filter - Filtros de búsqueda
     * @param {Object} options - Opciones (populate)
     * @returns {Promise<Object|null>}
     */
    async getOne(filter, options = {}) {
        const { populate } = options;
        let query = this.model.findOne(filter);
        
        if (populate) query = query.populate(populate);
        
        return query.lean();
    }

    /**
     * Crear nuevo documento
     * @param {Object} data - Datos del documento
     * @returns {Promise<Object>}
     */
    async create(data) {
        const doc = await this.model.create(data);
        return doc.toObject();
    }

    /**
     * Actualizar documento por ID
     * @param {string} id - ID del documento
     * @param {Object} data - Datos a actualizar
     * @param {Object} options - Opciones (new: true, runValidators: true por defecto)
     * @returns {Promise<Object|null>}
     */
    async updateById(id, data, options = {}) {
        const opts = { new: true, runValidators: true, ...options };
        const doc = await this.model.findByIdAndUpdate(id, data, opts);
        return doc ? doc.toObject() : null;
    }

    /**
     * Eliminar documento por ID
     * @param {string} id - ID del documento
     * @returns {Promise<Object|null>}
     */
    async deleteById(id) {
        const doc = await this.model.findByIdAndDelete(id);
        return doc ? doc.toObject() : null;
    }

    /**
     * Contar documentos
     * @param {Object} filter - Filtros opcionales
     * @returns {Promise<number>}
     */
    async count(filter = {}) {
        return this.model.countDocuments(filter);
    }

    /**
     * Verificar si existe un documento
     * @param {Object} filter - Filtros de búsqueda
     * @returns {Promise<boolean>}
     */
    async exists(filter) {
        const doc = await this.model.exists(filter);
        return !!doc;
    }
}
