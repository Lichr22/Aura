/**
 * summary.js — Resumen del ciclo (AURA-36 / AURA-20)
 * Ruta destino: pages/summary/summary.js
 *
 * FIX #3: se implementa suscripción a 'phaseChanged' con banner inline.
 *         renderSummary, renderAnalysis y renderUnifiedHistory extraídas
 *         a funciones para re-ejecutarse reactivamente.
 * Sin cambios al HTML de summary.html (sidebar no duplicado aquí).
 */

// ── Importaciones del equipo (sin modificar) ─────────────────────────────────
import { AuthService }    from '../../src/services/AuthService.js';
import { CycleAnalysis }  from '../../src/analysis/CycleAnalysis.js';
import { HealthAnalysis } from '../../src/analysis/HealthAnalysis.js';

// ── Estado global reactivo ────────────────────────────────────────────────────
import { AuraStore } from '../../src/services/AuraStore.js';

document.addEventListener('DOMContentLoaded', () => {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // ── Render inicial ─────────────────────────────────────────────────────────
  _renderSummary(AuraStore.getState());
  _renderAnalysis(user);
  _renderUnifiedHistory(user);

  // ── FIX #3: Suscripción a cambio de fase ──────────────────────────────────
  AuraStore.subscribe('phaseChanged', (phaseInfo) => {
    _showPhaseChangeBannerInSummary(phaseInfo);
  });

  // ── Suscripción reactiva general ──────────────────────────────────────────
  AuraStore.subscribe('stateChanged', (state) => {
    _renderSummary(state);
    if (state.user) {
      _renderAnalysis(state.user);
      _renderUnifiedHistory(state.user);
    }
  });

  // ── Emociones: interacción local (sin cambios) ────────────────────────────
  document.querySelectorAll('.emotion-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.emotion-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Resumen visual del ciclo (anillo + fase)
// ─────────────────────────────────────────────────────────────────────────────
function _renderSummary(state) {
  const { latestCycle, currentPhase } = state;

  const dayElement  = document.getElementById('summary-cycle-day');
  const ringElement = document.querySelector('.progress-ring-summary');

  let currentDay     = 12;
  let totalCycleDays = 28;

  if (latestCycle) {
    totalCycleDays = latestCycle.averageDuration || 28;
    const hoy   = new Date();
    const start = new Date(latestCycle.startDate);
    if (hoy >= start) {
      currentDay = Math.floor((hoy - start) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  if (dayElement) dayElement.textContent = currentDay;

  if (ringElement && currentPhase) {
    const perimeter  = 502;
    const pct        = Math.min((currentDay / totalCycleDays) * 100, 100);
    ringElement.style.stroke = currentPhase.color;
    setTimeout(() => {
      ringElement.style.strokeDashoffset = perimeter - (perimeter * pct) / 100;
    }, 300);
  }

  if (currentPhase) {
    _setText('phase-name',    currentPhase.name);
    _setText('phase-desc',    currentPhase.longDesc || currentPhase.desc);
    _setText('exercise-desc', currentPhase.exercise || 'Mantén un ritmo suave hoy.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Análisis polimórfico (código del equipo — sin modificar lógica)
// ─────────────────────────────────────────────────────────────────────────────
function _renderAnalysis(user) {
  const container = document.getElementById('analysis-container');
  if (!container) return;

  const lastCycle   = user.getLatestCycle();
  const avgSeverity = user.symptomsLogs.length > 0 ? 3 : 1;

  const analyses = [
    new CycleAnalysis(user.id, lastCycle ? lastCycle.averageDuration : 28),
    new HealthAnalysis(user.id, avgSeverity),
  ];

  const colors = {
    success: { bg: '#ECFDF5', text: '#065F46', border: '#10B981' },
    warning: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' },
    danger : { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444' },
  };

  container.innerHTML = '';
  analyses.forEach(analysis => {
    const result = analysis.getRecommendation();
    const theme  = colors[result.status] || colors.success;
    const card   = document.createElement('div');
    card.className = 'card';
    card.style.cssText = `padding:1.5rem;border-left:5px solid ${theme.border};background:${theme.bg};`;
    card.innerHTML = `
      <h4 style="margin:0 0 .5rem;color:${theme.text};font-weight:800;">${result.title}</h4>
      <p style="margin:0;font-size:.9rem;color:#444;line-height:1.4;">${result.desc}</p>
      <small style="display:block;margin-top:1rem;opacity:.6;font-weight:bold;">
        Análisis del ${analysis.getFormattedDate()}
      </small>
    `;
    container.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Historial unificado (polimorfismo del equipo — solo extraído a función)
// ─────────────────────────────────────────────────────────────────────────────
function _renderUnifiedHistory(user) {
  const container = document.getElementById('unified-history-list');
  if (!container) return;

  const allRecords = [
    ...user.cycles,
    ...user.symptomsLogs,
    ...user.flowLogs,
    ...user.sexualActivities,
  ].sort((a, b) => new Date(b.date || b.startDate) - new Date(a.date || a.startDate));

  if (!allRecords.length) {
    container.innerHTML = '<p style="opacity:.6;padding:1rem;">No hay registros aún. ¡Empieza a trackear tu ciclo!</p>';
    return;
  }

  const icons    = { Cycle: '🌸', SymptomLog: '📝', FlowLog: '🩸', SexualActivity: '❤️' };
  const typeNames = { Cycle: 'Ciclo', SymptomLog: 'Síntoma', FlowLog: 'Flujo', SexualActivity: 'Actividad' };

  container.innerHTML = '';
  allRecords.slice(0, 15).forEach(record => {
    const icon     = icons[record.constructor.name]     || '📌';
    const typeName = typeNames[record.constructor.name]  || 'Registro';
    const item     = document.createElement('div');
    item.className = 'history-item';
    item.style.cssText = 'background:white;padding:1rem;border-radius:12px;margin-bottom:.8rem;box-shadow:0 2px 10px rgba(0,0,0,.05);display:flex;justify-content:space-between;align-items:center;';
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;">
        <span style="font-size:1.5rem;">${icon}</span>
        <div>
          <p style="margin:0;font-weight:600;color:#333;">${record.getSummary()}</p>
          <small style="opacity:.6;">${record.getFormattedDate()}</small>
        </div>
      </div>
      <span style="font-size:.75rem;background:#fce7f3;color:#83133F;
        padding:.3rem .8rem;border-radius:20px;font-weight:bold;text-transform:uppercase;">
        ${typeName}
      </span>
    `;
    container.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX #3: Banner de cambio de fase dentro de summary.html
// ─────────────────────────────────────────────────────────────────────────────
function _showPhaseChangeBannerInSummary({ fromPhase, toPhase, toPhaseColor, daysDiff }) {
  // Escribe directamente en el div fijo del HTML — sin mover DOM
  const container = document.getElementById('phase-change-banner');
  if (!container) return;

  container.style.cssText = `
    background:#fff;border-left:5px solid ${toPhaseColor};
    box-shadow:0 4px 20px rgba(131,19,63,.12);
    padding:1rem 1.5rem;border-radius:14px;
    margin-bottom:1.5rem;font-family:'Nunito',sans-serif;
  `;
  container.innerHTML = `
    <p style="margin:0;font-size:.75rem;opacity:.6;text-transform:uppercase;font-weight:700;">
      Cambio de fase detectado
    </p>
    <p style="margin:.3rem 0 0;font-size:1rem;font-weight:800;color:#83133F;">
      ${fromPhase} → <span style="color:${toPhaseColor}">${toPhase}</span>
    </p>
    <p style="margin:.2rem 0 0;font-size:.85rem;color:#555;">
      Han pasado ${daysDiff} día${daysDiff !== 1 ? 's' : ''} desde tu registro anterior.
    </p>
  `;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}