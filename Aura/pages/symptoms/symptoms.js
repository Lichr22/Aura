/**
 * symptoms.js — Registro de síntomas mejorado
 * Ruta: pages/symptoms/symptoms.js
 *
 * Mejoras implementadas (totalmente compatibles con AuraStore, FlowLog, SexualActivity):
 *   #1 – Pregunta de actividad sexual: oculta/muestra los campos de detalle
 *   #2 – Estado menstrual con flujo vaginal alternativo (usando FlowLog ampliado)
 *   #3 – UX moderna con animaciones CSS
 *   #4 – Síntomas agrupados visualmente (en HTML)
 *   #5 – Tarjeta resumen dinámica antes de guardar
 *
 * Compatibilidad garantizada:
 *   - AuraStore.dispatch('saveSymptomLog', ...) — sin cambios
 *   - FlowLog: usa los nuevos campos `odor` y `logType` del modelo actualizado
 *   - SexualActivity: solo se crea si el usuario responde "Sí"
 *   - summary.js / SymptomChart.js: no se tocan; consumen los mismos arrays de usuario
 */

import { AuthService }    from '../../src/services/AuthService.js';
import { FlowLog }        from '../../src/models/FlowLog.js';
import { SexualActivity } from '../../src/models/SexualActivity.js';
import { AuraStore }      from '../../src/services/AuraStore.js';

