// src/models/Cart.js
import mongoose from 'mongoose';

// Tiempo de expiración del carrito
// TODO: Cambiar a 4 horas para producción (4 * 60 * 60)
const CART_TTL_MINUTES = 2; // 2 minutos para pruebas
const CART_TTL_SECONDS = CART_TTL_MINUTES * 60;

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'La cantidad mínima es 1'],
        default: 1
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    products: {
        type: [cartItemSchema],
        default: []
    },
    // Campo para TTL - MongoDB elimina automáticamente cuando expira
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + CART_TTL_SECONDS * 1000),
        index: { expires: 0 } // TTL index - elimina cuando Date < now
    }
}, {
    timestamps: true
});

/**
 * Método para renovar la expiración del carrito
 * Llamar cada vez que el usuario interactúa con el carrito
 */
cartSchema.methods.renewExpiration = function() {
    this.expiresAt = new Date(Date.now() + CART_TTL_SECONDS * 1000);
    return this.save();
};

/**
 * Método estático para obtener el tiempo restante de expiración
 */
cartSchema.methods.getTimeRemaining = function() {
    const now = new Date();
    const remaining = this.expiresAt - now;
    return Math.max(0, Math.floor(remaining / 1000)); // segundos restantes
};

// Exportar constante para uso en otros módulos
export const CART_EXPIRATION_MINUTES = CART_TTL_MINUTES;

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
