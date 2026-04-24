/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
import { User } from '../../models/User.js';
import { Cycle } from '../../models/Cycle.js';

let userName = 'Usuario';
let cycleDay = 12;
let conversationHistory = [];
 
function getPhase(day) {
    // Nota: Aquí el asistente usa una lógica simplificada para el día, 
    // pero idealmente deberíamos usar el objeto cycle si está disponible.
    // Para mantener compatibilidad con el resto del script, retornamos algo similar.
    if (day <= 5) return Cycle.PHASES.MENSTRUATION;
    if (day <= 13) return Cycle.PHASES.FOLLICULAR;
    if (day <= 16) return Cycle.PHASES.OVULATION;
    return Cycle.PHASES.LUTEAL;
}
 
/* ═══════════════════════════════════════
   INIT Y AUTENTICACIÓN
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const sesion = User.getCurrentUser();
    if (!sesion) return;
    
    userName = sesion.name || 'Usuario';
    cycleDay = 1; // Default
    
    // Extraer ciclo real matemáticamente
    const latestCycle = sesion.getLatestCycle();
    if (latestCycle && latestCycle.startDate) {
        const hoy = new Date();
        if (hoy >= latestCycle.startDate) {
            const diffTime = Math.abs(hoy - latestCycle.startDate);
            cycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }
    
    initApp();
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function initApp() {
  const phase = getPhase(cycleDay);
  const first = userName.split(' ')[0];
 
  // topbar
  if (document.getElementById('topUserName')) document.getElementById('topUserName').textContent = first;
  if (document.getElementById('topAvatar')) document.getElementById('topAvatar').textContent = first[0].toUpperCase();
 
  // dashboard
  document.getElementById('dashName').textContent       = first;
  document.getElementById('dashPhase').textContent      = phase.name;
  document.getElementById('dashPhaseName').textContent  = phase.name;
  document.getElementById('dashDay').textContent        = cycleDay;
  document.getElementById('dashDayInline').textContent  = cycleDay;
  document.getElementById('dashPhaseDesc').textContent  = phase.desc;
 
  // cycle arc
  const arc = document.getElementById('cycleArc');
  const circumference = 2 * Math.PI * 26; // ~163.4
  const progress = cycleDay / 28;
  arc.setAttribute('stroke-dashoffset', circumference * (1 - progress));
  arc.setAttribute('stroke', phase.color);
 
  // next period
  const daysLeft = 28 - cycleDay;
  document.getElementById('nextPeriod').textContent = `~${daysLeft}d`;
 
  // charts
  buildBarChart();
  buildSymptomChart();
 
  // welcome message
  const welcomeMsg = `¡Hola ${first}! 💕 Soy Aurora, tu asistente de bienestar de AURA. Hoy es tu día **${cycleDay}** del ciclo — estás en tu **${phase.name}** (${phase.desc}).\n\n¿En qué puedo ayudarte hoy? Puedo darte consejos personalizados sobre nutrición, ejercicio, manejo de síntomas, o simplemente escucharte 🌸`;
  addMessage('ai', welcomeMsg);
}
 
/* ═══════════════════════════════════════
   CHARTS
═══════════════════════════════════════ */
function buildBarChart() {
  const months = ['Nov','Dic','Ene','Feb','Mar','Abr'];
  const days   = [27, 29, 28, 30, 27, cycleDay];
  const max    = Math.max(...days);
  const container = document.getElementById('barChart');
  container.innerHTML = '';
  months.forEach((m,i) => {
    const pct = (days[i] / max) * 100;
    container.innerHTML += `
      <div class="bar-col">
        <div class="bar" style="height:${pct}%;"></div>
        <div class="bar-label">${m}</div>
      </div>`;
  });
}
 
function buildSymptomChart() {
  const items = ['Fatiga','Cólicos','Hinchaz.','Humor','Antojos'];
  const vals  = [8, 5, 6, 7, 4];
  const max   = Math.max(...vals);
  const container = document.getElementById('symptomChart');
  container.innerHTML = '';
  items.forEach((s,i) => {
    const pct = (vals[i] / max) * 100;
    container.innerHTML += `
      <div class="bar-col">
        <div class="bar" style="height:${pct}%; background: linear-gradient(to top, #AD1457, #F48FB1);"></div>
        <div class="bar-label">${s}</div>
      </div>`;
  });
}
 
