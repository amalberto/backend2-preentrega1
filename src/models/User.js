// src/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        max: 120
    },
    password: { 
        type: String, 
        required: true 
    }, // Hashed password
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    // Password Reset
    passwordResetTokenHash: {
        type: String,
        default: null
    },
    passwordResetExpiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

//Hash de password antes de guardar
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

//Método para comparar password (login)
userSchema.methods.comparePassword = function(plain) {
    return bcrypt.compare(plain, this.password);
};

// Nota: No es necesario declarar index aquí porque ya está en el schema con unique: true

const User = mongoose.model('User', userSchema);

export default User;