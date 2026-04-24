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

    // ==============================================
    // Métodos Estáticos para Persistencia
    // ==============================================

    /**
     * Guarda la instancia actual del usuario en LocalStorage y actualiza el directorio
     * @param {User} user 
     */
    static saveToLocalStorage(user) {
        // Guardamos el objeto entero
        localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
        
        // Actualizamos el directorio global de IDs para poder buscarlos después
        let directory = JSON.parse(localStorage.getItem('usersDirectory')) || [];
        if (!directory.includes(user.id)) {
            directory.push(user.id);
            localStorage.setItem('usersDirectory', JSON.stringify(directory));
        }
    }

    /**
     * Obtiene a todos los usuarios registrados
     * @returns {Array<User>}
     */
    static getAllUsers() {
        const directory = JSON.parse(localStorage.getItem('usersDirectory')) || [];
        const users = [];
        for (const id of directory) {
            const user = this.loadFromLocalStorage(id);
            if (user) users.push(user);
        }
        return users;
    }

    /**
     * Busca un usuario por su correo electrónico
     * @param {string} email 
     * @returns {User|null}
     */
    static findByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    /**
     * Registra un nuevo usuario en la base de datos local
     * @param {User} newUser 
     * @returns {boolean} true si se registró correctamente, false si ya existe
     */
    static registerUser(newUser) {
        if (this.findByEmail(newUser.email)) {
            return false; // El correo ya existe
        }
        this.saveToLocalStorage(newUser);
        return true;
    }

    /**
     * Carga y reconstruye un objeto User desde el LocalStorage
     * @param {string|number} userId
     * @returns {User|null}
     */
    static loadFromLocalStorage(userId) {
        const userDataString = localStorage.getItem(`user_${userId}`);
        if (!userDataString) return null;
        
        const parsed = JSON.parse(userDataString);
        
        // Reconstruimos la clase User
        const user = new User(
            parsed.id, 
            parsed.name, 
            parsed.email, 
            parsed.password, 
            parsed.status, 
            parsed.createdAt,
            parsed.loginAttempts || 0
        );
        user.avatar = parsed.avatar || '';
        
        // Re-hidratar objetos de subtipos
        if (parsed.cycles && Array.isArray(parsed.cycles)) {
            user.cycles = parsed.cycles.map(c => new Cycle(c.id, c.startDate, c.endDate, c.averageDuration, c.periodDuration));
        }
        
        if (parsed.symptomsLogs && Array.isArray(parsed.symptomsLogs)) {
            user.symptomsLogs = parsed.symptomsLogs.map(l => new SymptomLog(l.id, l.date, l.emotions, l.symptoms, l.flowIntensity, l.notes));
        }

        if (parsed.flowLogs && Array.isArray(parsed.flowLogs)) {
            user.flowLogs = parsed.flowLogs.map(l => new FlowLog(l.id, l.date, l.texture, l.color, l.amount));
        }

        if (parsed.sexualActivities && Array.isArray(parsed.sexualActivities)) {
            user.sexualActivities = parsed.sexualActivities.map(l => new SexualActivity(l.id, l.date, l.protection, l.orgasm, l.additionalMethod));
        }

        if (parsed.menstrualProfile) {
            user.menstrualProfile = new MenstrualProfile(
                parsed.menstrualProfile.userId,
                parsed.menstrualProfile.age,
                parsed.menstrualProfile.averageCycleDuration,
                parsed.menstrualProfile.periodDuration,
                parsed.menstrualProfile.useContraceptives
            );
        }
        
        return user;
    }

    /**
     * Inicia la sesión guardando su ID como currentUser
     */
    static login(userId) {
        localStorage.setItem('currentUser', userId);
    }

    /**
     * Recupera el usuario con la sesión activa actual
     * @returns {User|null}
     */
    static getCurrentUser() {
        const currentUserId = localStorage.getItem('currentUser');
        if (!currentUserId) return null;
        return this.loadFromLocalStorage(currentUserId);
    }
    
    /**
     * Cierra la sesión (elimina el puntero en local storage)
     */
    static logout() {
        localStorage.removeItem('currentUser');
    }

    /**
     * Actualiza la información del perfil
     * @param {Object} newData { name, email, avatar }
     */
    updateProfile(newData) {
        if (newData.name) this.name = newData.name;
        if (newData.email) this.email = newData.email;
        if (newData.avatar) this.avatar = newData.avatar;
        User.saveToLocalStorage(this);
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
            User.saveToLocalStorage(this);
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
        User.saveToLocalStorage(this);
    }

    /**
     * Reinicia el contador de intentos tras un login exitoso
     */
    resetAttempts() {
        this.loginAttempts = 0;
        User.saveToLocalStorage(this);
    }
}
