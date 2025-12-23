COMMIT 1 — Panel Admin + checks de mail desde UI

Mensaje sugerido: feat(views): panel admin con verificación de mail

Objetivo

Agregar una vista solo admin para:

Verificar config de mail

Verificar conexión SMTP

Enviar mail de prueba

✅ DIFFS (aplicables “tal cual”)

Nota: ajusté un detalle importante: tu UI (adminPanel.js) espera que /api/mail/status responda { valid: true/false }. Si tu endpoint hoy responde { status: "success" }, hay que alinearlo.

1) src/views/adminPanel.handlebars (NUEVO)
<div class="container admin-panel">
  <h1>🛠 Panel de Administración</h1>
  <h2>Bienvenido, {{user.first_name}}</h2>

  <div class="admin-section">
    <h3>📧 Configuración de Mail</h3>

    <div class="mail-checks">
      <button id="checkConfig" class="btn btn-secondary" type="button">Verificar Config</button>
      <button id="checkSmtp" class="btn btn-secondary" type="button">Verificar SMTP</button>
      <span id="configStatus" class="status"></span>
    </div>

    <div class="mail-test">
      <h4>Enviar Email de Prueba</h4>
      <form id="testMailForm">
        <div class="form-group">
          <label for="testEmail">Email destino:</label>
          <input type="email" id="testEmail" name="to" required placeholder="test@ejemplo.com">
        </div>
        <button type="submit" class="btn btn-primary">Enviar Test</button>
      </form>

      <div id="mailResult" class="result"></div>
    </div>
  </div>

  <div class="admin-actions">
    <a href="/users/current" class="btn btn-secondary">← Volver al Perfil</a>
    <a href="/products" class="btn btn-primary">🛒 Ver Productos</a>
  </div>

  <form action="/api/users/logout" method="POST" style="margin-top: 20px;">
    <button type="submit" class="logout-btn">Cerrar Sesión</button>
  </form>
</div>

<script src="/js/adminPanel.js"></script>

2) public/js/adminPanel.js (NUEVO)
document.addEventListener('DOMContentLoaded', () => {
  const configStatus = document.getElementById('configStatus');
  const mailResult = document.getElementById('mailResult');

  const setStatus = (el, text, kind) => {
    el.textContent = text;
    el.className = kind ? `status ${kind}` : 'status';
  };

  // Check config
  document.getElementById('checkConfig')?.addEventListener('click', async () => {
    setStatus(configStatus, '⏳ Verificando config...', '');
    try {
      const res = await fetch('/api/mail/status');
      const data = await res.json();

      if (data.valid) setStatus(configStatus, '✅ Config OK', 'success');
      else setStatus(configStatus, `❌ Config inválida: ${data.error || ''}`, 'error');
    } catch (err) {
      setStatus(configStatus, `❌ Error: ${err.message}`, 'error');
    }
  });

  // Check SMTP
  document.getElementById('checkSmtp')?.addEventListener('click', async () => {
    setStatus(configStatus, '⏳ Verificando SMTP...', '');
    try {
      const res = await fetch('/api/mail/status/smtp');
      const data = await res.json();

      if (data.valid) setStatus(configStatus, '✅ SMTP conectado', 'success');
      else setStatus(configStatus, `❌ SMTP falló: ${data.error || ''}`, 'error');
    } catch (err) {
      setStatus(configStatus, `❌ Error: ${err.message}`, 'error');
    }
  });

  // Send test mail
  document.getElementById('testMailForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const to = document.getElementById('testEmail').value;

    mailResult.textContent = '⏳ Enviando...';
    mailResult.className = 'result';

    try {
      const res = await fetch('/api/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: 'Test desde Admin Panel',
          text: 'Email de prueba enviado desde el panel de administración.'
        })
      });

      const data = await res.json();

      if (res.ok) {
        mailResult.textContent = `✅ Email enviado: ${data.messageId || '(sin messageId)'}`;
        mailResult.className = 'result success';
      } else {
        mailResult.textContent = `❌ Error: ${data.error || data.message || 'Error desconocido'}`;
        mailResult.className = 'result error';
      }
    } catch (err) {
      mailResult.textContent = `❌ Error: ${err.message}`;
      mailResult.className = 'result error';
    }
  });
});

3) src/app.js (MODIFICAR) — Ruta /admin-panel protegida
+// Admin Panel (solo admin)
+app.get('/admin-panel', passportCall('jwt'), authorization('admin'), (req, res) => {
+  res.render('adminPanel', { user: req.user });
+});


Usé passportCall('jwt') como en tus vistas protegidas típicas. Si en tu proyecto la estrategia correcta es 'current', cambiá ese string y listo.

4) src/views/current.handlebars (MODIFICAR) — Link solo admin

Opción simple (sin helpers), suponiendo que tu controller pasa isAdmin:

 <div class="actions">
+  {{#if isAdmin}}
+    <a href="/admin-panel" class="btn btn-warning">🛠 Panel Admin</a>
+  {{/if}}
   <a href="/products" class="btn btn-primary">🛒 Ver Productos</a>
 </div>

5) public/css/styles.css (MODIFICAR) — estilos
+/* ===== Admin Panel ===== */
+.admin-panel h3 {
+  color: #333;
+  margin: 20px 0 10px;
+  border-bottom: 2px solid #667eea;
+  padding-bottom: 5px;
+}
+
+.mail-checks {
+  display: flex;
+  gap: 10px;
+  align-items: center;
+  margin-bottom: 20px;
+}
+
+.mail-test {
+  background: #f5f5f5;
+  padding: 20px;
+  border-radius: 5px;
+  margin-bottom: 20px;
+}
+
+.status, .result {
+  padding: 8px 12px;
+  border-radius: 4px;
+  font-weight: 500;
+}
+
+.status.success, .result.success {
+  background: #d4edda;
+  color: #155724;
+}
+
+.status.error, .result.error {
+  background: #f8d7da;
+  color: #721c24;
+}
+
+.btn-warning {
+  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
+  color: white;
+}
+
+.btn-secondary {
+  background: #6c757d;
+  color: white;
+}
+
+.admin-actions {
+  display: flex;
+  gap: 10px;
+  margin-top: 20px;
+}

Ajuste clave en la API de Mail (si aún no está)
6) src/routes/mail.api.js (MODIFICAR) — devolver {valid} y agregar /status/smtp

Si tu /api/mail/status hoy no devuelve valid, cambialo así:

 router.get('/status', (req, res) => {
-  const config = verifyMailConfig();
-  if (config.valid) {
-    res.json({ status: 'success', message: 'Configuración de mail válida' });
-  } else {
-    res.status(500).json({ status: 'error', message: config.error });
-  }
+  const result = verifyMailConfig();
+  res.status(result.valid ? 200 : 500).json(result);
 });
+
+router.get('/status/smtp', async (req, res) => {
+  try {
+    await verifyTransporter();
+    res.json({ valid: true });
+  } catch (err) {
+    res.status(500).json({ valid: false, error: err.message });
+  }
+});


Y en src/utils/mailer.js agregás:

 export const verifyMailConfig = () => validateMailConfig();
+
+export const verifyTransporter = async () => {
+  const transport = getTransporter();
+  await transport.verify();
+  return true;
+};

Checklist del COMMIT 1

/users/current como admin: aparece link Panel Admin

/admin-panel:

con user normal → 403

con admin → render OK

Botón “Verificar Config” muestra ✅/❌

Botón “Verificar SMTP” muestra ✅/❌

“Enviar Test”:

sin auth → 401

user → 403

admin → email enviado