// src/services/tickets.service.js
import mongoose from 'mongoose';
import ticketRepository from '../repositories/tickets.repository.js';

/**
 * TicketService
 * Lógica de negocio para tickets
 */
class TicketService {
    constructor() {
        this.repository = ticketRepository;
    }

    /**
     * Crear un nuevo ticket
     * @param {Object} data - Datos del ticket { amount, purchaser, products }
     * @returns {Promise<Object>}
     */
    async create(data) {
        const { amount, purchaser, products } = data;

        // Validar amount
        if (typeof amount !== 'number' || amount < 0) {
            const error = new Error('El monto debe ser un número positivo');
            error.statusCode = 400;
            throw error;
        }

        // Validar purchaser (email)
        if (!purchaser || typeof purchaser !== 'string') {
            const error = new Error('El email del comprador es requerido');
            error.statusCode = 400;
            throw error;
        }

        // code y purchase_datetime se generan automáticamente por el modelo
        return this.repository.create({ amount, purchaser, products: products || [] });
    }

    /**
     * Obtener ticket por ID
     * @param {string} id - ID del ticket
     * @returns {Promise<Object>}
     */
    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            const error = new Error('ID de ticket inválido');
            error.statusCode = 400;
            throw error;
        }

        const ticket = await this.repository.getById(id);
        if (!ticket) {
            const error = new Error('Ticket no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return ticket;
    }

    /**
     * Obtener ticket por código único
     * @param {string} code - Código del ticket
     * @returns {Promise<Object>}
     */
    async getByCode(code) {
        if (!code || typeof code !== 'string') {
            const error = new Error('Código de ticket inválido');
            error.statusCode = 400;
            throw error;
        }

        const ticket = await this.repository.getByCode(code);
        if (!ticket) {
            const error = new Error('Ticket no encontrado');
            error.statusCode = 404;
            throw error;
        }
        return ticket;
    }

    /**
     * Obtener historial de tickets de un usuario
     * @param {string} email - Email del purchaser
     * @param {Object} options - Opciones de paginación
     * @returns {Promise<Array>}
     */
    async getByPurchaser(email, options = {}) {
        if (!email || typeof email !== 'string') {
            const error = new Error('Email requerido');
            error.statusCode = 400;
            throw error;
        }

        return this.repository.getByPurchaser(email, options);
    }

    /**
     * Obtener todos los tickets (para admin)
     * @returns {Promise<Array>}
     */
    async getAll() {
        return this.repository.getAll();
    }
}

// Exportar instancia singleton
export default new TicketService();
