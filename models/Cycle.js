import { BaseRecord } from './BaseRecord.js';

export class Cycle extends BaseRecord {
    /**
     * @param {string|number} id Identificador del ciclo
     * @param {Date|string} startDate Fecha de inicio de la menstruación
     * @param {Date|string|null} endDate Fecha final (antes del inicio del sig. ciclo). Si es nulo, es el ciclo actual
     * @param {number} averageDuration Duración promedio esperada del ciclo (en días)
     * @param {number} periodDuration Duración promedio del periodo/sangrado (en días)
     */
    constructor(id, startDate, endDate = null, averageDuration = 28, periodDuration = 5) {
        super(id, startDate);
        this.startDate = this.date; // Alias para compatibilidad
        this.endDate = endDate ? new Date(endDate) : null;
        this.averageDuration = averageDuration;
        this.periodDuration = periodDuration;
    }

    /**
     * Calcula la fecha del próximo periodo basándose en el inicio actual y la duración promedio del ciclo
     * @returns {Date} Fecha aproximada del próximo periodo
     */
    calculateNextPeriod() {
        const nextPeriodDate = new Date(this.startDate);
        nextPeriodDate.setDate(nextPeriodDate.getDate() + this.averageDuration);
        return nextPeriodDate;
    }

    /**
     * Calcula la ventana fértil y el día de ovulación
     * @returns {Object} { start, end, ovulation } con objetos Date
     */
    calculateFertileWindow() {
        // La ovulación generalmente ocurre unos 14 días antes de la próxima menstruación
        const nextPeriod = this.calculateNextPeriod();
        const ovulationDay = new Date(nextPeriod);
        ovulationDay.setDate(ovulationDay.getDate() - 14);

        // La ventana fértil suele ser de unos 6 días: 5 previos a la ovulación y el día de la ovulación
        // Aquí usamos 3 días antes y 2 después como aproximación
        const fertileStart = new Date(ovulationDay);
        fertileStart.setDate(fertileStart.getDate() - 3);

        const fertileEnd = new Date(ovulationDay);
        fertileEnd.setDate(fertileEnd.getDate() + 2);

        return { start: fertileStart, end: fertileEnd, ovulation: ovulationDay };
    }

    /**
     * Definición estática de las fases del ciclo.
     */
    static PHASES = {
        MENSTRUATION: { 
            name: 'Menstruación', 
            desc: 'Descanso y cuidado 🌹', 
            longDesc: 'Tu cuerpo está liberando el revestimiento uterino. Es normal sentir menos energía.', 
            exercise: 'Caminatas suaves, estiramientos o yoga restaurativo. Escucha a tu cuerpo.',
            color: '#C2185B' 
        },
        FOLLICULAR: { 
            name: 'Fase Folicular', 
            desc: 'Energía en alza ✨', 
            longDesc: 'El estrógeno sube, preparándote para la ovulación. Te sientes más social y creativa.', 
            exercise: 'Entrenamiento de fuerza, running o baile. Tienes más resistencia ahora.',
            color: '#E91E8C' 
        },
        OVULATION: { 
            name: 'Ovulación', 
            desc: 'Pico de vitalidad 🌟', 
            longDesc: 'Tu día más fértil. Tus niveles de energía y confianza están en su punto máximo.', 
            exercise: 'HIIT, cardio intenso o deportes competitivos. Es tu momento de mayor fuerza.',
            color: '#AD1457' 
        },
        LUTEAL: { 
            name: 'Fase Lútea', 
            desc: 'Calma e introspección 🌙', 
            longDesc: 'La progesterona domina. Es normal sentirte más tranquila o notar síntomas de SPM.', 
            exercise: 'Pilates, natación suave o caminatas en la naturaleza. Baja el ritmo gradualmente.',
            color: '#880E4F' 
        }
    };

    /**
     * Determina la fase actual del ciclo y devuelve detalles completos.
     * @param {Date} currentDate Fecha a evaluar
     * @returns {Object} { name, desc, color }
     */
    getPhaseDetails(currentDate = new Date()) {
        const nextPeriod = this.calculateNextPeriod();
        const diffDays = Math.floor((currentDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
        const { start, end } = this.calculateFertileWindow();
        
        if (diffDays <= this.periodDuration) {
            return Cycle.PHASES.MENSTRUATION;
        }

        if (currentDate >= start && currentDate <= end) {
            return Cycle.PHASES.OVULATION;
        }
        
        const diffDaysToNext = Math.floor((nextPeriod - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDaysToNext > 14) {
            return Cycle.PHASES.FOLLICULAR;
        } else {
            return Cycle.PHASES.LUTEAL;
        }
    }

    /**
     * Implementación polimórfica del resumen
     */
    getSummary() {
        return `Ciclo iniciado el ${this.getFormattedDate()} (${this.averageDuration} días esperados)`;
    }

    /**
     * Lógica de Negocio: Verifica si el ciclo es irregular (equivalente a "Sobregiro" o validación de reglas).
     * Si la duración es mayor a 35 días o menor a 21, se considera irregular.
     * @returns {Object} { isIrregular: boolean, type: string }
     */
    checkIrregularity() {
        if (this.averageDuration > 35) {
            return { isIrregular: true, type: 'Ciclo Largo (Posible Oligomenorrea)' };
        }
        if (this.averageDuration < 21) {
            return { isIrregular: true, type: 'Ciclo Corto (Posible Polimenorrea)' };
        }
        return { isIrregular: false, type: 'Normal' };
    }

    /**
     * Lógica de Negocio: Análisis de severidad por retraso (Equivalente a Requisito 5.4 de Tarjeta de Crédito).
     * Aplica niveles de alerta basados en el número de días de retraso.
     * @param {number} delayDays 
     * @returns {Object} { severity: string, interestMapped: number }
     */
    analyzeRiskSeverity(delayDays) {
        if (delayDays <= 2) {
            return { severity: 'Baja', alert: 'No requiere acción', rateMapped: 0 };
        } else if (delayDays >= 3 && delayDays <= 6) {
            return { severity: 'Media', alert: 'Monitorear síntomas', rateMapped: 1.9 };
        } else {
            return { severity: 'Alta', alert: 'Consultar especialista', rateMapped: 2.3 };
        }
    }
}
