// src/routes/products.api.js
import { Router } from 'express';
import productController from '../controllers/products.controller.js';

const router = Router();

/**
 * GET /api/products
 * Listar productos con paginación
 * Query params: limit, page, sort, category, status
 */
router.get('/', productController.getAll.bind(productController));

/**
 * GET /api/products/:pid
 * Obtener producto por ID
 */
router.get('/:pid', productController.getById.bind(productController));

export default router;
