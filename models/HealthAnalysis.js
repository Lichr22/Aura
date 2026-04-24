import { Analysis } from './Analysis.js';

/**
 * Clase que analiza la severidad de los síntomas registrados.
 * Demuestra HERENCIA y POLIMORFISMO (Equivalente a TarjetaCredito - Evaluación de Riesgo).
 */
export class HealthAnalysis extends Analysis {
    constructor(userId, averageSeverity) {
        super(userId);
        this.averageSeverity = averageSeverity; // Escala 1-5
    }

    /**
     * Implementación polimórfica de recomendación basada en riesgo de salud.
     */
    getRecommendation() {
        if (this.averageSeverity >= 4) {
            return {
                title: "Riesgo de Salud Elevado",
                desc: "Has registrado síntomas con intensidad muy alta. Te sugerimos consultar a un especialista de confianza.",
                status: 'danger'
            };
        }
        if (this.averageSeverity >= 2) {
            return {
                title: "Monitoreo Preventivo",
                desc: "Presentas molestias moderadas. Prioriza el descanso y la hidratación durante estos días.",
                status: 'warning'
            };
        }
        return {
            title: "Estado Óptimo",
            desc: "No se detectan síntomas críticos. Estás gestionando tu bienestar de manera excelente.",
            status: 'success'
        };
    }
}
