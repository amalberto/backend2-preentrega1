// public/js/products.page.js
// UI de catálogo + "Agregar al carrito" (Handlebars + JS)

const productsGrid = document.getElementById('products-grid');
const pagination = document.getElementById('pagination');
const notice = document.getElementById('notice');

/**
 * Mostrar aviso no intrusivo en la UI
 */
function showNotice(message, type = 'info') {
  if (!notice) return;
  notice.textContent = message;
  notice.className = `notice ${type}`;
  notice.hidden = false;

  window.clearTimeout(showNotice._t);
  showNotice._t = window.setTimeout(() => {
    notice.hidden = true;
  }, 3500);
}

/**
 * Intenta obtener el usuario actual vía API.
 * Devuelve null si no hay sesión.
 */
async function getCurrentUser() {
  try {
    const res = await fetch('/api/users/current', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    // La API devuelve { ok, user } no { payload }
    return data?.user || data?.payload || null;
  } catch {
    return null;
  }
}

/**
 * Obtiene (o crea) el carrito del usuario autenticado.
 * Backend: POST /api/carts/mine
 */
async function ensureCartId() {
  const res = await fetch('/api/carts/mine', {
    method: 'POST',
    credentials: 'include'
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'No se pudo obtener el carrito');
  }

  const cartId = data?.payload?.cartId;
  if (!cartId) throw new Error('Respuesta inválida al obtener carrito');

  return cartId;
}

function safeNumber(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function addToCart(productId, quantity) {
  // 1) sesión
  const user = await getCurrentUser();
  
  if (!user) {
    window.location.href = '/users/login';
    return;
  }
  if (user.role !== 'user') {
    showNotice('Solo usuarios con rol "user" pueden comprar.', 'error');
    return;
  }

  // 2) cart
  const cartId = await ensureCartId();

  // 3) llamada
  const url = `/api/carts/${cartId}/products/${productId}`;
  
  const doRequest = async () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity })
    });

  const res = await doRequest();

  if (res.status === 401) {
    window.location.href = '/users/login';
    return;
  }

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = data?.error || data?.message || 'No se pudo agregar al carrito';
    showNotice(msg, 'error');
    return;
  }

  showNotice('✅ Producto agregado al carrito', 'success');
  
  // Actualizar estado del botón "Ir al carrito"
  if (window.updateCartButton) {
    window.updateCartButton();
  }
  
  // Actualizar stock visual del producto (restar cantidad agregada)
  updateProductStockVisual(productId, -quantity);
}

/**
 * Actualiza visualmente el stock de un producto en la UI
 * @param {string} productId - ID del producto
 * @param {number} delta - Cambio en stock (negativo = reducir, positivo = aumentar)
 */
function updateProductStockVisual(productId, delta) {
  const card = document.querySelector(`.product-card[data-pid="${productId}"]`);
  if (!card) return;
  
  const stockEl = card.querySelector('.stock');
  if (!stockEl) return;
  
  // Extraer número actual
  const match = stockEl.textContent.match(/(\d+)/);
  if (!match) return;
  
  const currentStock = parseInt(match[1], 10);
  const newStock = Math.max(0, currentStock + delta);
  
  // Actualizar texto
  stockEl.textContent = newStock > 0 ? `${newStock} disponibles` : 'Sin stock';
  
  // Actualizar estado del botón si stock llega a 0
  const btn = card.querySelector('.btn-add-cart');
  const qtyInput = card.querySelector('.qty-input');
  
  if (newStock <= 0) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'No disponible';
    }
    if (qtyInput) qtyInput.disabled = true;
    stockEl.classList.add('out-of-stock');
  } else {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Agregar al carrito';
    }
    if (qtyInput) qtyInput.disabled = false;
    stockEl.classList.remove('out-of-stock');
  }
}

// Exponer para usar desde cart.js si se vacía el carrito
window.updateProductStockVisual = updateProductStockVisual;

