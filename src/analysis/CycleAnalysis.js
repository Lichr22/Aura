import { Analysis } from './Analysis.js';

/**
 * Clase que analiza la regularidad del ciclo.
 * Demuestra HERENCIA y POLIMORFISMO (Equivalente a CuentaCorriente).
 */
export class CycleAnalysis extends Analysis {
    constructor(userId, cycleDuration) {
        super(userId);
        this.cycleDuration = cycleDuration;
    }

    /**
     * Implementación polimórfica de recomendación basada en duración.
     */
    getRecommendation() {
        if (this.cycleDuration > 35) {
            return {
                title: "Ciclo Prolongado",
                desc: `Tu ciclo actual de ${this.cycleDuration} días es más largo de lo normal. Recomendamos monitorear niveles de estrés.`,
                status: 'warning'
            };
        }
        if (this.cycleDuration < 21) {
            return {
                title: "Ciclo Acortado",
                desc: `Tu ciclo de ${this.cycleDuration} días es inusualmente corto. Podría ser fatiga o cambios hormonales.`,
                status: 'warning'
            };
        }
        return {
            title: "Ciclo Regular",
            desc: "Tu ritmo biológico se mantiene estable y dentro de los rangos saludables.",
            status: 'success'
        };
    }
}
