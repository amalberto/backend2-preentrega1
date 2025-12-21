// src/repositories/BaseRepository.js
// Repository base que encapsula el DAO

/**
 * BaseRepository
 * Capa de abstracción sobre el DAO.
 * 
 * Responsabilidades:
 * - Encapsular el DAO (la capa de servicio no conoce el DAO directamente)
 * - Punto de extensión para lógica de caché, logging, etc.
 * - Facilita cambiar de persistencia (MongoDB → PostgreSQL) sin tocar servicios
 * 
 * Uso: extender esta clase para cada entidad (ProductRepository, etc.)
 */
export default class BaseRepository {
    constructor(dao) {
        if (!dao) {
            throw new Error('BaseRepository requiere un DAO');
        }
        this.dao = dao;
    }

    /**
     * Obtener todos los documentos
     * @param {Object} filter - Filtros opcionales
     * @param {Object} options - Opciones de query
     * @returns {Promise<Array>}
     */
    async getAll(filter = {}, options = {}) {
        return this.dao.getAll(filter, options);
    }

    /**
     * Obtener documento por ID
     * @param {string} id - ID del documento
     * @param {Object} options - Opciones
     * @returns {Promise<Object|null>}
     */
    async getById(id, options = {}) {
        return this.dao.getById(id, options);
    }

    /**
     * Obtener un documento por filtro
     * @param {Object} filter - Filtros
     * @param {Object} options - Opciones
     * @returns {Promise<Object|null>}
     */
    async getOne(filter, options = {}) {
        return this.dao.getOne(filter, options);
    }

    /**
     * Crear nuevo documento
     * @param {Object} data - Datos
     * @returns {Promise<Object>}
     */
    async create(data) {
        return this.dao.create(data);
    }

    /**
     * Actualizar documento por ID
     * @param {string} id - ID
     * @param {Object} data - Datos a actualizar
     * @param {Object} options - Opciones
     * @returns {Promise<Object|null>}
     */
    async updateById(id, data, options = {}) {
        return this.dao.updateById(id, data, options);
    }

    /**
     * Eliminar documento por ID
     * @param {string} id - ID
     * @returns {Promise<Object|null>}
     */
    async deleteById(id) {
        return this.dao.deleteById(id);
    }

    /**
     * Contar documentos
     * @param {Object} filter - Filtros
     * @returns {Promise<number>}
     */
    async count(filter = {}) {
        return this.dao.count(filter);
    }

    /**
     * Verificar existencia
     * @param {Object} filter - Filtros
     * @returns {Promise<boolean>}
     */
    async exists(filter) {
        return this.dao.exists(filter);
    }
}
