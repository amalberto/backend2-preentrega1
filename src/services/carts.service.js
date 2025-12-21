// src/services/carts.service.js
import mongoose from 'mongoose';
import cartRepository from '../repositories/carts.repository.js';
import productRepository from '../repositories/products.repository.js';
import ticketService from './tickets.service.js';

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
     * Crear carrito vacío
     * @returns {Promise<Object>}
     */
    async create() {
        return this.repository.create({ products: [] });
    }

    /**
     * Obtener carrito por ID con productos populados
     * @param {string} id - ID del carrito
     * @returns {Promise<Object>}
     */
    async getById(id) {
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
        return cart;
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
                purchaser: user.email
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
