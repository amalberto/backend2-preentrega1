// src/routes/carts.api.js
import { Router } from 'express';
import cartController from '../controllers/carts.controller.js';
import { passportCall } from '../utils/passportCall.js';
import { authorization } from '../middlewares/authorization.js';

const router = Router();

/**
 * POST /api/carts/mine
 * Crear u obtener el carrito del usuario autenticado
 * (evita que el front "adivine" el cartId)
 */
router.post('/mine',
    passportCall('current'),
    authorization('user'),
    cartController.mine.bind(cartController)
);

/**
 * POST /api/carts
 * Crear carrito vacío (público por ahora)
 */
router.post('/', cartController.create.bind(cartController));

/**
 * GET /api/carts/:cid
 * Obtener carrito por ID (público)
 */
router.get('/:cid', cartController.getById.bind(cartController));

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
