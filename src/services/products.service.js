// src/services/products.service.js
import mongoose from 'mongoose';
import productRepository from '../repositories/products.repository.js';

/**
 * ProductService
 * Lógica de negocio para productos
 */
class ProductService {
    constructor() {
        this.repository = productRepository;
    }

    /**
     * Obtener productos con paginación
     * @param {Object} params - Parámetros de búsqueda
     * @param {number} params.limit - Límite de resultados (default: 10)
     * @param {number} params.page - Página (default: 1)
     * @param {string} params.sort - Ordenamiento: 'asc' | 'desc' (por precio)
     * @param {string} params.category - Filtrar por categoría
     * @param {boolean} params.status - Filtrar por status
     * @param {string} params.baseUrl - URL base para links (opcional)
     * @returns {Promise<Object>} - Resultado paginado
     */
    async getAll({ limit = 10, page = 1, sort, category, status, baseUrl = '' } = {}) {
        // Parsear y validar paginación (evitar NaN/negativos)
        const parsedLimit = Math.max(1, Number(limit) || 10);
        const parsedPage = Math.max(1, Number(page) || 1);

        // Construir filtro
        const filter = {};
        if (category) filter.category = category;
        if (typeof status === 'boolean') filter.status = status;

        // Construir opciones
        const options = {
            limit: parsedLimit,
            skip: (parsedPage - 1) * parsedLimit
        };

        // Ordenamiento por precio
        if (sort === 'asc') options.sort = { price: 1 };
        else if (sort === 'desc') options.sort = { price: -1 };

        // Ejecutar queries en paralelo
        const [products, totalCount] = await Promise.all([
            this.repository.getAll(filter, options),
            this.repository.count(filter)
        ]);

        // Calcular metadata de paginación (mínimo 1 página)
        const totalPages = Math.max(1, Math.ceil(totalCount / parsedLimit));
        const hasPrevPage = parsedPage > 1;
        const hasNextPage = parsedPage < totalPages;

        // Construir query string preservando filtros
        const buildLink = (targetPage) => {
            const params = new URLSearchParams();
            params.set('page', targetPage);
            params.set('limit', parsedLimit);
            if (sort) params.set('sort', sort);
            if (category) params.set('category', category);
            if (typeof status === 'boolean') params.set('status', status);
            return `${baseUrl}?${params.toString()}`;
        };

        return {
            status: 'success',
            payload: products,
            totalPages,
            prevPage: hasPrevPage ? parsedPage - 1 : null,
            nextPage: hasNextPage ? parsedPage + 1 : null,
            page: parsedPage,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? buildLink(parsedPage - 1) : null,
            nextLink: hasNextPage ? buildLink(parsedPage + 1) : null
        };
    }

    /**
     * Obtener producto por ID
     * @param {string} id - ID del producto
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        // Validar formato de ObjectId
        if (!mongoose.isValidObjectId(id)) {
            const error = new Error('ID de producto inválido');
            error.statusCode = 400;
            throw error;
        }

        const product = await this.repository.getById(id);
        if (!product) {
            const error = new Error('Producto no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return product;
    }

    /**
     * Obtener producto por código
     * @param {string} code - Código del producto
     * @returns {Promise<Object|null>}
     */
    async getByCode(code) {
        return this.repository.getByCode(code);
    }
}

// Exportar instancia singleton
export default new ProductService();
