import { BaseRecord } from './BaseRecord.js';

/**
 * Representa un registro de flujo (menstrual o vaginal).
 *
 * CAMBIOS:
 *  - Se agrega el campo `odor` para registrar el olor del flujo vaginal.
 *  - Se agrega el campo `logType` ('menstrual' | 'vaginal') para distinguir
 *    el origen del registro sin romper la estructura existente.
 *  - Constructor mantiene compatibilidad total: todos los parámetros nuevos
 *    tienen valores por defecto, por lo que el código existente que usa
 *    new FlowLog(id, date, texture, color, amount) sigue funcionando sin cambios.
 *
 * Requisito UML: RegistroFlujo
 */
export class FlowLog extends BaseRecord {
    /**
     * @param {string|number} id
     * @param {Date|string}   date
     * @param {string}        texture  - Textura / espesor del flujo
     * @param {string}        color    - Color del flujo
     * @param {string}        amount   - Cantidad (menstrual) o descripción de cantidad (vaginal)
     * @param {string}        odor     - Olor del flujo ('Sin olor' | 'Leve' | 'Fuerte' | 'Muy fuerte')
     * @param {string}        logType  - Tipo de registro ('menstrual' | 'vaginal')
     */
    constructor(
        id,
        date,
        texture  = 'Líquida',
        color    = 'Rojo Brillante',
        amount   = 'Moderada',
        odor     = 'Sin olor',
        logType  = 'menstrual'
    ) {
        super(id, date);
        this.texture = texture;
        this.color   = color;
        this.amount  = amount;
        this.odor    = odor;
        this.logType = logType;
    }

    /**
     * Implementación polimórfica del resumen.
     * Muestra información diferenciada según el tipo de flujo.
     */
    getSummary() {
        if (this.logType === 'vaginal') {
            return `Flujo vaginal: Color ${this.color}, espesor ${this.texture}, olor ${this.odor}.`;
        }
        const odorPart = (this.odor && this.odor !== 'Sin olor') ? `, olor ${this.odor}` : '';
        return `Flujo ${this.amount}: Textura ${this.texture}, color ${this.color}${odorPart}.`;
    }
}