function buildProductCard(product) {
  // Usar availableStock si está disponible, sino stock normal
  const stockToShow = product.availableStock !== undefined ? product.availableStock : product.stock;
  const disabled = !product?.status || stockToShow <= 0;
  const stockLabel = stockToShow > 0 ? `${stockToShow} disponibles` : 'Sin stock';
  const buttonLabel = disabled ? 'No disponible' : 'Agregar al carrito';

  return `
    <div class="product-card" data-pid="${product._id}">
      <h3>${product.title}</h3>
      <p>${product.description}</p>
      <p class="price">$${product.price}</p>
      <p class="stock${stockToShow <= 0 ? ' out-of-stock' : ''}">${stockLabel}</p>
      <p class="category">Categoría: ${product.category}</p>

      <div class="cart-actions">
        <input
          class="qty-input"
          type="number"
          min="1"
          max="${stockToShow}"
          value="1"
          ${disabled ? 'disabled' : ''}
        />
        <button type="button" class="btn-add-cart" ${disabled ? 'disabled' : ''}>
          ${buttonLabel}
        </button>
      </div>
    </div>
  `;
}

function updatePagination(data) {
  const currentPage = data.page;
  const totalPages = data.totalPages;

  let html = '';
  if (data.hasPrevPage) {
    html += `<a href="?page=${data.prevPage}" class="page-link">Anterior</a>`;
  }

  html += `<span class="current-page">Página ${currentPage} de ${totalPages}</span>`;

  if (data.hasNextPage) {
    html += `<a href="?page=${data.nextPage}" class="page-link">Siguiente</a>`;
  }

  pagination.innerHTML = html;
}

async function loadProducts() {
  try {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 1;

    // Solicitar productos con stock disponible real (descontando carritos pendientes)
    const res = await fetch(`/api/products?page=${page}&withAvailableStock=true`, { credentials: 'include' });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || data?.message || 'No se pudieron cargar productos');
    }

    const data = await res.json();
    const products = data.payload || [];

    productsGrid.innerHTML = products.map(buildProductCard).join('');
    updatePagination(data);
  } catch (error) {
    productsGrid.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

function wireAddToCart() {
  if (!productsGrid) return;

  productsGrid.addEventListener('click', async (e) => {
    const button = e.target?.closest?.('.btn-add-cart');
    if (!button) return;
    
    // Prevenir cualquier comportamiento por defecto
    e.preventDefault();
    e.stopPropagation();

    const card = button.closest('.product-card');
    const productId = card?.dataset?.pid;
    const qtyInput = card?.querySelector('.qty-input');
    const qty = safeNumber(qtyInput?.value, 1);

    if (!productId) {
      showNotice('Producto inválido', 'error');
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      showNotice('Cantidad inválida', 'error');
      return;
    }

    button.disabled = true;
    try {
      await addToCart(productId, qty);
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  wireAddToCart();
  await loadProducts();
  await updateCartButton();
});

/**
 * Actualiza el estado del botón "Ir al carrito"
 * - Solo visible para usuarios con rol 'user'
 * - Habilitado solo si hay productos en el carrito
 */
async function updateCartButton() {
  const btn = document.getElementById('go-to-cart-btn');
  if (!btn) return; // No existe (admin o no logueado)
  
  try {
    // Verificar si hay carrito y productos
    const res = await fetch('/api/carts/mine', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!res.ok) {
      const data = await safeJson(res);
      // Si es error de rol (admin intentando), mostrar mensaje
      if (res.status === 403) {
        btn.title = data?.error || 'Solo usuarios pueden tener carrito';
        btn.disabled = true;
        return;
      }
      // Otro error, mantener deshabilitado
      btn.title = 'No se pudo verificar el carrito';
      btn.disabled = true;
      return;
    }
    
    const data = await safeJson(res);
    const cart = data?.payload?.cart;
    
    // Verificar si hay productos
    const hasProducts = cart?.products?.length > 0;
    
    if (hasProducts) {
      btn.disabled = false;
      btn.title = `Ver carrito (${cart.products.length} producto${cart.products.length > 1 ? 's' : ''})`;
      btn.onclick = () => window.location.href = '/my-cart';
    } else {
      btn.disabled = true;
      btn.title = 'El carrito está vacío';
    }
  } catch (err) {
    btn.title = 'Error al verificar carrito';
    btn.disabled = true;
  }
}

// Exponer función para actualizar desde addToCart
window.updateCartButton = updateCartButton;
