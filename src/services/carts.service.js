// src/services/carts.service.js
import mongoose from 'mongoose';
import cartRepository from '../repositories/carts.repository.js';
import productRepository from '../repositories/products.repository.js';
import ticketService from './tickets.service.js';
import User from '../models/User.js';
import { CART_EXPIRATION_MINUTES } from '../models/Cart.js';

/**
 * Helper: extraer ID de producto de un item del carrito
 * Maneja tanto productos populados como referencias
 * @param {Object} item - Item del carrito
 * @returns {string|null} - ID del producto o null si no existe
 */
const getProductId = (item) => {
    if (!item?.product) return null;
    // Si está populado, item.product es un objeto con _id
    // Si no está populado, item.product es el ObjectId directamente
    return (item.product._id ?? item.product).toString();
};

/**
 * CartService
 * Lógica de negocio para carritos
 */
class CartService {
    constructor() {
        this.repository = cartRepository;
        this.productRepository = productRepository;
    }

    /**
     * Asegurar que un usuario tenga un carrito asociado.
     * - Si user.cart existe pero el carrito no existe, crea uno nuevo.
     * - Solo aplica para rol "user".
     * - Si el carrito expiró (TTL), crea uno nuevo automáticamente.
     *
     * @param {Object} user - Usuario autenticado (req.user)
     * @returns {Promise<Object>} - Carrito (doc lean)
     */
    async ensureUserCart(user) {
        if (!user || !user._id) {
            const error = new Error('Usuario no autenticado');
            error.statusCode = 401;
            throw error;
        }

        // Por reglas del proyecto, solo los users operan carrito.
        if (user.role && user.role !== 'user') {
            const error = new Error('Solo los usuarios con rol "user" pueden operar carrito');
            error.statusCode = 403;
            throw error;
        }

        // Si ya tiene cart y existe (no expiró), devolvemos.
        if (user.cart) {
            const existing = await this.repository.getById(user.cart);
            if (existing) return existing;
            // Si llegamos aquí, el carrito expiró (TTL lo eliminó)
            // Continuamos para crear uno nuevo
        }

        // Crear carrito nuevo y asociarlo al user.
        const created = await this.repository.create({ products: [] });
        const cartId = created?._id;

        await User.findByIdAndUpdate(user._id, { cart: cartId });

        // Mantener el req.user actualizado en memoria (por si se usa luego en el request).
        if (typeof user.set === 'function') {
            user.set('cart', cartId);
        } else {
            user.cart = cartId;
        }

        return created;
    }

    /**
     * Obtener tiempo de expiración configurado
     * @returns {number} - Minutos de expiración
     */
    getExpirationMinutes() {
        return CART_EXPIRATION_MINUTES;
    }

    /**
     * [ADMIN] Obtener todos los carritos con info de usuario
     * Solo muestra carritos que tengan productos
     * @returns {Promise<Array>}
     */
    async getAllForAdmin() {
        // Obtener todos los usuarios con carrito asociado
        const usersWithCarts = await User.find({ cart: { $ne: null } })
            .populate({
                path: 'cart',
                populate: { path: 'products.product' }
            })
            .lean();

        // Formatear resultado para el admin (solo carritos con productos)
        return usersWithCarts
            .filter(u => u.cart && u.cart.products && u.cart.products.length > 0)
            .map(u => ({
                user: {
                    _id: u._id,
                    email: u.email,
                    first_name: u.first_name,
                    last_name: u.last_name
                },
                cart: u.cart
            }));
    }

    /**
     * Crear carrito vacío
     * @returns {Promise<Object>}
     */
    async create() {
        return this.repository.create({ products: [] });
    }

    /**
     * Obtener carrito por ID con productos populados
     * @param {string} id - ID del carrito
     * @param {Object} user - Usuario autenticado (para validar propiedad)
     * @returns {Promise<Object>}
     */
    async getById(id, user = null) {
        if (!mongoose.isValidObjectId(id)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }

        const cart = await this.repository.getByIdWithProducts(id);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Validar propiedad del carrito para usuarios role=user
        if (user && user.role === 'user' && user.cart && user.cart.toString() !== id) {
            const error = new Error('No tenés permiso para acceder a este carrito');
            error.statusCode = 403;
            throw error;
        }

        return cart;
    }

