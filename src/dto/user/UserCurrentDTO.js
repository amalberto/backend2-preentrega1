// src/dto/user/UserCurrentDTO.js
// DTO para respuesta segura del usuario actual (sin datos sensibles)

/**
 * UserCurrentDTO
 * Transforma el documento de usuario a un objeto seguro para exponer en API
 * Excluye: password, tokens, campos internos de Mongoose
 */
export default class UserCurrentDTO {
    constructor(user) {
        // Normalizar id a string para evitar edge-cases de serialización
        this.id = user._id?.toString?.() ?? user.id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.role = user.role;
    }

    /**
     * Método estático para crear DTO desde documento de usuario
     * @param {Object} user - Documento de usuario de MongoDB
     * @returns {UserCurrentDTO}
     */
    static from(user) {
        return new UserCurrentDTO(user);
    }
}
