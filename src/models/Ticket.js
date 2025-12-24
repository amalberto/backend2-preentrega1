// src/models/Ticket.js
import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Genera un UUID único
 * Usa crypto.randomUUID() si está disponible (Node 14.17+),
 * sino fallback con randomBytes
 */
const generateUUID = () => {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback para versiones de Node sin randomUUID
    const bytes = crypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const ticketSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        default: generateUUID
    },
    // Fecha oficial de compra (distinta de createdAt que es técnico)
    purchase_datetime: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: [true, 'El monto es requerido'],
        min: [0, 'El monto no puede ser negativo']
    },
    purchaser: {
        type: String,
        required: [true, 'El email del comprador es requerido'],
        lowercase: true, // Normaliza a minúsculas
        trim: true
    },
    // Detalle de productos comprados (snapshot al momento de la compra)
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        title: String,      // Snapshot del título
        price: Number,      // Snapshot del precio al momento de compra
        quantity: Number
    }]
}, {
    timestamps: true // createdAt/updatedAt para auditoría técnica
});

// Índice para búsquedas por purchaser
ticketSchema.index({ purchaser: 1 });

// Índice para ordenar por fecha de compra
ticketSchema.index({ purchase_datetime: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