    /**
     * Actualizar cantidad de un producto en el carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {number} quantity - Nueva cantidad
     * @param {Object} user - Usuario autenticado
     * @returns {Promise<Object>}
     */
    async updateProductQuantity(cartId, productId, quantity, user = null) {
        if (!mongoose.isValidObjectId(cartId)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }
        if (!mongoose.isValidObjectId(productId)) {
            const error = new Error('ID de producto inválido');
            error.statusCode = 400;
            throw error;
        }

        const parsedQty = parseInt(quantity, 10);
        if (!Number.isInteger(parsedQty) || parsedQty < 1) {
            const error = new Error('quantity debe ser un entero >= 1');
            error.statusCode = 400;
            throw error;
        }

        const cart = await this.repository.getById(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Validar propiedad del carrito
        if (user && user.role === 'user' && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        // Verificar que el producto existe en el carrito
        const exists = (cart.products || []).some(i => {
            const pid = i.product?._id || i.product;
            return pid.toString() === productId;
        });
        if (!exists) {
            const error = new Error('El producto no está en el carrito');
            error.statusCode = 404;
            throw error;
        }

        await this.repository.updateProductQuantity(cartId, productId, parsedQty);
        return await this.repository.getByIdWithProducts(cartId);
    }

    /**
     * Agregar producto al carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {number} quantity - Cantidad (default: 1)
     * @param {Object} user - Usuario autenticado (para validar propiedad)
     * @returns {Promise<Object>}
     */
    async addProduct(cartId, productId, quantity = 1, user = null) {
        // Validar IDs
        if (!mongoose.isValidObjectId(cartId)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }
        if (!mongoose.isValidObjectId(productId)) {
            const error = new Error('ID de producto inválido');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 2:** Validar y normalizar quantity
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1) {
            const error = new Error('La cantidad debe ser un entero positivo');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 1:** Verificar que el carrito pertenece al usuario
        if (user && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        // Verificar que el carrito existe
        const cart = await this.repository.getById(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Verificar que el producto existe y está activo
        const product = await this.productRepository.getById(productId);
        if (!product) {
            const error = new Error('Producto no encontrado');
            error.statusCode = 404;
            throw error;
        }
        if (!product.status) {
            const error = new Error('Producto no disponible');
            error.statusCode = 400;
            throw error;
        }

        // Agregar al carrito
        await this.repository.addProduct(cartId, productId, qty);
        
        // **AJUSTE 3:** Devolver carrito populado para consistencia
        return this.repository.getByIdWithProducts(cartId);
    }

    /**
     * Eliminar producto del carrito
     * @param {string} cartId - ID del carrito
     * @param {string} productId - ID del producto
     * @param {Object} user - Usuario autenticado
     * @returns {Promise<Object>}
     */
    async removeProduct(cartId, productId, user = null) {
        if (!mongoose.isValidObjectId(cartId) || !mongoose.isValidObjectId(productId)) {
            const error = new Error('ID inválido');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 1:** Verificar propiedad del carrito
        if (user && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        await this.repository.removeProduct(cartId, productId);
        
        // **AJUSTE 3:** Devolver carrito populado
        const cart = await this.repository.getByIdWithProducts(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return cart;
    }

    /**
     * Vaciar carrito
     * @param {string} cartId - ID del carrito
     * @param {Object} user - Usuario autenticado
     * @returns {Promise<Object>}
     */
    async clear(cartId, user = null) {
        if (!mongoose.isValidObjectId(cartId)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }

        // **AJUSTE 1:** Verificar propiedad del carrito
        if (user && user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para modificar este carrito');
            error.statusCode = 403;
            throw error;
        }

        const cart = await this.repository.clear(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return cart;
    }

    /**
     * Finalizar compra del carrito
     * @param {string} cartId - ID del carrito
     * @param {Object} user - Usuario autenticado
     * @returns {Promise<Object>} - { status, message, ticket?, unprocessedProducts? }
     */
    async purchase(cartId, user) {
        // Validar cartId
        if (!mongoose.isValidObjectId(cartId)) {
            const error = new Error('ID de carrito inválido');
            error.statusCode = 400;
            throw error;
        }

        // Verificar que el usuario está autenticado
        if (!user || !user.email) {
            const error = new Error('Usuario no autenticado');
            error.statusCode = 401;
            throw error;
        }

        // Verificar propiedad del carrito (si user.cart existe)
        if (user.cart && user.cart.toString() !== cartId) {
            const error = new Error('No tenés permiso para comprar este carrito');
            error.statusCode = 403;
            throw error;
        }

        // Obtener carrito con productos populados
        const cart = await this.repository.getByIdWithProducts(cartId);
        if (!cart) {
            const error = new Error('Carrito no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Verificar que el carrito no está vacío
        if (!cart.products || cart.products.length === 0) {
            const error = new Error('El carrito está vacío');
            error.statusCode = 400;
            throw error;
        }

        // Arrays para tracking
        const processedItems = [];      // Items comprados exitosamente
        const unprocessedProducts = []; // IDs de productos sin stock suficiente

        // Procesar cada item del carrito
        for (const item of cart.products) {
            const productId = getProductId(item);
            
            // Si no hay producto (populate falló o fue borrado)
            if (!productId) {
                unprocessedProducts.push('unknown');
                continue;
            }

            const product = item.product; // Objeto populado (puede ser null)
            const requestedQty = item.quantity;

            // Validar quantity (entero positivo)
            const qty = Number(requestedQty);
            if (!Number.isInteger(qty) || qty < 1) {
                unprocessedProducts.push(productId);
                continue;
            }

            // Verificar que el producto existe y está activo
            if (!product || typeof product !== 'object' || !product.status) {
                unprocessedProducts.push(productId);
                continue;
            }

            // Intentar decrementar stock atómicamente
            // Esto evita race conditions: solo decrementa si hay stock suficiente
            const updatedProduct = await this.productRepository.decrementStock(productId, qty);

            if (updatedProduct) {
                // ✅ HAY STOCK: se decrementó exitosamente
                processedItems.push({
                    product: productId,
                    title: product.title,
                    price: product.price,
                    quantity: qty,
                    subtotal: product.price * qty
                });
            } else {
                // ❌ NO HAY STOCK: agregar a no procesados
                unprocessedProducts.push(productId);
            }
        }

        // Calcular monto total de items procesados
        const amount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);

        let ticket = null;

        // Crear ticket solo si hay items procesados
        if (processedItems.length > 0) {
            ticket = await ticketService.create({
                amount,
                purchaser: user.email,
                // Guardar snapshot de productos comprados
                products: processedItems.map(item => ({
                    product: item.product,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity
                }))
            });
        }

        // Actualizar carrito: dejar solo items no procesados
        if (unprocessedProducts.length > 0) {
            // Filtrar productos del carrito dejando solo los no procesados
            const remainingProducts = cart.products
                .filter(item => {
                    const pid = getProductId(item);
                    return pid && unprocessedProducts.includes(pid);
                })
                .map(item => ({
                    product: getProductId(item),
                    quantity: item.quantity
                }));
            
            await this.repository.updateById(cartId, { products: remainingProducts });
        } else {
            // Vaciar carrito completamente
            await this.repository.clear(cartId);
        }

        // Construir respuesta
        const response = {
            status: processedItems.length > 0 ? 'success' : 'error',
            message: this._buildPurchaseMessage(processedItems.length, unprocessedProducts.length)
        };

        if (ticket) {
            response.ticket = ticket;
        }

        if (unprocessedProducts.length > 0) {
            response.unprocessedProducts = unprocessedProducts;
        }

        return response;
    }

    /**
     * Helper: construir mensaje de resultado de compra
     * @private
     */
    _buildPurchaseMessage(processed, unprocessed) {
        if (processed === 0) {
            return 'No se pudo procesar ningún producto por falta de stock';
        }
        if (unprocessed === 0) {
            return 'Compra realizada exitosamente';
        }
        return `Compra parcial: ${processed} producto(s) comprado(s), ${unprocessed} sin stock suficiente`;
    }
}

// Exportar instancia singleton
export default new CartService();
