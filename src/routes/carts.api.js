// src/routes/carts.api.js
import { Router } from 'express';
import cartController from '../controllers/carts.controller.js';
import { passportCall } from '../utils/passportCall.js';
import { authorization } from '../middlewares/authorization.js';

const router = Router();

/**
 * GET /api/carts/mine
 * Obtener o crear el carrito del usuario autenticado
 */
router.get('/mine',
    passportCall('current'),
    authorization('user'),
    cartController.mine.bind(cartController)
);

/**
 * POST /api/carts/mine
 * Crear u obtener el carrito del usuario autenticado (alias de GET)
 */
router.post('/mine',
    passportCall('current'),
    authorization('user'),
    cartController.mine.bind(cartController)
);

/**
 * POST /api/carts
 * Crear carrito vacío (protegido - solo user)
 */
router.post('/',
    passportCall('current'),
    authorization('user'),
    cartController.create.bind(cartController)
);

/**
 * GET /api/carts/:cid
 * Obtener carrito por ID (protegido, valida propiedad)
 */
router.get('/:cid',
    passportCall('current'),
    authorization('user'),
    cartController.getById.bind(cartController)
);

/**
 * POST /api/carts/:cid/products/:pid
 * Agregar producto al carrito (solo user)
 */
router.post('/:cid/products/:pid',
    passportCall('current'),
    authorization('user'),
    cartController.addProduct.bind(cartController)
);

/**
 * PUT /api/carts/:cid/products/:pid
 * Actualizar cantidad de producto en carrito (solo user)
 */
router.put('/:cid/products/:pid',
    passportCall('current'),
    authorization('user'),
    cartController.updateProductQuantity.bind(cartController)
);

/**
 * DELETE /api/carts/:cid/products/:pid
 * Eliminar producto del carrito (solo user)
 */
router.delete('/:cid/products/:pid',
    passportCall('current'),
    authorization('user'),
    cartController.removeProduct.bind(cartController)
);

/**
 * DELETE /api/carts/:cid
 * Vaciar carrito (solo user)
 */
router.delete('/:cid',
    passportCall('current'),
    authorization('user'),
    cartController.clear.bind(cartController)
);

/**
 * POST /api/carts/:cid/purchase
 * Finalizar compra del carrito (solo user)
 */
router.post('/:cid/purchase',
    passportCall('current'),
    authorization('user'),
    cartController.purchase.bind(cartController)
);

export default router;
