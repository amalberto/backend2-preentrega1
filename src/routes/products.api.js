// src/routes/products.api.js
import { Router } from 'express';
import productController from '../controllers/products.controller.js';
import { passportCall } from '../utils/passportCall.js';
import { authorization } from '../middlewares/authorization.js';

const router = Router();

/**
 * GET /api/products
 * Listar productos con paginación (público)
 * Query params: limit, page, sort, category, status
 */
router.get('/', productController.getAll.bind(productController));

/**
 * GET /api/products/:pid
 * Obtener producto por ID (público)
 */
router.get('/:pid', productController.getById.bind(productController));

/**
 * POST /api/products
 * Crear nuevo producto (solo admin)
 */
router.post('/',
    passportCall('current'),
    authorization('admin'),
    productController.create.bind(productController)
);

/**
 * PUT /api/products/:pid
 * Actualizar producto (solo admin)
 */
router.put('/:pid',
    passportCall('current'),
    authorization('admin'),
    productController.update.bind(productController)
);

/**
 * DELETE /api/products/:pid
 * Eliminar producto (solo admin)
 */
router.delete('/:pid',
    passportCall('current'),
    authorization('admin'),
    productController.delete.bind(productController)
);

export default router;
