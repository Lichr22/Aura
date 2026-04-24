import { User } from '../../models/User.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementos del DOM
    const dayElement = document.getElementById('cycle-day');
    const ringElement = document.querySelector('.progress-ring');
    
    // 2. Extraer usuario de la sesión actual
    const sesion = User.getCurrentUser();
    let currentDay = 1; // Default
    let totalCycleDays = 28;

    if (sesion) {
        // Obtenemos el ciclo más reciente si lo hay
        const latestCycle = sesion.getLatestCycle();
        if (latestCycle) {
            totalCycleDays = latestCycle.averageDuration || 28;
            
            const hoy = new Date();
            const start = new Date(latestCycle.startDate);
            if (hoy >= start) {
                const diffTime = Math.abs(hoy - start);
                currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            // Actualizar fase en el header
            const phase = latestCycle.getPhaseDetails();
            const phaseNameEl = document.getElementById('current-phase-name');
            if (phaseNameEl) phaseNameEl.textContent = phase.name;
            if (ringElement) ringElement.style.stroke = phase.color;
        }
    }
    
    if (dayElement && ringElement) {
        dayElement.textContent = currentDay;
        const progressPercent = Math.min((currentDay / totalCycleDays) * 100, 100);
        
        setTimeout(() => {
            const finalOffset = 440 - (440 * progressPercent) / 100;
            ringElement.style.strokeDashoffset = finalOffset;
        }, 150);
    }
});

// Lógica de expansión y redirección
document.addEventListener('DOMContentLoaded', () => {
    const btnVerMas = document.querySelector('.btn-ver-mas');
    const btnAi = document.querySelector('.btn-ai');

    if (btnVerMas) {
        btnVerMas.addEventListener('click', () => {
            // Primero redirigimos al resumen detallado
            window.location.href = 'pages/summary/summary.html';
        });
    }

    if (btnAi) {
        btnAi.addEventListener('click', () => {
            window.location.href = 'pages/aIAssistant/aiassistant.html';
        });
    }
});
