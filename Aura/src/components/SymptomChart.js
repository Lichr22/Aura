/**
 * SymptomChart.js — Gráficos responsive + Historial (AURA-36 / AURA-20)
 *
 * Uso — insertar en summary.html o index.html:
 *   <div id="aura-chart-root"></div>
 *   <script type="module" src="SymptomChart.js"></script>
 *
 * Se conecta a AuraStore para actualizarse en tiempo real sin recargar la página.
 * Lee User, SymptomLog y Cycle del equipo de backend sin modificarlos.
 */

import { AuraStore }      from '../../src/services/AuraStore.js';
import { detectPhaseChange } from '../../src/services/AuraStore.js';

// ─────────────────────────────────────────────
// Punto de entrada: monta el componente
// ─────────────────────────────────────────────
const ROOT_ID = 'aura-chart-root';

function mount() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  injectStyles();
  render(root, AuraStore.getState());

  // Sincronización reactiva: re-renderiza ante cualquier cambio de estado
  AuraStore.subscribe('stateChanged', (state) => render(root, state));
}

// ─────────────────────────────────────────────
// Render principal
// ─────────────────────────────────────────────
function render(root, state) {
  const { symptomsLogs, latestCycle, currentPhase } = state;

  root.innerHTML = `
    <section class="ac-section">

      <!-- Tarjeta: Distribución de síntomas (barras) -->
      <div class="ac-card">
        <h3 class="ac-title">Síntomas más frecuentes</h3>
        ${buildBarChart(symptomsLogs)}
      </div>

      <!-- Tarjeta: Intensidad por día (línea SVG) -->
      <div class="ac-card">
        <h3 class="ac-title">Intensidad del ciclo</h3>
        ${buildLineChart(symptomsLogs)}
      </div>

      <!-- Tarjeta: Cambio de fase -->
      <div class="ac-card ac-card--full">
        <h3 class="ac-title">Estado de fase</h3>
        ${buildPhaseTimeline(latestCycle, symptomsLogs, currentPhase)}
      </div>

      <!-- Historial de registros -->
      <div class="ac-card ac-card--full">
        <h3 class="ac-title">Historial de síntomas</h3>
        ${buildHistory(symptomsLogs)}
      </div>

    </section>
  `;
}

