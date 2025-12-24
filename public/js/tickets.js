// public/js/tickets.js
document.addEventListener('DOMContentLoaded', async () => {
  const ticketsList = document.getElementById('tickets-list');

  async function loadTickets() {
    ticketsList.innerHTML = '<p>⏳ Cargando historial...</p>';

    try {
      const res = await fetch('/api/tickets/mine', { credentials: 'include' });
      
      if (res.status === 401) {
        window.location.href = '/users/login';
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        ticketsList.innerHTML = `<div class="error">❌ ${data.error || 'Error al cargar tickets'}</div>`;
        return;
      }

      const tickets = data.payload || [];

      if (tickets.length === 0) {
        ticketsList.innerHTML = '<p class="empty-state">🪹 No tenés compras realizadas aún.</p>';
        return;
      }

      ticketsList.innerHTML = tickets.map(ticket => `
        <div class="ticket-card">
          <div class="ticket-header">
            <span class="ticket-code">🎫 ${ticket.code}</span>
            <span class="ticket-date">${new Date(ticket.purchase_datetime).toLocaleString()}</span>
          </div>
          <div class="ticket-body">
            <p class="ticket-amount"><strong>Total:</strong> $${ticket.amount.toFixed(2)}</p>
            <p class="ticket-email"><strong>Email:</strong> ${ticket.purchaser}</p>
          </div>
        </div>
      `).join('');

    } catch (err) {
      ticketsList.innerHTML = `<div class="error">❌ Error de conexión: ${err.message}</div>`;
    }
  }

  await loadTickets();
});