document.addEventListener('DOMContentLoaded', () => {

    // ── Referencias DOM ──────────────────────────────────────────
    const pills          = document.querySelectorAll('.pill');
    const intensityBtns  = document.querySelectorAll('.circle-btn');
    const btnGuardar     = document.getElementById('btn-guardar');
    const summaryPreview = document.getElementById('summary-preview');

    const blockMenstrual = document.getElementById('block-menstrual');
    const blockVaginal   = document.getElementById('block-vaginal');
    const blockSexual    = document.getElementById('block-sexual');

    // ── Estado local reactivo ────────────────────────────────────
    // Centraliza las respuestas del usuario sin duplicar lógica en el DOM.
    const st = {
        intensidad       : null,  // '1'–'5'
        isMenstruating   : null,  // 'yes' | 'no'
        hasSexualActivity: null,  // 'yes' | 'no'
    };

    // ── Fase actual en el header ─────────────────────────────────
    _renderPhaseBadge(AuraStore.getState());
    AuraStore.subscribe('phaseChanged', (phaseInfo) => {
        _showPhaseChangeBanner(phaseInfo);
        _renderPhaseBadge(AuraStore.getState());
    });

    // ════════════════════════════════════════════════════════════
    // SELECCIÓN DE SÍNTOMAS — toggle + resumen en tiempo real
    // ════════════════════════════════════════════════════════════
    pills.forEach(pill =>
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
            _updateSummary();
        })
    );

    // ════════════════════════════════════════════════════════════
    // INTENSIDAD
    // ════════════════════════════════════════════════════════════
    intensityBtns.forEach(btn =>
        btn.addEventListener('click', () => {
            intensityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            st.intensidad = btn.getAttribute('data-value');
            _updateSummary();
        })
    );

    // ════════════════════════════════════════════════════════════
    // BOTONES BINARIOS (Sí / No) — delegan en _toggleBlock
    // ════════════════════════════════════════════════════════════
    document.querySelectorAll('.binary-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.getAttribute('data-group');
            const value = btn.getAttribute('data-value');

            // Marcar solo el botón pulsado dentro del grupo
            document.querySelectorAll(`.binary-btn[data-group="${group}"]`)
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (group === 'menstruating') {
                st.isMenstruating = value;
                _toggleBlock(blockMenstrual, value === 'yes');
                _toggleBlock(blockVaginal,   value === 'no');
            }

            if (group === 'sexual') {
                st.hasSexualActivity = value;
                _toggleBlock(blockSexual, value === 'yes');
            }

            _updateSummary();
        });
    });

    // Actualizar resumen cuando cambian selects o checkboxes
    document.querySelectorAll('.styled-select').forEach(sel =>
        sel.addEventListener('change', _updateSummary)
    );
    document.querySelectorAll('input[type="checkbox"]').forEach(cb =>
        cb.addEventListener('change', _updateSummary)
    );

    // ════════════════════════════════════════════════════════════
    // GUARDAR REGISTRO
    // ════════════════════════════════════════════════════════════
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            const activas = document.querySelectorAll('.pill.active');

            if (activas.length === 0 || !st.intensidad) {
                _showToast('Selecciona al menos un síntoma y su intensidad.', 'warn');
                return;
            }

            const arraySintomas = Array.from(activas)
                .map(p => p.getAttribute('data-symptom') || p.textContent.trim());

            const now = new Date();

            // ── saveSymptomLog — sin cambios respecto al original ──
            AuraStore.dispatch('saveSymptomLog', {
                id           : Date.now(),
                date         : now,
                emotions     : [],
                symptoms     : arraySintomas,
                flowIntensity: st.intensidad,   // string '1'–'5' (compatible con SymptomLog)
                notes        : '',
            });

            // ── FlowLog — usa campos nuevos del modelo actualizado ──
            const user = AuthService.getCurrentUser();
            if (user) {

                if (st.isMenstruating === 'yes') {
                    // Flujo menstrual — lógica original + nuevo campo odor
                    const texture   = document.getElementById('flow-texture')?.value || 'Líquida';
                    const amount    = document.getElementById('flow-amount')?.value  || 'Moderada';
                    const odor      = document.getElementById('flow-odor-menstrual')?.value || 'Sin olor';
                    user.flowLogs.push(
                        new FlowLog(Date.now() + 1, now, texture, 'Rojo', amount, odor, 'menstrual')
                    );

                } else if (st.isMenstruating === 'no') {
                    // Flujo vaginal — nuevos campos propios del logType 'vaginal'
                    const vagColor     = document.getElementById('vag-color')?.value     || 'Transparente';
                    const vagThickness = document.getElementById('vag-thickness')?.value || 'Normal';
                    const vagOdor      = document.getElementById('vag-odor')?.value      || 'Sin olor';
                    user.flowLogs.push(
                        new FlowLog(Date.now() + 1, now, vagThickness, vagColor, 'Normal', vagOdor, 'vaginal')
                    );
                }

                // ── SexualActivity — solo si respondió "Sí" ──────────
                if (st.hasSexualActivity === 'yes') {
                    const hasProtection = document.getElementById('sex-protection')?.checked ?? true;
                    const hasOrgasm     = document.getElementById('sex-orgasm')?.checked     ?? false;
                    user.sexualActivities.push(
                        new SexualActivity(Date.now() + 2, now, hasProtection, hasOrgasm)
                    );
                }

                AuraStore.dispatch('updateUser', user);
            }

            _showToast('¡Registro diario guardado con éxito! 🌸', 'success');
            _resetForm();
        });
    }

    // ════════════════════════════════════════════════════════════
    // RESUMEN DINÁMICO — se actualiza ante cualquier interacción
    // ════════════════════════════════════════════════════════════
    function _updateSummary() {
        const activePills = document.querySelectorAll('.pill.active');
        const hasData = activePills.length > 0
            || st.intensidad
            || st.isMenstruating
            || st.hasSexualActivity;

        summaryPreview.style.display = hasData ? 'block' : 'none';
        if (!hasData) return;

        // — Síntomas —
        const symEl = document.getElementById('sum-symptoms');
        symEl.innerHTML = '';
        if (activePills.length === 0) {
            symEl.innerHTML = '<span class="summary-empty">Ninguno seleccionado</span>';
        } else {
            activePills.forEach(p => {
                const tag = document.createElement('span');
                tag.className = 'summary-pill-tag';
                tag.textContent = p.getAttribute('data-symptom') || p.textContent.trim();
                symEl.appendChild(tag);
            });
        }

        // — Intensidad —
        document.getElementById('sum-intensity').textContent =
            st.intensidad ? `${st.intensidad} / 5` : '—';

        // — Menstruando —
        document.getElementById('sum-menstruating').textContent =
            st.isMenstruating === 'yes' ? 'Sí' :
            st.isMenstruating === 'no'  ? 'No' : '—';

        // — Flujo menstrual —
        const flowRow = document.getElementById('sum-flow-row');
        if (st.isMenstruating === 'yes') {
            flowRow.style.display = 'flex';
            const texture = document.getElementById('flow-texture')?.value || '';
            const amount  = document.getElementById('flow-amount')?.value  || '';
            const odor    = document.getElementById('flow-odor-menstrual')?.value || '';
            document.getElementById('sum-flow').textContent = `${amount} · ${texture} · Olor: ${odor}`;
        } else {
            flowRow.style.display = 'none';
        }

        // — Flujo vaginal —
        const vagRow = document.getElementById('sum-vaginal-row');
        if (st.isMenstruating === 'no') {
            vagRow.style.display = 'flex';
            const color     = document.getElementById('vag-color')?.value     || '';
            const thickness = document.getElementById('vag-thickness')?.value || '';
            const odor      = document.getElementById('vag-odor')?.value      || '';
            document.getElementById('sum-vaginal').textContent =
                `Color: ${color} · Espesor: ${thickness} · Olor: ${odor}`;
        } else {
            vagRow.style.display = 'none';
        }

        // — Actividad sexual —
        document.getElementById('sum-sexual').textContent =
            st.hasSexualActivity === 'yes' ? 'Sí' :
            st.hasSexualActivity === 'no'  ? 'No' : '—';

        // — Detalle actividad sexual —
        const sexDetailRow = document.getElementById('sum-sexual-detail-row');
        if (st.hasSexualActivity === 'yes') {
            sexDetailRow.style.display = 'flex';
            const prot   = document.getElementById('sex-protection')?.checked;
            const orgasm = document.getElementById('sex-orgasm')?.checked;
            const parts  = [prot ? 'Con protección' : 'Sin protección'];
            if (orgasm) parts.push('Con orgasmo');
            document.getElementById('sum-sexual-detail').textContent = parts.join(' · ');
        } else {
            sexDetailRow.style.display = 'none';
        }
    }

    // ════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════

    /** Muestra u oculta un bloque colapsable mediante clase CSS */
    function _toggleBlock(el, show) {
        if (!el) return;
        el.classList.toggle('visible', show);
    }

    /** Limpia el formulario tras guardar */
    function _resetForm() {
        pills.forEach(p => p.classList.remove('active'));
        intensityBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.binary-btn').forEach(b => b.classList.remove('active'));
        _toggleBlock(blockMenstrual, false);
        _toggleBlock(blockVaginal,   false);
        _toggleBlock(blockSexual,    false);

        const sexP = document.getElementById('sex-protection');
        const sexO = document.getElementById('sex-orgasm');
        if (sexP) sexP.checked = true;
        if (sexO) sexO.checked = false;

        st.intensidad        = null;
        st.isMenstruating    = null;
        st.hasSexualActivity = null;

        summaryPreview.style.display = 'none';
    }

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
            <p style="margin:0;font-size:.78rem;opacity:.6;text-transform:uppercase;font-weight:700;">
                Cambio de fase detectado
            </p>
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
            s.textContent = `
                @keyframes aura-slide-down {
                    from { opacity:0; transform:translateX(-50%) translateY(-10px); }
                    to   { opacity:1; transform:translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(s);
        }

        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

});
