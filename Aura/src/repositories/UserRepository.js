import { LocalStorageService } from '../services/LocalStorageService.js';
import { User } from '../models/User.js';
import { Cycle } from '../models/Cycle.js';
import { SymptomLog } from '../models/SymptomLog.js';
import { FlowLog } from '../models/FlowLog.js';
import { SexualActivity } from '../models/SexualActivity.js';
import { MenstrualProfile } from '../models/MenstrualProfile.js';

export class UserRepository {
    /**
     * Guarda la instancia del usuario en persistencia
     * @param {User} user 
     */
    static save(user) {
        LocalStorageService.save(`user_${user.id}`, user);
        
        // Actualizamos el directorio global de IDs para poder buscarlos después
        let directory = LocalStorageService.load('usersDirectory') || [];
        if (!directory.includes(user.id)) {
            directory.push(user.id);
            LocalStorageService.save('usersDirectory', directory);
        }
    }

    /**
     * Carga y reconstruye un objeto User desde persistencia
     * @param {string|number} id
     * @returns {User|null}
     */
    static findById(id) {
        const parsed = LocalStorageService.load(`user_${id}`);
        if (!parsed) return null;

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
            // odor y logType son campos nuevos — se usan valores por defecto si no existen
            // en registros persistidos antes de esta versión (retrocompatibilidad total).
            user.flowLogs = parsed.flowLogs.map(l => new FlowLog(
                l.id,
                l.date,
                l.texture,
                l.color,
                l.amount,
                l.odor    !== undefined ? l.odor    : 'Sin olor',
                l.logType !== undefined ? l.logType : 'menstrual'
            ));
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
     * Obtiene a todos los usuarios registrados
     * @returns {Array<User>}
     */
    static getAll() {
        const directory = LocalStorageService.load('usersDirectory') || [];
        const users = [];
        for (const id of directory) {
            const user = this.findById(id);
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
        const users = this.getAll();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    /**
     * Elimina un usuario por su ID
     * @param {string|number} id 
     */
    static delete(id) {
        const directory = LocalStorageService.load('usersDirectory') || [];
        const updatedDir = directory.filter(dirId => dirId !== id);
        LocalStorageService.save('usersDirectory', updatedDir);
        LocalStorageService.remove(`user_${id}`);
    }
}
