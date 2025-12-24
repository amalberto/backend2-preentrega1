document.addEventListener('DOMContentLoaded', () => {
    const configStatus = document.getElementById('configStatus');
    const mailResult = document.getElementById('mailResult');

    // ========== TABS ==========
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Actualizar botones activos
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Mostrar contenido correspondiente
            tabContents.forEach(content => {
                if (content.id === `tab-${tabId}`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });

            // Cargar datos al cambiar de tab
            if (tabId === 'tickets' && !ticketsLoaded) loadTickets();
            if (tabId === 'carts' && !cartsLoaded) loadCarts();
        });
    });

    // ========== MAIL ==========
    // Check config
    document.getElementById('checkConfig')?.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/mail/status', { credentials: 'include' });
            const data = await res.json();
            const ok = res.ok && data.status === 'success';
            configStatus.textContent = ok ? '✅ Config OK' : `❌ ${data.message || 'Config inválida'}`;
            configStatus.className = 'status ' + (ok ? 'success' : 'error');
        } catch (err) {
            configStatus.textContent = '❌ Error: ' + err.message;
            configStatus.className = 'status error';
        }
    });

    // Check SMTP
    document.getElementById('checkSmtp')?.addEventListener('click', async () => {
        configStatus.textContent = '⏳ Verificando SMTP...';
        try {
            const res = await fetch('/api/mail/status/smtp', { credentials: 'include' });
            const data = await res.json();
            const ok = res.ok && data.status === 'success';
            configStatus.textContent = ok ? '✅ SMTP conectado' : `❌ ${data.message || 'SMTP falló'}`;
            configStatus.className = 'status ' + (ok ? 'success' : 'error');
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
                credentials: 'include',
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

    // ========== TICKETS ==========
    let ticketsLoaded = false;
    let allTickets = [];

    async function loadTickets() {
        const container = document.getElementById('ticketsList');
        try {
            const res = await fetch('/api/tickets/admin/all', { credentials: 'include' });
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                allTickets = data.payload || [];
                ticketsLoaded = true;
                renderTickets(allTickets);
            } else {
                container.innerHTML = `<p class="error">Error: ${data.message || 'No se pudieron cargar los tickets'}</p>`;
            }
        } catch (err) {
            container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
        }
    }

    function renderTickets(tickets) {
        const container = document.getElementById('ticketsList');

        if (!tickets.length) {
            container.innerHTML = '<p class="empty">No hay tickets registrados</p>';
            return;
        }

        container.innerHTML = tickets.map(t => {
            const hasProducts = t.products && t.products.length > 0;
            return `
                <div class="admin-card ticket-card">
                    <div class="card-header">
                        <span class="ticket-code">🎫 ${t.code}</span>
                        <span class="ticket-date">${new Date(t.purchase_datetime).toLocaleString('es-AR')}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Comprador:</strong> ${t.purchaser}</p>
                        <p><strong>Total:</strong> $${t.amount?.toLocaleString('es-AR') || 0}</p>
                        ${hasProducts ? `
                            <details>
                                <summary>Ver productos (${t.products.length})</summary>
                                <ul class="products-list">
                                    ${t.products.map(p => `
                                        <li>${p.title || 'Producto'} x${p.quantity} - $${((p.price || 0) * p.quantity).toLocaleString('es-AR')}</li>
                                    `).join('')}
                                </ul>
                            </details>
                        ` : '<p class="no-products-info">Sin detalle de productos (ticket anterior)</p>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filtro de tickets
    document.getElementById('ticketFilter')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allTickets.filter(t => 
            t.purchaser?.toLowerCase().includes(query) ||
            t.code?.toLowerCase().includes(query)
        );
        renderTickets(filtered);
    });

    // ========== CARTS ==========
    let cartsLoaded = false;
    let allCarts = [];

    async function loadCarts() {
        const container = document.getElementById('cartsList');
        try {
            const res = await fetch('/api/carts/admin/all', { credentials: 'include' });
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                allCarts = data.payload || [];
                cartsLoaded = true;
                renderCarts(allCarts);
            } else {
                container.innerHTML = `<p class="error">Error: ${data.message || 'No se pudieron cargar los carritos'}</p>`;
            }
        } catch (err) {
            container.innerHTML = `<p class="error">Error: ${err.message}</p>`;
        }
    }

    function renderCarts(carts) {
        const container = document.getElementById('cartsList');

        if (!carts.length) {
            container.innerHTML = '<p class="empty">No hay carritos activos</p>';
            return;
        }

        container.innerHTML = carts.map(item => {
            const { user, cart } = item;
            const productCount = cart.products?.length || 0;
            const expiresAt = cart.expiresAt ? new Date(cart.expiresAt) : null;
            const isExpiringSoon = expiresAt && (expiresAt - Date.now()) < 2 * 60 * 1000;

            return `
                <div class="admin-card cart-card ${isExpiringSoon ? 'expiring' : ''}">
                    <div class="card-header">
                        <span class="user-info">👤 ${user.first_name} ${user.last_name}</span>
                        <span class="user-email">${user.email}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Productos:</strong> ${productCount} item(s)</p>
                        ${expiresAt ? `<p class="expiration"><strong>Expira:</strong> ${expiresAt.toLocaleString('es-AR')}</p>` : ''}
                        ${productCount > 0 ? `
                            <details>
                                <summary>Ver contenido</summary>
                                <ul class="products-list">
                                    ${cart.products.map(p => `
                                        <li>${p.product?.title || 'Producto'} x${p.quantity}</li>
                                    `).join('')}
                                </ul>
                            </details>
                        ` : '<p class="empty-cart">Carrito vacío</p>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filtro de carritos
    document.getElementById('cartFilter')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allCarts.filter(item => 
            item.user?.email?.toLowerCase().includes(query) ||
            item.user?.first_name?.toLowerCase().includes(query) ||
            item.user?.last_name?.toLowerCase().includes(query)
        );
        renderCarts(filtered);
    });
});
