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

      ticketsList.innerHTML = tickets.map(ticket => {
        const hasProducts = ticket.products && ticket.products.length > 0;
        return `
          <div class="ticket-card">
            <div class="ticket-header">
              <span class="ticket-code">🎫 ${ticket.code}</span>
              <span class="ticket-date">${new Date(ticket.purchase_datetime).toLocaleString('es-AR')}</span>
            </div>
            <div class="ticket-body">
              <p class="ticket-amount"><strong>Total:</strong> $${ticket.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              ${hasProducts ? `
                <details class="ticket-products">
                  <summary>📦 Ver productos (${ticket.products.length})</summary>
                  <ul class="products-list">
                    ${ticket.products.map(p => `
                      <li>
                        <span class="product-name">${p.title || 'Producto'}</span>
                        <span class="product-qty">x${p.quantity}</span>
                        <span class="product-price">$${((p.price || 0) * p.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </li>
                    `).join('')}
                  </ul>
                </details>
              ` : '<p class="no-detail-info">ℹ️ Detalle no disponible (ticket anterior)</p>'}
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      ticketsList.innerHTML = `<div class="error">❌ Error de conexión: ${err.message}</div>`;
    }
  }

  await loadTickets();
});
