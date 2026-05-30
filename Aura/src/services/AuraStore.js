/**
 * AuraStore.js — Estado global reactivo (Vanilla JS pub/sub)
 * Se conecta a AuthService + UserRepository existentes.
 * No modifica modelos del equipo; solo orquesta y notifica.
 *
 * Uso:
 *   import { AuraStore } from '../../src/services/AuraStore.js';
 *   AuraStore.subscribe('symptomsUpdated', handler);
 *   AuraStore.dispatch('saveSymptomLog', payload);
 */

import { AuthService }    from './AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { Cycle }          from '../models/Cycle.js';

// ─────────────────────────────────────────────
// Tabla de suscriptores  { event → [callbacks] }
// ─────────────────────────────────────────────
const _listeners = {};

// Estado en memoria — recargado desde localStorage al iniciar
let _state = {
  user: null,
  currentPhase: null,
  latestCycle: null,
  symptomsLogs: [],
  phaseChangeDetected: false,
};

// ─────────────────────────────────────────────
// Utilidades internas
// ─────────────────────────────────────────────

/** Emite un evento con datos opcionales */
function _emit(event, data) {
  (_listeners[event] || []).forEach(fn => {
    try { fn(data); } catch (e) { console.error('[AuraStore]', e); }
  });
}

/** Recarga el usuario desde persistencia y refresca el estado derivado */
function _syncFromStorage() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const latestCycle = user.getLatestCycle();

  _state = {
    user,
    latestCycle,
    symptomsLogs: [...(user.symptomsLogs || [])],
    currentPhase: latestCycle ? latestCycle.getPhaseDetails() : null,
    phaseChangeDetected: false,
  };
}

// ─────────────────────────────────────────────
// Lógica de predicción de cambio de fase (AURA-36)
// ─────────────────────────────────────────────

/**
 * Evalúa si los días entre el primer síntoma registrado y la fecha actual
 * implican un cambio de fase menstrual.
 *
 * Usa las propiedades del modelo Cycle (startDate, periodDuration, averageDuration)
 * para comparar la fase en la fecha del primer síntoma vs. la fecha actual.
 *
 * @param {Cycle}  cycle          Instancia Cycle del equipo de backend
 * @param {Date}   firstLogDate   Fecha del primer SymptomLog registrado
 * @param {Date}   [now=new Date()]
 * @returns {{ changed: boolean, fromPhase: string, toPhase: string, daysDiff: number }}
 */
export function detectPhaseChange(cycle, firstLogDate, now = new Date()) {
  if (!cycle || !firstLogDate) {
    return { changed: false, fromPhase: null, toPhase: null, daysDiff: 0 };
  }

  const msPerDay   = 1000 * 60 * 60 * 24;
  const daysDiff   = Math.floor((now - new Date(firstLogDate)) / msPerDay);

  const phaseAtFirst = cycle.getPhaseDetails(new Date(firstLogDate));
  const phaseAtNow   = cycle.getPhaseDetails(now);

  const changed = phaseAtFirst.name !== phaseAtNow.name;

  return {
    changed,
    fromPhase : phaseAtFirst.name,
    toPhase   : phaseAtNow.name,
    toPhaseColor: phaseAtNow.color,
    daysDiff,
  };
}

// ─────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────

export const AuraStore = {

  /** Devuelve una copia del estado actual */
  getState() {
    return { ..._state };
  },

  /**
   * Suscribe un callback a un evento.
   * Eventos disponibles:
   *   'stateChanged'      — cualquier cambio de estado
   *   'symptomsUpdated'   — nuevo SymptomLog guardado
   *   'phaseChanged'      — cambio de fase detectado al guardar síntoma
   *   'cycleUpdated'      — nuevo ciclo registrado
   */
  subscribe(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);

    // Limpieza: devuelve función unsubscribe
    return () => {
      _listeners[event] = _listeners[event].filter(fn => fn !== callback);
    };
  },

  /**
   * Centraliza todas las mutaciones de estado.
   *
   * Acciones:
   *   'saveSymptomLog'  { id, date, emotions, symptoms, flowIntensity, notes }
   *   'saveCycle'       { id, startDate, endDate, averageDuration, periodDuration }
   *   'syncUser'        — recarga user desde storage sin mutación
   */
  dispatch(action, payload) {
    const user = AuthService.getCurrentUser();
    if (!user && action !== 'syncUser') return;

    switch (action) {

      case 'saveSymptomLog': {
        const newLog = user.addSymptomLog(payload);
        UserRepository.save(user);

        // ── Detectar cambio de fase ──────────────────────────
        const cycle = user.getLatestCycle();
        let phaseInfo = null;

        if (cycle && user.symptomsLogs.length > 1) {
          // Primer registro del historial (el más antiguo)
          const sorted   = [...user.symptomsLogs].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          const firstLog = sorted[0];
          phaseInfo = detectPhaseChange(cycle, firstLog.date, new Date(payload.date));

          if (phaseInfo.changed) {
            _state.phaseChangeDetected = true;
            _emit('phaseChanged', phaseInfo);
          }
        }

        _syncFromStorage();
        _emit('symptomsUpdated', { log: newLog, phaseInfo });
        _emit('stateChanged', _state);
        break;
      }

      case 'saveCycle': {
        user.addCycle(payload);
        UserRepository.save(user);
        _syncFromStorage();
        _emit('cycleUpdated', _state.latestCycle);
        _emit('stateChanged', _state);
        break;
      }

      case 'syncUser': {
        _syncFromStorage();
        _emit('stateChanged', _state);
        break;
      }

      case 'updateUser': {
        const userToSave = payload || user;
        UserRepository.save(userToSave);
        _syncFromStorage();
        _emit('stateChanged', _state);
        break;
      }

      case 'deleteUser': {
        const userId = payload || user.id;
        UserRepository.delete(userId);
        AuthService.logout();
        _syncFromStorage();
        _emit('userDeleted', userId);
        _emit('stateChanged', _state);
        break;
      }
    }
  },

  /** Inicializa la tienda al cargar la app */
  init() {
    _syncFromStorage();

    // Re-sincronizar cuando otra pestaña o página modifica localStorage
    window.addEventListener('storage', (e) => {
      if (e.key && (e.key.startsWith('user_') || e.key === 'currentUser')) {
        _syncFromStorage();
        _emit('stateChanged', _state);
      }
    });

    // BroadcastChannel para sincronización entre pestañas del mismo origen
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('aura_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'dataUpdated') {
          _syncFromStorage();
          _emit('stateChanged', _state);
        }
      };
      // Guardamos referencia para que otros módulos puedan broadcast
      AuraStore._channel = channel;
    }
  },

  /** Notifica a otras pestañas que el estado cambió */
  broadcastUpdate() {
    AuraStore._channel?.postMessage({ type: 'dataUpdated' });
  },

  _channel: null,
};

// Auto-inicialización al importar
AuraStore.init();
