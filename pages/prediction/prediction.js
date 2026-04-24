import { User } from '../../models/User.js';

document.addEventListener('DOMContentLoaded', () => {
    // La sesión y el header ahora son manejados por GlobalUI.js

    // 1. Lógica de Predicción
    const btnCalcular = document.getElementById('calcular');
    const inputFecha = document.getElementById('fecha');
    const inputCiclo = document.getElementById('ciclo');
    const displayProxima = document.getElementById('proxima');
    const displayFertil = document.getElementById('fertil');

    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    // Cargar duración del ciclo desde el Perfil Menstrual
    const user = User.getCurrentUser();
    if (user && user.menstrualProfile && inputCiclo) {
        inputCiclo.value = user.menstrualProfile.averageCycleDuration || 28;
    }

    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            const fechaValor = inputFecha.value;
            const cicloValor = parseInt(inputCiclo.value);

            if (!fechaValor || !cicloValor || cicloValor <= 0) {
                alert('Por favor, ingresa una fecha válida y la duración de tu ciclo.');
                return;
            }

            const fechaInicio = new Date(fechaValor + 'T00:00:00');

            const proximaFecha = new Date(fechaInicio);
            proximaFecha.setDate(fechaInicio.getDate() + cicloValor);
            displayProxima.textContent = proximaFecha.toLocaleDateString('es-ES', opcionesFecha);

            const fechaOvulacion = new Date(proximaFecha);
            fechaOvulacion.setDate(proximaFecha.getDate() - 14);

            const inicioFertil = new Date(fechaOvulacion);
            inicioFertil.setDate(fechaOvulacion.getDate() - 5);

            const finFertil = new Date(fechaOvulacion);
            finFertil.setDate(fechaOvulacion.getDate() + 1);

            const formatoCorto = { day: 'numeric', month: 'short' };
            displayFertil.textContent = `${inicioFertil.toLocaleDateString('es-ES', formatoCorto)} - ${finFertil.toLocaleDateString('es-ES', formatoCorto)}`;

            // Guardar automáticamente el ciclo en el perfil del usuario
            const sesion = User.getCurrentUser();
            if (sesion) {
                sesion.addCycle({
                    id: Date.now(),
                    startDate: fechaInicio,
                    endDate: proximaFecha,
                    averageDuration: cicloValor,
                    periodDuration: 5 // Valor por defecto
                });
                User.saveToLocalStorage(sesion);
                console.log('Ciclo guardado en el perfil');
            }
        });
    }
});