// ─────────────────────────────────────────────
// Gráfico 1: Barras de frecuencia de síntomas
// ─────────────────────────────────────────────
function buildBarChart(logs) {
  if (!logs.length) return emptyState('Aún no hay síntomas registrados.');

  // Conteo de frecuencias
  const freq = {};
  logs.forEach(log => {
    (log.symptoms || []).forEach(s => { freq[s] = (freq[s] || 0) + 1; });
  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (!sorted.length) return emptyState('Sin síntomas registrados aún.');

  const max = sorted[0][1];

  const bars = sorted.map(([name, count]) => {
    const pct = Math.round((count / max) * 100);
    return `
      <div class="ac-bar-row">
        <span class="ac-bar-label">${name}</span>
        <div class="ac-bar-track">
          <div class="ac-bar-fill" style="width:${pct}%" data-count="${count}"></div>
        </div>
        <span class="ac-bar-count">${count}</span>
      </div>
    `;
  }).join('');

  return `<div class="ac-bars">${bars}</div>`;
}

// ─────────────────────────────────────────────
// Gráfico 2: Línea SVG de intensidad por día
// ─────────────────────────────────────────────
function buildLineChart(logs) {
  if (logs.length < 2) return emptyState('Necesitas al menos 2 registros para ver la tendencia.');

  const sorted = [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14); // últimas 14 entradas

  const values = sorted.map(l => parseInt(l.flowIntensity) || 1);
  const W = 300, H = 80, PAD = 10;
  const minV = 1, maxV = 5;

  const xStep = (W - PAD * 2) / (values.length - 1);
  const yScale = (v) => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD * 2);

  const points = values.map((v, i) => `${PAD + i * xStep},${yScale(v)}`).join(' ');
  const area   = `${PAD},${H - PAD} ` + points + ` ${PAD + (values.length - 1) * xStep},${H - PAD}`;

  const dots = values.map((v, i) => `
    <circle cx="${PAD + i * xStep}" cy="${yScale(v)}" r="3"
      fill="#83133F" class="ac-dot"
      title="Intensidad ${v}" />
  `).join('');

  // Etiquetas de fecha (cada 3)
  const labels = sorted
    .filter((_, i) => i % 3 === 0 || i === sorted.length - 1)
    .map((l, idx, arr) => {
      const origIdx = sorted.indexOf(l);
      const x = PAD + origIdx * xStep;
      const date = new Date(l.date);
      return `<text x="${x}" y="${H + 2}" font-size="7" fill="#999" text-anchor="middle">
        ${date.getDate()}/${date.getMonth() + 1}
      </text>`;
    }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H + 14}" class="ac-line-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#83133F" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#83133F" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <!-- Líneas guía -->
      ${[1,2,3,4,5].map(v => `
        <line x1="${PAD}" y1="${yScale(v)}" x2="${W - PAD}" y2="${yScale(v)}"
          stroke="#f3e8ee" stroke-width="0.5"/>
      `).join('')}
      <!-- Área -->
      <polygon points="${area}" fill="url(#lineGrad)"/>
      <!-- Línea -->
      <polyline points="${points}" fill="none" stroke="#83133F" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      ${labels}
    </svg>
    <div class="ac-legend">
      <span class="ac-legend-dot"></span> Intensidad registrada (1–5)
    </div>
  `;
}

// ─────────────────────────────────────────────
// Tarjeta 3: Timeline de fases + detección de cambio
// ─────────────────────────────────────────────
function buildPhaseTimeline(cycle, logs, currentPhase) {
  if (!cycle) return emptyState('Registra tu primer ciclo en la sección Predicción.');

  const phases = [
    { key: 'MENSTRUATION', label: 'Menstruación', color: '#C2185B' },
    { key: 'FOLLICULAR',   label: 'Folicular',    color: '#E91E8C' },
    { key: 'OVULATION',    label: 'Ovulación',    color: '#AD1457' },
    { key: 'LUTEAL',       label: 'Lútea',        color: '#880E4F' },
  ];

  // Detectar cambio de fase si hay logs
  let phaseChangeHtml = '';
  if (logs.length >= 2) {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const info = detectPhaseChange(cycle, sortedLogs[0].date, new Date());

    if (info.changed) {
      phaseChangeHtml = `
        <div class="ac-phase-alert">
          <span>🔄</span>
          <span>
            Cambiaste de <strong>${info.fromPhase}</strong> a
            <strong style="color:${info.toPhaseColor}">${info.toPhase}</strong>
            hace ${info.daysDiff} días.
          </span>
        </div>
      `;
    }
  }

  const pills = phases.map(p => {
    const active = currentPhase?.name === p.label;
    return `
      <div class="ac-phase-pill ${active ? 'ac-phase-active' : ''}"
           style="--phase-color:${p.color}">
        ${p.label}
      </div>
    `;
  }).join('');

  const dayInCycle = Math.floor(
    (new Date() - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24)
  ) + 1;

  return `
    ${phaseChangeHtml}
    <div class="ac-phase-row">${pills}</div>
    <p class="ac-phase-meta">Día ${dayInCycle} de ${cycle.averageDuration} · ${currentPhase?.desc || ''}</p>
  `;
}

// ─────────────────────────────────────────────
// Historial de registros
// ─────────────────────────────────────────────
function buildHistory(logs) {
  if (!logs.length) return emptyState('Aún no hay registros de síntomas.');

  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  const items = sorted.map(log => {
    const date    = new Date(log.date);
    const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const syms    = (log.symptoms || []).slice(0, 4).join(', ') || '—';
    const intens  = log.flowIntensity || '—';

    return `
      <div class="ac-history-item">
        <div class="ac-history-date">${dateStr}</div>
        <div class="ac-history-body">
          <p class="ac-history-symptoms">${syms}</p>
          <span class="ac-history-badge">Intensidad ${intens}</span>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="ac-history">${items}</div>`;
}

// ─────────────────────────────────────────────
// Helper: estado vacío
// ─────────────────────────────────────────────
function emptyState(msg) {
  return `<p class="ac-empty">${msg}</p>`;
}

// ─────────────────────────────────────────────
// Estilos encapsulados — se inyectan una sola vez
// ─────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('aura-chart-styles')) return;
  const style = document.createElement('style');
  style.id = 'aura-chart-styles';
  style.textContent = `
    /* ── Layout ───────────────────────────────── */
    .ac-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      padding: 0;
    }
    @media (max-width: 700px) {
      .ac-section { grid-template-columns: 1fr; }
    }

    .ac-card {
      background: #fff;
      border-radius: 18px;
      padding: 1.4rem;
      box-shadow: 0 2px 16px rgba(131,19,63,0.07);
    }
    .ac-card--full { grid-column: 1 / -1; }

    .ac-title {
      font-family: 'Nunito', sans-serif;
      font-size: 0.95rem;
      font-weight: 800;
      color: #83133F;
      margin: 0 0 1rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── Barras ────────────────────────────────── */
    .ac-bars { display: flex; flex-direction: column; gap: 0.55rem; }
    .ac-bar-row {
      display: grid;
      grid-template-columns: 110px 1fr 28px;
      align-items: center;
      gap: 0.5rem;
    }
    @media (max-width: 400px) {
      .ac-bar-row { grid-template-columns: 80px 1fr 24px; }
    }
    .ac-bar-label { font-size: 0.8rem; color: #555; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ac-bar-track { height: 10px; background: #fce7f3; border-radius: 10px; overflow: hidden; }
    .ac-bar-fill  { height: 100%; background: linear-gradient(90deg, #C2185B, #E91E8C); border-radius: 10px; transition: width 0.6s ease; }
    .ac-bar-count { font-size: 0.75rem; color: #83133F; font-weight: 700; text-align: right; }

    /* ── Línea SVG ─────────────────────────────── */
    .ac-line-svg  { width: 100%; max-width: 100%; display: block; overflow: visible; }
    .ac-dot       { cursor: pointer; transition: r 0.2s; }
    .ac-dot:hover { r: 5; }
    .ac-legend    { font-size: 0.75rem; color: #aaa; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.4rem; }
    .ac-legend-dot { width: 10px; height: 10px; border-radius: 50%; background: #83133F; display: inline-block; }

    /* ── Fases ─────────────────────────────────── */
    .ac-phase-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.8rem; }
    .ac-phase-pill {
      padding: 0.35rem 0.9rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      background: var(--phase-color, #fce7f3)18;
      border: 1.5px solid var(--phase-color, #83133F)44;
      color: var(--phase-color, #83133F);
      transition: all 0.2s;
    }
    .ac-phase-active {
      background: var(--phase-color);
      color: #fff;
      box-shadow: 0 4px 12px var(--phase-color, #83133F)44;
    }
    .ac-phase-meta  { font-size: 0.82rem; color: #888; margin: 0; }
    .ac-phase-alert {
      display: flex; align-items: center; gap: 0.6rem;
      background: #fce7f3; border-radius: 10px;
      padding: 0.6rem 1rem; margin-bottom: 0.8rem;
      font-size: 0.82rem; color: #83133F;
    }

    /* ── Historial ─────────────────────────────── */
    .ac-history { display: flex; flex-direction: column; gap: 0.6rem; }
    .ac-history-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem;
      background: #fdf2f8;
      border-radius: 12px;
      transition: background 0.2s;
    }
    .ac-history-item:hover { background: #fce7f3; }
    .ac-history-date {
      min-width: 50px;
      font-size: 0.78rem;
      font-weight: 800;
      color: #83133F;
      text-align: center;
      padding-top: 0.1rem;
    }
    .ac-history-body   { flex: 1; }
    .ac-history-symptoms { margin: 0 0 0.3rem; font-size: 0.88rem; color: #333; font-weight: 600; }
    .ac-history-badge  {
      font-size: 0.72rem; background: #fff;
      border: 1px solid #e5d0dc; color: #83133F;
      padding: 0.15rem 0.6rem; border-radius: 20px; font-weight: 700;
    }

    /* ── Empty ─────────────────────────────────── */
    .ac-empty {
      font-size: 0.88rem; color: #bbb;
      text-align: center; padding: 1.5rem 0;
      font-style: italic;
    }

    /* ── Animación entrada ─────────────────────── */
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ac-card { animation: slideDown 0.35s ease both; }
  `;
  document.head.appendChild(style);
}

// Auto-montar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

