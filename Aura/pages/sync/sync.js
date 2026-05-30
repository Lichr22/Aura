document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Sincronización de Anónimo</h1>
    <section id="vinculos" class="card">
      <h2>Vínculo de Anónimo</h2>
      <input type="text" id="partner-code" placeholder="Código de vinculación"/>
      <button id="link-btn">Vincular</button>
    </section>
    <section id="permisos" class="card">
      <h2>Permisos Compartidos</h2>
      <label><input type="checkbox" id="ver-ciclo"/> Ver Ciclo</label>
      <label><input type="checkbox" id="ver-sintomas"/> Ver Síntomas</label>
      <label><input type="checkbox" id="ver-actividad-sexual"/> Ver Actividad Sexual</label>
      <label><input type="checkbox" id="ver-recomendaciones"/> Ver Recomendaciones</label>
      <label><input type="checkbox" id="notificar-periodo"/> Notificar Período Cercano</label>
      <button id="save-permisos">Guardar Permisos</button>
    </section>
  `;
  document.getElementById('link-btn').addEventListener('click', handleLink);
  document.getElementById('save-permisos').addEventListener('click', handleSavePermisos);
});

function handleLink() {
  const code = document.getElementById('partner-code').value;
  if (!code.trim()) return;
  // TODO: POST /api/vinculos
  console.log('Vinculando con código:', code);
}

function handleSavePermisos() {
  const permisos = {
    verCiclo: document.getElementById('ver-ciclo').checked,
    verSintomas: document.getElementById('ver-sintomas').checked,
    verActividadSexual: document.getElementById('ver-actividad-sexual').checked,
    verRecomendacionesPareja: document.getElementById('ver-recomendaciones').checked,
    notificarPeriodoCercano: document.getElementById('notificar-periodo').checked,
  };
  // TODO: PUT /api/permisos/:id
  console.log('Permisos guardados:', permisos);
}
