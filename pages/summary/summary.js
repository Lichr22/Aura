import { User } from '../../models/User.js';
import { CycleAnalysis } from '../../models/CycleAnalysis.js';
import { HealthAnalysis } from '../../models/HealthAnalysis.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = User.getCurrentUser();
    if (!user) return;

    // 1. Lógica del Ciclo (Resumen visual)
    const dayElement = document.getElementById('summary-cycle-day');
    const ringElement = document.querySelector('.progress-ring-summary');
    const latestCycle = user.getLatestCycle();
    
    let currentDay = 12; // Valor por defecto
    let totalCycleDays = 28;

    if (latestCycle) {
        totalCycleDays = latestCycle.averageDuration || 28;
        const hoy = new Date();
        const start = new Date(latestCycle.startDate);
        if (hoy >= start) {
            const diffTime = Math.abs(hoy - start);
            currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }

    if (dayElement && ringElement) {
        dayElement.textContent = currentDay;
        const progressPercent = Math.min((currentDay / totalCycleDays) * 100, 100);
        const perimeter = 502; 
        
        // Actualizar Fase Dinámicamente
        if (latestCycle) {
            const phase = latestCycle.getPhaseDetails();
            const phaseNameEl = document.getElementById('phase-name');
            const phaseDescEl = document.getElementById('phase-desc');
            const exerciseDescEl = document.getElementById('exercise-desc');
            
            if (phaseNameEl) phaseNameEl.textContent = phase.name;
            if (phaseDescEl) phaseDescEl.textContent = phase.longDesc || phase.desc;
            if (exerciseDescEl) exerciseDescEl.textContent = phase.exercise || 'Mantén un ritmo suave hoy.';
            
            if (ringElement) ringElement.style.stroke = phase.color;
        }

        setTimeout(() => {
            const finalOffset = perimeter - (perimeter * progressPercent) / 100;
            ringElement.style.strokeDashoffset = finalOffset;
        }, 300);
    }

    // 2. Generar Reporte de Análisis (POLIMORFISMO en acción)
    const analysisContainer = document.getElementById('analysis-container');
    if (analysisContainer) {
        // Creamos una lista de objetos de diferentes clases (pero con la misma base)
        const analyses = [];
        
        // Análisis de Ciclo
        const lastCycle = user.getLatestCycle();
        analyses.push(new CycleAnalysis(user.id, lastCycle ? lastCycle.averageDuration : 28));
        
        // Análisis de Salud (basado en el promedio de severidad de los logs)
        const avgSeverity = user.symptomsLogs.length > 0 ? 3 : 1; // Simplificación para demo
        analyses.push(new HealthAnalysis(user.id, avgSeverity));

        analysisContainer.innerHTML = '';
        
        // Llamada Polimórfica: Recorremos la lista y llamamos al mismo método
        analyses.forEach(analysis => {
            const result = analysis.getRecommendation(); // Polimorfismo puro
            const card = document.createElement('div');
            
            // Estilos basados en el status del análisis
            const colors = {
                success: { bg: '#ECFDF5', text: '#065F46', border: '#10B981' },
                warning: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' },
                danger: { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444' }
            };
            const theme = colors[result.status] || colors.success;

            card.className = 'card';
            card.style.cssText = `padding: 1.5rem; border-left: 5px solid ${theme.border}; background: ${theme.bg};`;
            card.innerHTML = `
                <h4 style="margin: 0 0 0.5rem 0; color: ${theme.text}; font-weight: 800;">${result.title}</h4>
                <p style="margin: 0; font-size: 0.9rem; color: #444; line-height: 1.4;">${result.desc}</p>
                <small style="display: block; margin-top: 1rem; opacity: 0.6; font-weight: bold;">Análisis del ${analysis.getFormattedDate()}</small>
            `;
            analysisContainer.appendChild(card);
        });
    }

    // 2. Cargar Historial Unificado (Demostración de Polimorfismo y Listas)
    const historyContainer = document.getElementById('unified-history-list');
    if (historyContainer) {
        // Combinamos TODOS los tipos de registros en una sola lista (Demostración de Polimorfismo)
        const allRecords = [
            ...user.cycles, 
            ...user.symptomsLogs, 
            ...user.flowLogs, 
            ...user.sexualActivities
        ];
        
        // Ordenar por fecha descendente
        allRecords.sort((a, b) => new Date(b.date || b.startDate) - new Date(a.date || a.startDate));

        if (allRecords.length === 0) {
            historyContainer.innerHTML = '<p style="opacity: 0.6; padding: 1rem;">No hay registros aún. ¡Empieza a trackear tu ciclo!</p>';
        } else {
            historyContainer.innerHTML = '';
            allRecords.slice(0, 15).forEach(record => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.style.cssText = 'background: white; padding: 1rem; border-radius: 12px; margin-bottom: 0.8rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;';
                
                // Llamada Polimórfica: getSummary() funciona para cualquier clase que herede de BaseRecord
                const summaryText = record.getSummary();
                
                // Mapeo de iconos por clase
                const icons = {
                    'Cycle': '🌸',
                    'SymptomLog': '📝',
                    'FlowLog': '🩸',
                    'SexualActivity': '❤️'
                };
                const icon = icons[record.constructor.name] || '📌';
                const typeName = {
                    'Cycle': 'Ciclo',
                    'SymptomLog': 'Síntoma',
                    'FlowLog': 'Flujo',
                    'SexualActivity': 'Actividad'
                }[record.constructor.name] || 'Registro';
                
                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 1.5rem;">${icon}</span>
                        <div>
                            <p style="margin: 0; font-weight: 600; color: #333;">${summaryText}</p>
                            <small style="opacity: 0.6;">${record.getFormattedDate()}</small>
                        </div>
                    </div>
                    <span style="font-size: 0.75rem; background: #fce7f3; color: #83133F; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: bold; text-transform: uppercase;">
                        ${typeName}
                    </span>
                `;
                historyContainer.appendChild(item);
            });
        }
    }

    // 3. Selección de Emociones (Interacción local)
    const emotionCards = document.querySelectorAll('.emotion-card');
    emotionCards.forEach(card => {
        card.addEventListener('click', () => {
            emotionCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
});
