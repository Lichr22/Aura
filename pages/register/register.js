import { User } from '../../models/User.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.register-form');

    const isValidEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const terms = document.getElementById('terms').checked;

        // --- VALIDACIONES ---
        if (!name || !email || !password || !confirmPassword) {
            alert('Por favor completa todos los campos.');
            return;
        }

        if (!isValidEmail(email)) {
            alert('Por favor ingresa un correo electrónico válido.');
            return;
        }

        if (password.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        if (!terms) {
            alert('Debes aceptar los términos y condiciones.');
            return;
        }

        // --- PERSISTENCIA CON EL MODELO USER ---
        
        // 1. Crear la instancia de la clase
        const newUser = new User(
            Date.now(),
            name,
            email,
            password
        );

        // 2. Registrar en LocalStorage mediante User.js
        const success = User.registerUser(newUser);

        if (!success) {
            alert('El correo electrónico ya está registrado.');
            return;
        }

        alert('¡Registro exitoso! Ya puedes entrar.');

        // 3. Redirección
        window.location.href = '../login/login.html';
    });
});