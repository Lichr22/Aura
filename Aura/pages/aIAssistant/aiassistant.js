/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
import { AuthService } from '../../src/services/AuthService.js';
import { Cycle } from '../../src/models/Cycle.js';

let userName = 'Usuario';
let cycleDay = 12;
let cycleDuration = 28;
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
    const sesion = AuthService.getCurrentUser();
    if (!sesion) return;
    
    userName = sesion.name || 'Usuario';
    cycleDay = 1; // Default
    
    // Extraer ciclo real matemáticamente
    const latestCycle = sesion.getLatestCycle();
    if (latestCycle) {
        cycleDuration = latestCycle.averageDuration || 28;
        if (latestCycle.startDate) {
            const hoy = new Date();
            if (hoy >= latestCycle.startDate) {
                const diffTime = Math.abs(hoy - latestCycle.startDate);
                cycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
        }
    }
    
    initApp(sesion);
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function initApp(user) {
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
  const progress = cycleDay / cycleDuration;
  arc.setAttribute('stroke-dashoffset', circumference * (1 - progress));
  arc.setAttribute('stroke', phase.color);
 
  // next period
  const daysLeft = cycleDuration - cycleDay;
  document.getElementById('nextPeriod').textContent = `~${daysLeft}d`;
 
  // charts
  buildBarChart(user);
  buildSymptomChart(user);
 
  // welcome message
  const welcomeMsg = `¡Hola ${first}! 💕 Soy Aurora, tu asistente de bienestar de AURA. Hoy es tu día **${cycleDay}** del ciclo — estás en tu **${phase.name}** (${phase.desc}).\n\n¿En qué puedo ayudarte hoy? Puedo darte consejos personalizados sobre nutrición, ejercicio, manejo de síntomas, o simplemente escucharte 🌸`;
  addMessage('ai', welcomeMsg);
}
 
/* ═══════════════════════════════════════
   CHARTS
═══════════════════════════════════════ */
function buildBarChart(user) {
  let months = [];
  let days = [];
  
  if (user && user.cycles && user.cycles.length > 0) {
      // Tomamos los últimos 6 ciclos
      const recentCycles = user.cycles.slice(-6);
      recentCycles.forEach(c => {
          const start = new Date(c.startDate);
          let monthName = start.toLocaleString('es-ES', { month: 'short' });
          months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
          days.push(c.averageDuration || 28);
      });
  } else {
      // Fallback si no hay ciclos guardados
      months = ['Nov','Dic','Ene','Feb','Mar','Abr'];
      days   = [27, 29, 28, 30, 27, cycleDay > 0 ? cycleDay : 28];
  }

  const max = Math.max(...days, 1);
  const container = document.getElementById('barChart');
  if (!container) return;
  container.innerHTML = '';
  months.forEach((m,i) => {
    const pct = (days[i] / max) * 100;
    container.innerHTML += `
      <div class="bar-col">
        <div class="bar" style="height:${pct}%;"></div>
        <div class="bar-label" style="font-size: 0.8rem;">${m}</div>
      </div>`;
  });
}
 
function buildSymptomChart(user) {
  let items = [];
  let vals = [];

  if (user && user.symptomsLogs && user.symptomsLogs.length > 0) {
      const counts = {};
      user.symptomsLogs.forEach(log => {
          if (log.symptoms) {
              log.symptoms.forEach(sym => {
                  counts[sym] = (counts[sym] || 0) + 1;
              });
          }
      });
      
      const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      const top5 = sorted.slice(0, 5);
      
      if (top5.length > 0) {
          items = top5.map(s => s.length > 8 ? s.substring(0, 7) + '.' : s);
          vals = top5.map(s => counts[s]);
      }
  }
  
  if (items.length === 0) {
      items = ['Fatiga','Cólicos','Hinchaz.','Humor','Antojos'];
      vals  = [8, 5, 6, 7, 4];
  }

  const max = Math.max(...vals, 1);
  const container = document.getElementById('symptomChart');
  if (!container) return;
  container.innerHTML = '';
  items.forEach((s,i) => {
    const pct = (vals[i] / max) * 100;
    container.innerHTML += `
      <div class="bar-col">
        <div class="bar" style="height:${pct}%; background: linear-gradient(to top, #AD1457, #F48FB1);"></div>
        <div class="bar-label" style="font-size: 0.75rem; text-align: center;">${s}</div>
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
 
  // Bloque demo: Simulador de IA con análisis de contexto y palabras clave
  setTimeout(() => {
    setTyping(false);
    
    // Función de generación dinámica de respuesta
    function generateAIResponse(userInput, phase, mood, symptoms, flow) {
        const textLower = userInput.toLowerCase().trim();
        const nombreCorto = userName.split(' ')[0];
        
        // 1. Saludos
        if (textLower.includes('hola') || textLower.includes('buenos dias') || textLower.includes('saludos')) {
            return `¡Hola, ${nombreCorto}! 🌸 Me alegra verte por aquí. Noté que estás en tu **${phase.name}** y hoy te sientes **${mood}**. ¿Cómo te puedo ayudar con esos síntomas de **${symptoms}**?`;
        }
        
        // 2. Dolor o Cólicos
        if (textLower.includes('duele') || textLower.includes('dolor') || textLower.includes('cólico') || textLower.includes('colico')) {
            let advice = "Te sugiero aplicar calor en el vientre y tomar una infusión de manzanilla o jengibre. ";
            if (symptoms.includes('Cólicos')) {
                advice += "Veo que registraste cólicos hoy, es muy normal en tu fase actual. Descansa lo que necesites.";
            }
            return `Entiendo que sientas molestias. ${advice} Si el dolor es muy fuerte y persistente, por favor consulta con un médico. 💖`;
        }
        
        // 3. Estado de ánimo triste/cansada
        if (textLower.includes('triste') || textLower.includes('cansada') || textLower.includes('llorar') || textLower.includes('fatiga') || textLower.includes('mal')) {
            let res = `Es completamente válido sentirse así, especialmente estando en tu **${phase.name}**. Tu cuerpo está experimentando cambios hormonales. `;
            if (mood !== 'desconocido') {
                res += `Ya vi que marcaste tu ánimo como **${mood}**. `;
            }
            return res + "Te recomiendo ser amable contigo misma hoy, tómate un tiempo libre, escucha música suave o lee un libro. ¡Tu bienestar emocional es prioridad! ✨";
        }

        // 4. Preguntas sobre flujo
        if (textLower.includes('flujo') || textLower.includes('sangrado') || textLower.includes('manchado')) {
            return `El flujo cambia dependiendo de tu ciclo. Ahora estás en **${phase.name}** y marcaste tu flujo como **${flow}**. Es información muy útil para conocer tus patrones. Si notas un cambio de color inusual y persistente, recuerda que es buena idea visitar a tu especialista. 🌸`;
        }
        
        // 5. Ejercicio, energía o alimentación
        if (textLower.includes('ejercicio') || textLower.includes('entrenar') || textLower.includes('comer') || textLower.includes('hambre') || textLower.includes('antojos')) {
            if (phase.name.toLowerCase().includes('menstrual') || phase.name.toLowerCase().includes('lútea')) {
                return "En tu fase actual, tu energía puede estar un poco más baja. Te recomiendo ejercicios suaves como yoga o estiramientos, e incluir alimentos ricos en hierro y magnesio (espinacas, chocolate negro puro) para esos **antojos**. 🍫🧘‍♀️";
            } else {
                return "¡Estás en una fase de mayor energía! Es un gran momento para entrenamientos de fuerza o cardio. Asegúrate de comer proteínas y carbohidratos complejos para mantener toda esa vitalidad. 💪🥗";
            }
        }

        // 6. Respuestas cortas o conversacionales (si, no, gracias, ok)
        if (textLower === 'si' || textLower === 'sí' || textLower.includes('tip de relajación') || textLower.includes('tip de autocuidado')) {
            return "¡Perfecto! Un buen tip rápido: Toma 5 minutos para hacer respiraciones profundas (inhala en 4 segundos, exhala en 4). Luego, bebe un vaso de agua y estira tu cuello suavemente. A veces, las cosas simples son las que más nos reconfortan. 🌿";
        }
        if (textLower.includes('gracias') || textLower === 'ok' || textLower === 'vale' || textLower === 'entendido') {
            return "¡Con mucho gusto! Estoy aquí siempre que me necesites. No olvides escuchar a tu cuerpo hoy. 💕";
        }
        if (textLower === 'no') {
            return "Entiendo. Si cambias de opinión o necesitas hablar de otra cosa, aquí estaré. ¡Tómate el día a tu ritmo! ✨";
        }

        // Respuesta por defecto combinando la data dinámica del sidebar
        return `¡Te entiendo! En este momento estás en la **${phase.name}**. Veo que tu ánimo principal es **${mood}** y presentas: **${symptoms}**. \n\nRecuerda que cada ciclo es único y estoy aquí para apoyarte. Tómate el día a tu propio ritmo. ¿Tienes alguna pregunta específica sobre tus síntomas o prefieres que te dé un tip de autocuidado? 🌸`;
    }

    const respuestaMuestra = generateAIResponse(text, phase, activeMood, activeSymptoms, activeFlow);
    
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