/* ═══════════════════════════════════════
   UI INTERACTIONS
═══════════════════════════════════════ */
function setMood(el, emoji) {
  document.querySelectorAll('.mood-dot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
}
function toggleTag(el) { el.classList.toggle('active'); }
function setFlow(el) {
  document.querySelectorAll('.flow-dot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
}
 
/* ═══════════════════════════════════════
   CHAT HELPERS
═══════════════════════════════════════ */
function now() {
  return new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
}
 
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
 
function addMessage(role, text) {
  const wrap = document.getElementById('chatMessages');
  const row  = document.createElement('div');
  row.className = `msg-row ${role}`;
 
  if (role === 'ai') {
    row.innerHTML = `
      <div class="ai-label">Aurora 🌸</div>
      <div class="msg-bubble">${formatMarkdown(text)}</div>
      <div class="msg-time">${now()}</div>`;
  } else {
    row.innerHTML = `
      <div class="msg-bubble">${formatMarkdown(text)}</div>
      <div class="msg-time">${now()} ✓✓</div>`;
  }
  wrap.appendChild(row);
  wrap.scrollTop = wrap.scrollHeight;
}
 
function setTyping(show) {
  document.getElementById('typingIndicator').classList.toggle('visible', show);
  const wrap = document.getElementById('chatMessages');
  wrap.scrollTop = wrap.scrollHeight;
}
 
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}
 
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
 
/* ═══════════════════════════════════════
   SEND MESSAGE → ANTHROPIC API
═══════════════════════════════════════ */
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;
 
  input.value = '';
  input.style.height = 'auto';
  addMessage('user', text);
 
  conversationHistory.push({ role: 'user', content: text });
  setTyping(true);
 
  const phase = getPhase(cycleDay);
  const activeMood = document.querySelector('.mood-dot.active')?.title || 'desconocido';
  const activeSymptoms = [...document.querySelectorAll('#symptomTags .tag.active')].map(t => t.textContent).join(', ') || 'ninguno';
  const activeFlow = document.querySelector('.flow-dot.active')?.closest('.flow-item')?.querySelector('.flow-label')?.textContent || 'desconocida';
 
  const systemPrompt = `Eres Aurora, la asistente de bienestar femenino de la app AURA. Eres cálida, empática, experta en salud menstrual y bienestar femenino.
 
DATOS ACTUALES DE LA USUARIA:
- Nombre: ${userName}
- Día del ciclo: ${cycleDay}
- Fase actual: ${phase.name} — ${phase.desc}
- Estado emocional hoy: ${activeMood}
- Síntomas registrados: ${activeSymptoms}
- Intensidad del flujo: ${activeFlow}
 
INSTRUCCIONES:
- Siempre personaliza tus respuestas mencionando la fase del ciclo cuando sea relevante.
- Da consejos prácticos, tips de nutrición, ejercicio, autocuidado y manejo emocional adaptados a la fase.
- Usa un tono amigable, cercano, usa emojis con moderación.
- Responde en español colombiano.
- Máximo 200 palabras por respuesta, sé concisa y útil.
- Si la usuaria menciona síntomas graves, recomienda consultar a un médico.`;
 
  // Bloque demo: Simular respuesta localmente ya que no hay una API Key real conectada.
  // Si tuvieras una llave de Anthropic real, reactivaríamos el fetch() aquí.
  setTimeout(() => {
    setTyping(false);
    
    // Armamos la respuesta personalizada analizando tu estado dinámicamente
    const respuestaMuestra = `¡Hola! Aquí estoy para ayudarte a sentirte mejor 🌸.\n\nHe estado prestando atención a tu actividad de hoy; me he dado cuenta de que estás en tu fase **${phase.name}**, tu ánimo principal es **${activeMood}** y nos reportaste síntomas como: **${activeSymptoms}**.\n\nTodo esto es completamente normal durante tu tránsito biológico. Mi consejo principal para hoy es mantenerte muy hidratada y dedicar unos minutos al final de tu jornada para algo que verdaderamente te relaje y te consienta. ¡Tu cuerpo te lo agradecerá! ✨`;
    
    conversationHistory.push({ role: 'assistant', content: respuestaMuestra });
    addMessage('ai', respuestaMuestra);
  }, 1800);
}
 
function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

/* ═══════════════════════════════════════
   MODULE EXPORTS (Para que funcionen los onclicks HTML)
═══════════════════════════════════════ */
window.setMood = setMood;
window.toggleTag = toggleTag;
window.setFlow = setFlow;
window.sendMessage = sendMessage;
window.sendSuggestion = sendSuggestion;
window.handleKey = handleKey;
window.autoResize = autoResize;
