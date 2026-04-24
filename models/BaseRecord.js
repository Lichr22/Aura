/**
 * Clase base para todos los registros del sistema Aura.
 * Proporciona funcionalidad común para herencia y polimorfismo.
 */
export class BaseRecord {
    /**
     * @param {string|number} id Identificador único
     * @param {Date|string} date Fecha de creación o referencia
     */
    constructor(id, date) {
        this.id = id;
        this.date = new Date(date);
    }

    /**
     * Método polimórfico para obtener un resumen del registro.
     * Debe ser sobrescrito por las clases hijas.
     * @returns {string}
     */
    getSummary() {
        return `Registro ID: ${this.id} - Fecha: ${this.date.toLocaleDateString()}`;
    }

    /**
     * Método para formatear la fecha de manera estándar.
     * @returns {string}
     */
    getFormattedDate() {
        return this.date.toISOString().split('T')[0];
    }
}
