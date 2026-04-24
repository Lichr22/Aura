/**
 * Clase base para el sistema de análisis de salud de Aura.
 * Demuestra HERENCIA como requisito académico (Equivalente a Clase Cuenta).
 */
export class Analysis {
    constructor(userId, date = new Date()) {
        this.userId = userId;
        this.date = new Date(date);
    }

    /**
     * Método POLIMÓRFICO para obtener una recomendación.
     * Debe ser sobrescrito por las clases hijas.
     */
    getRecommendation() {
        return "Realizando análisis general...";
    }

    getFormattedDate() {
        return this.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    }
}
