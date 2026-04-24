import { User } from '../../models/User.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember-me');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    // 1. Cargar correo recordado si existe
    const savedEmail = localStorage.getItem('aura_remembered_email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Ocultar errores previos
        if(emailError) emailError.style.display = 'none';
        if(passwordError) passwordError.style.display = 'none';
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const attemptsInfo = document.getElementById('attempts-info');

        // Buscar el usuario mediante el Modelo User
        const user = User.findByEmail(email);

        if (!user) {
            if(emailError) {
                emailError.textContent = 'No existe una cuenta registrada con este correo.';
                emailError.style.display = 'block';
            } else alert('No existe una cuenta registrada con este correo.');
            return;
        }

        // 0. Verificar si la cuenta ya está bloqueada
        if (user.status === 'blocked' || user.status === 'bloqueado') {
            alert('Esta cuenta ha sido bloqueada tras 3 intentos fallidos. Contacta a soporte.');
            return;
        }

        // 1. Verificar si la contraseña coincide
        if (user.password !== password) {
            user.recordFailedAttempt();
            const remaining = 3 - user.loginAttempts;
            
            if (user.status === 'blocked') {
                alert('Cuenta bloqueada por seguridad después de 3 intentos.');
                if (attemptsInfo) attemptsInfo.textContent = 'Cuenta bloqueada.';
            } else {
                if(passwordError) {
                    passwordError.textContent = `Contraseña incorrecta. Intentos restantes: ${remaining}`;
                    passwordError.style.display = 'block';
                }
                if (attemptsInfo) attemptsInfo.textContent = `Intentos fallidos: ${user.loginAttempts}/3`;
            }
            return;
        }

        // 2. Verificar el estado de la cuenta (por otras razones)
        if (user.status !== 'active' && user.status !== 'activo') {
            alert('Tu cuenta no está activa. Por favor contacta soporte.');
            return;
        }

        // Reiniciar intentos tras éxito
        user.resetAttempts();

        // --- Lógica de Recuérdame ---
        if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('aura_remembered_email', email);
        } else {
            localStorage.removeItem('aura_remembered_email');
        }

        // GUARDAR SESIÓN (Persistencia en el Modelo)
        User.login(user.id);

        alert(`Bienvenid@ de nuevo, ${user.name}`);

        // Redirigir al Dashboard
        window.location.href = '../../index.html';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const emailInput = document.getElementById('email'); // Asegúrate de que tu input tenga este ID

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que la página recargue o salte

            const emailValue = emailInput.value.trim();

            // 1. Validar si el campo está vacío
            if (!emailValue) {
                alert('Por favor, escribe tu correo electrónico primero para poder ayudarte.');
                emailInput.focus(); // Pone el cursor en el campo para ayudar al usuario
                return;
            }

            // 2. Opcional: Validar si el formato es correcto (puedes usar la función isValidEmail que ya tienes)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                alert('Por favor, ingresa un formato de correo válido.');
                return;
            }

            // 3. Mostrar aviso de éxito
            alert(`Se ha enviado un mensaje de recuperación a: ${emailValue}. Revisa tu bandeja de entrada.`);
        });
    }
});