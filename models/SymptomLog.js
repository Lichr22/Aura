import { BaseRecord } from './BaseRecord.js';

export class SymptomLog extends BaseRecord {
    /**
     * @param {string|number} id Identificador único del registro
     * @param {Date|string} date Fecha del registro
     * @param {Array<string>} emotions Lista de emociones (ej: 'Triste', 'Alegre')
     * @param {Array<string>} symptoms Lista de síntomas físicos (ej: 'Cólicos', 'Acné')
     * @param {string|null} flowIntensity Nivel de flujo (ej: 'Ligero', 'Pesado')
     * @param {string} notes Notas adicionales
     */
    constructor(id, date, emotions = [], symptoms = [], flowIntensity = null, notes = '') {
        super(id, date);
        this.emotions = emotions;
        this.symptoms = symptoms;
        this.flowIntensity = flowIntensity;
        this.notes = notes;
    }

    /**
     * Verifica si se registró un síntoma específico
     */
    hasSymptom(symptomName) {
        return this.symptoms.includes(symptomName);
    }

    /**
     * Verifica si se registró una emoción específica
     */
    hasEmotion(emotionName) {
        return this.emotions.includes(emotionName);
    }
    
    /**
     * Actualiza el nivel de flujo
     */
    updateFlow(intensity) {
        this.flowIntensity = intensity;
    }

    /**
     * Implementación polimórfica del resumen
     */
    getSummary() {
        const symptomsCount = this.symptoms.length;
        const emotionsCount = this.emotions.length;
        return `Registro de síntomas del ${this.getFormattedDate()}: ${symptomsCount} síntomas, ${emotionsCount} emociones.`;
    }
}
