import { BaseRecord } from './BaseRecord.js';

/**
 * Representa un registro de flujo menstrual.
 * Requisito UML: RegistroFlujo
 */
export class FlowLog extends BaseRecord {
    constructor(id, date, texture = 'Líquida', color = 'Rojo Brillante', amount = 'Moderada') {
        super(id, date);
        this.texture = texture;
        this.color = color;
        this.amount = amount;
    }

    /**
     * Implementación polimórfica del resumen
     */
    getSummary() {
        return `Flujo ${this.amount}: Textura ${this.texture}, color ${this.color}.`;
    }
}
