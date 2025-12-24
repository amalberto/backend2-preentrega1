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
     * Query param: ?withAvailableStock=true para incluir stock disponible real
     */
    async getAll(req, res, next) {
        try {
            const { limit, page, sort, category, status, withAvailableStock } = req.query;
            
            // Parsear status si viene como string
            const parsedStatus = status === 'true' ? true : 
                                 status === 'false' ? false : 
                                 undefined;

            // Base URL para construir links de paginación
            const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

            const params = {
                limit,
                page,
                sort,
                category,
                status: parsedStatus,
                baseUrl
            };

            // Usar método con stock disponible si se solicita
            const result = withAvailableStock === 'true' 
                ? await productService.getAllWithAvailableStock(params)
                : await productService.getAll(params);

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

    /**
     * POST /api/products
     * Crear nuevo producto (solo admin)
     */
    async create(req, res, next) {
        try {
            const product = await productService.create(req.body);
            
            res.status(201).json({
                status: 'success',
                payload: product
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/products/:pid
     * Actualizar producto (solo admin)
     */
    async update(req, res, next) {
        try {
            const { pid } = req.params;
            const product = await productService.update(pid, req.body);
            
            res.json({
                status: 'success',
                payload: product
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/products/:pid
     * Eliminar producto (solo admin)
     */
    async delete(req, res, next) {
        try {
            const { pid } = req.params;
            await productService.delete(pid);
            
            res.json({
                status: 'success',
                message: 'Producto eliminado'
            });
        } catch (error) {
            next(error);
        }
    }
}

// Exportar instancia
export default new ProductController();
