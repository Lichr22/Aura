import { AuthService } from '../../src/services/AuthService.js';
import { AuraStore } from '../../src/services/AuraStore.js';

document.addEventListener('DOMContentLoaded', () => {
    // La sesión y el header ahora son manejados por GlobalUI.js

    const btnCalcular = document.getElementById('calcular');
    const cyclesContainer = document.getElementById('cycles-container');
    const btnAddCycle = document.getElementById('add-cycle');
    const displayProxima = document.getElementById('proxima');
    const displayFertil = document.getElementById('fertil');

    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let cycleCount = 1;

    // Cargar duración del ciclo desde el Perfil Menstrual o historial
    const user = AuthService.getCurrentUser();
    
    if (user && user.cycles && user.cycles.length > 0) {
        cyclesContainer.innerHTML = '';
        cycleCount = 0;
        // Solo cargamos los últimos 5 ciclos para no saturar la vista
        const recentCycles = user.cycles.slice(-5);
        recentCycles.forEach((cycle) => {
            cycleCount++;
            addCycleEntryToDOM(cycleCount, cycle.startDate, cycle.averageDuration);
        });
    } else if (user && user.menstrualProfile) {
        // Setup initial cycle duration
        const inputCiclo = document.querySelector('.cycle-duration');
        if (inputCiclo) inputCiclo.value = user.menstrualProfile.averageCycleDuration || 28;
    }
    
    // Inicializar flatpickr para el primer input (si no se cargaron desde historial)
    if (!user || !user.cycles || user.cycles.length === 0) {
        const initialDateInput = document.querySelector('.cycle-date');
        if (initialDateInput && typeof flatpickr !== 'undefined') {
            flatpickr(initialDateInput, {
                locale: "es",
                dateFormat: "Y-m-d",
                disableMobile: "true"
            });
        }
    }

    function addCycleEntryToDOM(num, startDateStr = '', duration = '') {
        const div = document.createElement('div');
        div.className = 'cycle-entry';
        
        let removeBtnHtml = '';
        if (num > 1) {
            removeBtnHtml = `<button type="button" class="btn-remove-cycle">Quitar</button>`;
        }

        let dateVal = '';
        if (startDateStr) {
            const d = new Date(startDateStr);
            if (!isNaN(d.getTime())) {
                dateVal = d.toISOString().split('T')[0];
            }
        }

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="color: var(--primary-color); margin: 0; font-family: 'Nunito', sans-serif;">Ciclo ${num}</h4>
                ${removeBtnHtml}
            </div>
            <div class="form-group" style="margin-bottom: 0.5rem;">
                <label>Fecha de inicio</label>
                <input type="date" class="form-input cycle-date" value="${dateVal}">
            </div>
            <div class="form-group">
                <label>Duración (días)</label>
                <input type="number" placeholder="Ej: 28" class="form-input cycle-duration" value="${duration}">
            </div>
        `;
        
        if (num > 1) {
            const removeBtn = div.querySelector('.btn-remove-cycle');
            removeBtn.addEventListener('click', () => {
                div.remove();
                reindexCycles();
            });
        }
        
        cyclesContainer.appendChild(div);
        
        // Inicializar flatpickr en el nuevo elemento
        const dateInput = div.querySelector('.cycle-date');
        if (dateInput && typeof flatpickr !== 'undefined') {
            flatpickr(dateInput, {
                locale: "es",
                dateFormat: "Y-m-d",
                defaultDate: dateVal || null,
                disableMobile: "true"
            });
        }
    }
    
    function reindexCycles() {
        const entries = cyclesContainer.querySelectorAll('.cycle-entry');
        cycleCount = 0;
        entries.forEach((entry) => {
            cycleCount++;
            const title = entry.querySelector('h4');
            if (title) title.textContent = `Ciclo ${cycleCount}`;
        });
    }

    if (btnAddCycle) {
        btnAddCycle.addEventListener('click', () => {
            cycleCount++;
            // Try to pre-fill duration from the previous input
            const lastDurationInput = document.querySelectorAll('.cycle-duration');
            let lastDuration = '';
            if (lastDurationInput.length > 0) {
                lastDuration = lastDurationInput[lastDurationInput.length - 1].value;
            }
            addCycleEntryToDOM(cycleCount, '', lastDuration);
        });
    }

    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            const entries = document.querySelectorAll('.cycle-entry');
            let totalDuration = 0;
            let validCycles = 0;
            let latestDate = null;

            entries.forEach(entry => {
                const dateInput = entry.querySelector('.cycle-date').value;
                const durationInput = parseInt(entry.querySelector('.cycle-duration').value);
                
                if (dateInput && durationInput > 0) {
                    validCycles++;
                    totalDuration += durationInput;
                    
                    const currentDate = new Date(dateInput + 'T00:00:00');
                    if (!latestDate || currentDate > latestDate) {
                        latestDate = currentDate;
                    }
                }
            });

            if (validCycles === 0) {
                alert('Por favor, ingresa al menos un ciclo con fecha y duración válidas.');
                return;
            }

            const averageDuration = Math.round(totalDuration / validCycles);

            const proximaFecha = new Date(latestDate);
            proximaFecha.setDate(latestDate.getDate() + averageDuration);
            displayProxima.textContent = proximaFecha.toLocaleDateString('es-ES', opcionesFecha);
            
            // Info text para indicar el promedio exacto
            let avgDisplay = document.getElementById('avg-calculated');
            if (!avgDisplay) {
                avgDisplay = document.createElement('div');
                avgDisplay.id = 'avg-calculated';
                avgDisplay.style.fontSize = '0.9rem';
                avgDisplay.style.color = '#555';
                avgDisplay.style.marginTop = '0.5rem';
                avgDisplay.style.fontWeight = 'bold';
                displayProxima.parentNode.appendChild(avgDisplay);
            }
            avgDisplay.textContent = `(Basado en un promedio acumulado de ${averageDuration} días)`;

            const fechaOvulacion = new Date(proximaFecha);
            fechaOvulacion.setDate(proximaFecha.getDate() - 14);

            const inicioFertil = new Date(fechaOvulacion);
            inicioFertil.setDate(fechaOvulacion.getDate() - 5);

            const finFertil = new Date(fechaOvulacion);
            finFertil.setDate(fechaOvulacion.getDate() + 1);

            const formatoCorto = { day: 'numeric', month: 'short' };
            displayFertil.textContent = `${inicioFertil.toLocaleDateString('es-ES', formatoCorto)} - ${finFertil.toLocaleDateString('es-ES', formatoCorto)}`;

            // Guardar automáticamente el ciclo en el perfil del usuario (sobreescribiendo o agregando el último con el nuevo promedio)
            if (AuthService.getCurrentUser()) {
                AuraStore.dispatch('saveCycle', {
                    id: Date.now(),
                    startDate: latestDate,
                    endDate: proximaFecha,
                    averageDuration: averageDuration,
                    periodDuration: 5 // Valor por defecto
                });
                console.log(`Predicción exacta calculada. Promedio: ${averageDuration} días. Guardado vía AuraStore.`);
            }
        });
    }
});