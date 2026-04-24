import { User } from '../../models/User.js';
import { FlowLog } from '../../models/FlowLog.js';
import { SexualActivity } from '../../models/SexualActivity.js';

document.addEventListener('DOMContentLoaded', () => {
    // La sesión y el header ahora son manejados por GlobalUI.js
    const sesion = User.getCurrentUser();

    const pills = document.querySelectorAll('.pill');
    const intensityBtns = document.querySelectorAll('.circle-btn');
    const btnGuardar = document.querySelector('.btn-primary');

    let intensidadSeleccionada = null;

    // 1. Selección de MÚLTIPLES síntomas (Toggle)
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
        });
    });

    // 2. Selección de intensidad
    intensityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            intensityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            intensidadSeleccionada = btn.getAttribute('data-value');
        });
    });

    // 3. Guardar síntomas
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const activas = document.querySelectorAll('.pill.active');
            
            if (activas.length === 0 || !intensidadSeleccionada) {
                alert('Por favor selecciona al menos un síntoma y su intensidad.');
                return;
            }

            const arraySintomas = Array.from(activas).map(p => p.textContent);

            // Guardar usando el modelo de Usuario
            const nuevoRegistro = {
                id: Date.now(),
                date: new Date(),
                emotions: [], // Podríamos expandir el UI para esto después
                symptoms: arraySintomas,
                flowIntensity: 'Moderado', // Placeholder o expandir UI
                notes: ''
            };

            sesion.addSymptomLog(nuevoRegistro);

            // 4. Guardar Registro de Flujo
            const flowTexture = document.getElementById('flow-texture').value;
            const flowAmount = document.getElementById('flow-amount').value;
            const newFlow = new FlowLog(Date.now() + 1, new Date(), flowTexture, 'Rojo', flowAmount);
            sesion.flowLogs.push(newFlow);

            // 5. Guardar Actividad Sexual
            const hasProtection = document.getElementById('sex-protection').checked;
            const hasOrgasm = document.getElementById('sex-orgasm').checked;
            const newSex = new SexualActivity(Date.now() + 2, new Date(), hasProtection, hasOrgasm);
            sesion.sexualActivities.push(newSex);

            User.saveToLocalStorage(sesion);

            alert(`¡Registro diario guardado con éxito! Se registraron síntomas, flujo y actividad.`);

            // Limpiar selección
            pills.forEach(p => p.classList.remove('active'));
            intensityBtns.forEach(b => b.classList.remove('active'));
            intensidadSeleccionada = null;
        });
    }
});