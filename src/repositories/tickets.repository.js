// src/repositories/tickets.repository.js
import BaseRepository from './BaseRepository.js';
import ticketDAO from '../dao/mongo/tickets.dao.js';

/**
 * TicketRepository
 * Repository específico para tickets
 */
class TicketRepository extends BaseRepository {
    constructor() {
        super(ticketDAO);
    }

    /**
     * Obtener tickets por email del comprador
     */
    async getByPurchaser(email, options = {}) {
        return this.dao.getByPurchaser(email, options);
    }

    /**
     * Obtener ticket por código único
     */
    async getByCode(code) {
        return this.dao.getByCode(code);
    }
}

// Exportar instancia singleton
export default new TicketRepository();
