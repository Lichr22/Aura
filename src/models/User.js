import { Cycle } from './Cycle.js';
import { SymptomLog } from './SymptomLog.js';
import { MenstrualProfile } from './MenstrualProfile.js';
import { FlowLog } from './FlowLog.js';
import { SexualActivity } from './SexualActivity.js';

export class User {
    constructor(id, name, email, password, status = 'active', createdAt = new Date(), loginAttempts = 0) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password; 
        this.status = status;
        this.createdAt = new Date(createdAt);
        this.avatar = '';
        this.cycles = [];
        this.symptomsLogs = [];
        this.flowLogs = [];
        this.sexualActivities = [];
        this.loginAttempts = loginAttempts;
        this.menstrualProfile = new MenstrualProfile(this.id);
    }

    /**
     * Agrega un nuevo ciclo a la historia de la usuaria
     * @param {Object} cycleData Datos del ciclo { id, startDate, endDate, averageDuration, periodDuration }
     * @returns {Cycle} El objeto ciclo insertado
     */
    addCycle(cycleData) {
        const newCycle = new Cycle(
            cycleData.id, 
            cycleData.startDate, 
            cycleData.endDate, 
            cycleData.averageDuration, 
            cycleData.periodDuration
        );
        this.cycles.push(newCycle);
        return newCycle;
    }

    /**
     * Añade un registro diario de síntomas/estado
     * @param {Object} logData Datos del registro
     * @returns {SymptomLog}
     */
    addSymptomLog(logData) {
        const newLog = new SymptomLog(
            logData.id, 
            logData.date, 
            logData.emotions, 
            logData.symptoms, 
            logData.flowIntensity, 
            logData.notes
        );
        this.symptomsLogs.push(newLog);
        return newLog;
    }

    /**
     * Obtiene el ciclo más reciente basándose en el orden del array
     * @returns {Cycle|null}
     */
    getLatestCycle() {
        if (this.cycles.length === 0) return null;
        return this.cycles[this.cycles.length - 1]; 
    }

    /**
     * Actualiza la información del perfil
     * @param {Object} newData { name, email, avatar }
     */
    updateProfile(newData) {
        if (newData.name) this.name = newData.name;
        if (newData.email) this.email = newData.email;
        if (newData.avatar) this.avatar = newData.avatar;
    }

    /**
     * Cambia la contraseña verificando la actual
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {boolean}
     */
    changePassword(oldPassword, newPassword) {
        if (this.password === oldPassword) {
            this.password = newPassword;
            return true;
        }
        return false;
    }

    /**
     * Registra un intento fallido y bloquea si llega a 3
     */
    recordFailedAttempt() {
        this.loginAttempts++;
        if (this.loginAttempts >= 3) {
            this.status = 'blocked';
        }
    }

    /**
     * Reinicia el contador de intentos tras un login exitoso
     */
    resetAttempts() {
        this.loginAttempts = 0;
    }
}
