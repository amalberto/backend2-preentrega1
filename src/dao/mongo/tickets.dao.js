// src/dao/mongo/tickets.dao.js
import BaseMongoDAO from './BaseMongoDAO.js';
import Ticket from '../../models/Ticket.js';

/**
 * TicketDAO
 * DAO específico para tickets, extiende BaseMongoDAO
 */
class TicketDAO extends BaseMongoDAO {
    constructor() {
        super(Ticket);
    }

    /**
     * Obtener tickets por email del comprador
     * @param {string} email - Email del purchaser
     * @param {Object} options - Opciones (sort, limit, etc.)
     * @returns {Promise<Array>}
     */
    async getByPurchaser(email, options = {}) {
        const { sort = { purchase_datetime: -1 }, limit } = options;
        
        // Normalizar email a lowercase (consistente con el modelo)
        const normalizedEmail = email.toLowerCase().trim();
        
        let query = this.model.find({ purchaser: normalizedEmail }).sort(sort);
        
        if (limit) {
            query = query.limit(limit);
        }
        
        const docs = await query.lean();
        return docs;
    }

    /**
     * Obtener ticket por código único
     * @param {string} code - Código del ticket
     * @returns {Promise<Object|null>}
     */
    async getByCode(code) {
        const doc = await this.model.findOne({ code }).lean();
        return doc;
    }
}

// Exportar instancia singleton
export default new TicketDAO();
