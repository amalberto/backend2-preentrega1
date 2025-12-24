document.addEventListener('DOMContentLoaded', async () => {
  const cartContainer = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  const expirationDiv = document.getElementById('cart-expiration');
  const expirationTime = document.getElementById('expiration-time');
  
  let expirationTimer = null;
  let cartExpiresAt = null;

  // Obtener carrito actual (GET es más semántico, pero POST también funciona)
  const cartRes = await fetch('/api/carts/mine', { credentials: 'include' });
  if (!cartRes.ok) return alert('Error al obtener carrito');
  const { payload } = await cartRes.json();
  const cartId = payload.cartId;
  
  // Guardar fecha de expiración (solo si hay productos)
  if (payload.cart?.expiresAt && payload.cart?.products?.length > 0) {
    cartExpiresAt = new Date(payload.cart.expiresAt);
    startExpirationTimer();
  }

  /**
   * Inicia/reinicia el timer de expiración
   */
  function startExpirationTimer() {
    if (expirationTimer) clearInterval(expirationTimer);
    
    updateExpirationDisplay();
    expirationTimer = setInterval(updateExpirationDisplay, 1000);
  }
  
  /**
   * Detiene el timer de expiración
   */
  function stopExpirationTimer() {
    if (expirationTimer) {
      clearInterval(expirationTimer);
      expirationTimer = null;
    }
    if (expirationDiv) expirationDiv.hidden = true;
  }

  /**
   * Actualiza el display del tiempo restante
   */
  function updateExpirationDisplay() {
    if (!cartExpiresAt || !expirationDiv) return;
    
    const now = new Date();
    const diff = cartExpiresAt - now;
    
    if (diff <= 0) {
      expirationDiv.innerHTML = '⚠️ <strong>Tu carrito ha expirado.</strong> Recarga la página para crear uno nuevo.';
      expirationDiv.classList.add('expired');
      expirationDiv.hidden = false;
      clearInterval(expirationTimer);
      return;
    }
    
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((diff % 60000) / 1000);
    
    let timeStr;
    if (hours > 0) {
      timeStr = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeStr = `${minutes}m ${seconds}s`;
    } else {
      timeStr = `${seconds}s`;
    }
    
    expirationTime.textContent = timeStr;
    expirationDiv.hidden = false;
    
    // Cambiar color según tiempo restante
    // TODO: Ajustar para producción (warning < 30min, critical < 10min)
    const totalSeconds = Math.floor(diff / 1000);
    expirationDiv.classList.remove('warning', 'critical');
    
    if (totalSeconds < 90) { // Menos de 1.5 minutos = warning (naranja)
      expirationDiv.classList.add('warning');
    }
    if (totalSeconds < 60) { // Menos de 1 minuto = critical (rojo)
      expirationDiv.classList.remove('warning');
      expirationDiv.classList.add('critical');
    }
  }

  /**
   * Actualiza la fecha de expiración desde la respuesta del servidor
   * Solo inicia el timer si hay productos en el carrito
   */
  function updateExpirationFromResponse(data) {
    const hasProducts = data?.payload?.products?.length > 0;
    
    if (data?.payload?.expiresAt && hasProducts) {
      cartExpiresAt = new Date(data.payload.expiresAt);
      expirationDiv.classList.remove('warning', 'critical', 'expired');
      startExpirationTimer();
    } else {
      stopExpirationTimer();
    }
  }

  async function loadCart() {
    const res = await fetch(`/api/carts/${cartId}`, { credentials: 'include' });
    const data = await res.json();
    
    const purchaseBtn = document.getElementById('purchaseBtn');
    const clearBtn = document.getElementById('clearCart');

    if (!data.payload?.products?.length) {
      cartContainer.innerHTML = '<p>🪹 Tu carrito está vacío.</p>';
      summary.textContent = '';
      // Deshabilitar botones y ocultar timer cuando el carrito está vacío
      if (purchaseBtn) purchaseBtn.disabled = true;
      if (clearBtn) clearBtn.disabled = true;
      stopExpirationTimer();
      return;
    }
    
    // Actualizar timer con nueva expiración (solo si hay productos)
    updateExpirationFromResponse(data);
    
    // Habilitar botones cuando hay productos
    if (purchaseBtn) purchaseBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;

    let total = 0;
    cartContainer.innerHTML = '';
    data.payload.products.forEach(item => {
      const subtotal = item.quantity * item.product.price;
      total += subtotal;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span class="item-title">${item.product.title}</span>
        <span class="item-price">$${item.product.price}</span>
        <div class="qty-control">
          <button type="button" class="qty-btn" data-action="dec" data-pid="${item.product._id}">−</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button type="button" class="qty-btn" data-action="inc" data-pid="${item.product._id}">+</button>
        </div>
        <span class="item-subtotal">$${subtotal.toFixed(2)}</span>
        <button type="button" class="btn-remove" data-action="remove" data-pid="${item.product._id}">🗑️</button>
      `;
      cartContainer.appendChild(div);
    });

    summary.textContent = `Total estimado: $${total.toFixed(2)}`;
  }

  cartContainer.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const pid = btn.dataset.pid;
    const action = btn.dataset.action;

    if (action === 'inc' || action === 'dec') {
      const input = btn.parentElement.querySelector('input');
      let newQty = parseInt(input.value) + (action === 'inc' ? 1 : -1);
      if (newQty < 1) return;
      await fetch(`/api/carts/${cartId}/products/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty })
      });
      loadCart();
    }

    if (action === 'remove') {
      await fetch(`/api/carts/${cartId}/products/${pid}`, { method: 'DELETE', credentials: 'include' });
      loadCart();
    }
  });

  document.getElementById('clearCart').addEventListener('click', async () => {
    await fetch(`/api/carts/${cartId}`, { method: 'DELETE', credentials: 'include' });
    loadCart();
    // Notificar que se debe recargar stock en productos (la próxima vez que se visite)
    sessionStorage.setItem('cartCleared', 'true');
  });

  document.getElementById('goProducts').addEventListener('click', () => {
    window.location.href = '/products';
  });

  // Handler de Finalizar compra
  document.getElementById('purchaseBtn').addEventListener('click', async () => {
    const resultDiv = document.getElementById('purchase-result');
    resultDiv.hidden = false;
    resultDiv.innerHTML = '<p>⏳ Procesando compra...</p>';
    resultDiv.className = 'purchase-result';

    try {
      const res = await fetch(`/api/carts/${cartId}/purchase`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        resultDiv.innerHTML = `<div class="error">❌ ${data.error || data.message || 'Error al procesar compra'}</div>`;
        return;
      }

      // La API devuelve { status, message, ticket?, unprocessedProducts? } directamente
      const { ticket, unprocessedProducts } = data;
      let html = '';

      // Mostrar ticket si existe
      if (ticket) {
        html += `
          <div class="ticket-success">
            <h3>✅ ¡Compra realizada!</h3>
            <p><strong>Código:</strong> ${ticket.code}</p>
            <p><strong>Total:</strong> $${ticket.amount.toFixed(2)}</p>
            <p><strong>Fecha:</strong> ${new Date(ticket.purchase_datetime).toLocaleString()}</p>
            <p><strong>Email:</strong> ${ticket.purchaser}</p>
          </div>
        `;
      }

      // Mostrar productos no procesados
      if (unprocessedProducts?.length > 0) {
        html += `
          <div class="unprocessed-warning">
            <h4>⚠️ Productos sin stock suficiente:</h4>
            <p>Los siguientes productos quedaron en tu carrito:</p>
            <ul>
              ${unprocessedProducts.map(pid => `<li>${pid}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // Si no hay ticket ni unprocessed (carrito vacío)
      if (!ticket && (!unprocessedProducts || unprocessedProducts.length === 0)) {
        html = '<div class="error">El carrito está vacío</div>';
      }

      resultDiv.innerHTML = html;

      // Recargar carrito (mostrará items restantes o vacío)
      await loadCart();

    } catch (err) {
      resultDiv.innerHTML = `<div class="error">❌ Error de conexión: ${err.message}</div>`;
    }
  });

  await loadCart();
});
