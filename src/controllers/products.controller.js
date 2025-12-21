// src/controllers/products.controller.js
import productService from '../services/products.service.js';

/**
 * ProductController
 * Maneja las requests HTTP para productos
 */
class ProductController {
    /**
     * GET /api/products
     * Listar productos con paginación
     */
    async getAll(req, res, next) {
        try {
            const { limit, page, sort, category, status } = req.query;
            
            // Parsear status si viene como string
            const parsedStatus = status === 'true' ? true : 
                                 status === 'false' ? false : 
                                 undefined;

            // Base URL para construir links de paginación
            const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

            const result = await productService.getAll({
                limit,
                page,
                sort,
                category,
                status: parsedStatus,
                baseUrl
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/products/:pid
     * Obtener producto por ID
     */
    async getById(req, res, next) {
        try {
            const { pid } = req.params;
            const product = await productService.getById(pid);
            
            res.json({
                status: 'success',
                payload: product
            });
        } catch (error) {
            next(error);
        }
    }
}

// Exportar instancia
export default new ProductController();
