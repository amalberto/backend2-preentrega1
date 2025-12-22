document.addEventListener('DOMContentLoaded', () => {
    const configStatus = document.getElementById('configStatus');
    const mailResult = document.getElementById('mailResult');

    // Check config
    document.getElementById('checkConfig')?.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/mail/status');
            const data = await res.json();
            configStatus.textContent = data.valid ? '✅ Config OK' : '❌ Config inválida';
            configStatus.className = 'status ' + (data.valid ? 'success' : 'error');
        } catch (err) {
            configStatus.textContent = '❌ Error: ' + err.message;
            configStatus.className = 'status error';
        }
    });

    // Check SMTP
    document.getElementById('checkSmtp')?.addEventListener('click', async () => {
        configStatus.textContent = '⏳ Verificando SMTP...';
        try {
            const res = await fetch('/api/mail/status/smtp');
            const data = await res.json();
            configStatus.textContent = data.valid ? '✅ SMTP conectado' : '❌ SMTP falló';
            configStatus.className = 'status ' + (data.valid ? 'success' : 'error');
        } catch (err) {
            configStatus.textContent = '❌ Error: ' + err.message;
            configStatus.className = 'status error';
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
                mailResult.textContent = '✅ Email enviado: ' + data.messageId;
                mailResult.className = 'result success';
            } else {
                mailResult.textContent = '❌ Error: ' + (data.message || data.error || 'Error desconocido');
                mailResult.className = 'result error';
            }
        } catch (err) {
            mailResult.textContent = '❌ Error: ' + err.message;
            mailResult.className = 'result error';
        }
    });
});
