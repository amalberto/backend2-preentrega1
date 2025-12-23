document.addEventListener('DOMContentLoaded', async () => {
  const cartContainer = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');

  // Obtener carrito actual
  const cartRes = await fetch('/api/carts/mine', { method: 'POST', credentials: 'include' });
  if (!cartRes.ok) return alert('Error al obtener carrito');
  const { payload } = await cartRes.json();
  const cartId = payload.cartId;

  async function loadCart() {
    const res = await fetch(`/api/carts/${cartId}`, { credentials: 'include' });
    const data = await res.json();

    if (!data.payload?.products?.length) {
      cartContainer.innerHTML = '<p>🪹 Tu carrito está vacío.</p>';
      summary.textContent = '';
      return;
    }

    let total = 0;
    cartContainer.innerHTML = '';
    data.payload.products.forEach(item => {
      const subtotal = item.quantity * item.product.price;
      total += subtotal;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span>${item.product.title}</span>
        <span>$${item.product.price}</span>
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-pid="${item.product._id}">-</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button class="qty-btn" data-action="inc" data-pid="${item.product._id}">+</button>
        </div>
        <span class="subtotal">$${subtotal.toFixed(2)}</span>
        <button class="btn btn-danger btn-sm" data-action="remove" data-pid="${item.product._id}">❌</button>
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
  });

  document.getElementById('goProducts').addEventListener('click', () => {
    window.location.href = '/products';
  });

  await loadCart();
});
