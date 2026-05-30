/**
 * symptoms.js — Registro de síntomas (AURA-36 / AURA-20)
 * Ruta destino: pages/symptoms/symptoms.js
 *
 * Cambios respecto al original:
 * - Usa AuraStore.dispatch en lugar de llamadas directas a UserRepository.
 * - flowIntensity se guarda como string numérico "1"–"5" (data-value del HTML).
 * - FlowLog y SexualActivity persisten igual que antes (sin romper modelos).
 * - alert() reemplazados por toasts no bloqueantes.
 */

// ── Importaciones del equipo (sin modificar) ─────────────────────────────────
import { AuthService }    from '../../src/services/AuthService.js';
import { FlowLog }        from '../../src/models/FlowLog.js';
import { SexualActivity } from '../../src/models/SexualActivity.js';

// ── Estado global reactivo ────────────────────────────────────────────────────
import { AuraStore } from '../../src/services/AuraStore.js';

document.addEventListener('DOMContentLoaded', () => {
  const pills         = document.querySelectorAll('.pill');
  const intensityBtns = document.querySelectorAll('.circle-btn');
  const btnGuardar    = document.querySelector('.btn-primary');

  let intensidadSeleccionada = null;

  // ── Fase actual visible en el header ────────────────────────────────────
  _renderPhaseBadge(AuraStore.getState());

  // Actualiza badge si cambia la fase mientras la usuaria está en la página
  AuraStore.subscribe('phaseChanged', (phaseInfo) => {
    _showPhaseChangeBanner(phaseInfo);
    _renderPhaseBadge(AuraStore.getState());
  });

  // ── Selección de síntomas (toggle) ───────────────────────────────────────
  pills.forEach(pill =>
    pill.addEventListener('click', () => pill.classList.toggle('active'))
  );

  intensityBtns.forEach(btn =>
    btn.addEventListener('click', () => {
      intensityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // data-value es "1"–"5" (string), compatible con SymptomLog.flowIntensity
      intensidadSeleccionada = btn.getAttribute('data-value');
    })
  );

  // ── Guardar ───────────────────────────────────────────────────────────────
  if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
      const activas = document.querySelectorAll('.pill.active');

      if (activas.length === 0 || !intensidadSeleccionada) {
        _showToast('Selecciona al menos un síntoma y su intensidad.', 'warn');
        return;
      }

      const arraySintomas = Array.from(activas).map(p => p.textContent.trim());
      const now           = new Date();

      // Dispatch al store — persiste SymptomLog y detecta cambio de fase
      AuraStore.dispatch('saveSymptomLog', {
        id           : Date.now(),
        date         : now,
        emotions     : [],
        symptoms     : arraySintomas,
        // flowIntensity = string "1"–"5" (como define SymptomLog del equipo)
        flowIntensity: intensidadSeleccionada,
        notes        : '',
      });

      // FlowLog y SexualActivity: guardar igual que el original del equipo
      const user = AuthService.getCurrentUser();
      if (user) {
        const flowTexture   = document.getElementById('flow-texture')?.value  || 'Líquida';
        const flowAmount    = document.getElementById('flow-amount')?.value   || 'Moderada';
        const hasProtection = document.getElementById('sex-protection')?.checked ?? true;
        const hasOrgasm     = document.getElementById('sex-orgasm')?.checked  ?? false;

        user.flowLogs.push(new FlowLog(Date.now() + 1, now, flowTexture, 'Rojo', flowAmount));
        user.sexualActivities.push(new SexualActivity(Date.now() + 2, now, hasProtection, hasOrgasm));
        AuraStore.dispatch('updateUser', user);
      }

      _showToast('¡Registro diario guardado con éxito! 🌸', 'success');

      // Limpiar UI
      pills.forEach(p => p.classList.remove('active'));
      intensityBtns.forEach(b => b.classList.remove('active'));
      intensidadSeleccionada = null;
    });
  }
});

// ── Helpers UI ────────────────────────────────────────────────────────────────

function _renderPhaseBadge(state) {
  const existing = document.getElementById('aura-phase-badge');
  if (existing) existing.remove();
  if (!state.currentPhase) return;

  const { name, color } = state.currentPhase;
  const badge = document.createElement('div');
  badge.id = 'aura-phase-badge';
  badge.style.cssText = `
    display:inline-flex;align-items:center;gap:.5rem;
    background:${color}18;border:1px solid ${color}55;color:${color};
    padding:.4rem 1rem;border-radius:20px;
    font-size:.8rem;font-weight:700;margin-bottom:1rem;
  `;
  badge.textContent = `🌸 ${name}`;
  document.querySelector('.dashboard-header h1')?.insertAdjacentElement('afterend', badge);
}

function _showPhaseChangeBanner({ fromPhase, toPhase, toPhaseColor, daysDiff }) {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed;top:1rem;left:50%;transform:translateX(-50%);
    background:white;border-left:5px solid ${toPhaseColor};
    box-shadow:0 8px 32px rgba(131,19,63,.18);
    padding:1rem 1.5rem;border-radius:14px;z-index:9999;
    font-family:'Nunito',sans-serif;max-width:340px;
    animation:aura-slide-down .4s ease;
  `;
  banner.innerHTML = `
    <p style="margin:0;font-size:.78rem;opacity:.6;text-transform:uppercase;font-weight:700;">Cambio de fase detectado</p>
    <p style="margin:.3rem 0 0;font-size:1rem;font-weight:800;color:#83133F;">
      ${fromPhase} → <span style="color:${toPhaseColor}">${toPhase}</span>
    </p>
    <p style="margin:.2rem 0 0;font-size:.85rem;color:#555;">
      Han pasado ${daysDiff} día${daysDiff !== 1 ? 's' : ''} desde tu registro anterior.
    </p>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 5000);
}

function _showToast(msg, type = 'success') {
  const colors = { success: '#83133F', warn: '#B45309', error: '#991B1B' };
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
    background:${colors[type]};color:white;
    padding:.8rem 1.5rem;border-radius:12px;
    font-family:'Nunito',sans-serif;font-weight:700;
    box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:9999;
    animation:aura-slide-down .3s ease;
  `;
  t.textContent = msg;

  if (!document.getElementById('aura-keyframes')) {
    const s = document.createElement('style');
    s.id = 'aura-keyframes';
    s.textContent = `@keyframes aura-slide-down{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}