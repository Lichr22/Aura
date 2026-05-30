import { BaseRecord } from './BaseRecord.js';

/**
 * Representa un registro de actividad sexual.
 * Requisito UML: ActividadSexual
 */
export class SexualActivity extends BaseRecord {
    constructor(id, date, protection = true, orgasm = true, additionalMethod = 'Ninguno') {
        super(id, date);
        this.protection = protection;
        this.orgasm = orgasm;
        this.additionalMethod = additionalMethod;
    }

    /**
     * Implementación polimórfica del resumen
     */
    getSummary() {
        const protText = this.protection ? 'con protección' : 'sin protección';
        return `Actividad sexual ${protText}. Método: ${this.additionalMethod}.`;
    }
}
