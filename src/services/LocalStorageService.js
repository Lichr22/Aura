export class LocalStorageService {
    /**
     * Guarda un valor en LocalStorage
     * @param {string} key 
     * @param {any} value 
     */
    static save(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Carga un valor desde LocalStorage
     * @param {string} key 
     * @returns {any}
     */
    static load(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        try {
            return JSON.parse(item);
        } catch (e) {
            return item; // Por si es un string que no está en JSON
        }
    }

    /**
     * Elimina un valor de LocalStorage
     * @param {string} key 
     */
    static remove(key) {
        localStorage.removeItem(key);
    }

    /**
     * Verifica si existe una llave en LocalStorage
     * @param {string} key 
     * @returns {boolean}
     */
    static exists(key) {
        return localStorage.getItem(key) !== null;
    }
}
