import { UserRepository } from '../repositories/UserRepository.js';
import { LocalStorageService } from './LocalStorageService.js';

export class AuthService {
    /**
     * Inicia la sesión guardando el ID del usuario como currentUser
     * @param {string|number} userId 
     */
    static login(userId) {
        LocalStorageService.save('currentUser', userId);
    }

    /**
     * Recupera el usuario con la sesión activa actual
     * @returns {User|null}
     */
    static getCurrentUser() {
        const currentUserId = LocalStorageService.load('currentUser');
        if (!currentUserId) return null;
        return UserRepository.findById(currentUserId);
    }
    
    /**
     * Cierra la sesión (elimina el puntero en local storage)
     */
    static logout() {
        LocalStorageService.remove('currentUser');
    }

    /**
     * Registra un nuevo usuario en el sistema
     * @param {User} newUser 
     * @returns {boolean} true si se registró correctamente, false si ya existe
     */
    static register(newUser) {
        if (UserRepository.findByEmail(newUser.email)) {
            return false; // El correo ya existe
        }
        UserRepository.save(newUser);
        return true;
    }
}
