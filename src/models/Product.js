// src/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },
    code: {
        type: String,
        required: [true, 'El código es requerido'],
        unique: true,
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es requerido'],
        min: [0, 'El stock no puede ser negativo'],
        default: 0
    },
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    thumbnails: [{
        type: String
    }]
}, {
    timestamps: true
});

// Índices para búsquedas frecuentes (code ya tiene índice único por unique: true)
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
