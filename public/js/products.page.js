// public/js/products.page.js
// UI de catálogo + "Agregar al carrito" (Handlebars + JS)

const CART_ID_KEY = 'backend2:cartId:v1';

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
    return data?.payload || null;
  } catch {
    return null;
  }
}

/**
 * Obtiene o crea un cartId y lo guarda en localStorage.
 * Si el cart guardado ya no existe, crea uno nuevo.
 */
async function ensureCartId() {
  const stored = window.localStorage.getItem(CART_ID_KEY);
  if (stored) return stored;

  const res = await fetch('/api/carts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || data?.message || 'No se pudo crear el carrito');
  }

  const data = await res.json();
  const cartId = data?.payload?._id;
  if (!cartId) throw new Error('Respuesta inválida al crear carrito');

  window.localStorage.setItem(CART_ID_KEY, cartId);
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
  let cartId = await ensureCartId();

  // 3) llamada
  const doRequest = async () =>
    fetch(`/api/carts/${cartId}/products/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity })
    });

  let res = await doRequest();

  // Si el cart guardado quedó inválido, recrear y reintentar 1 vez.
  if (res.status === 404) {
    window.localStorage.removeItem(CART_ID_KEY);
    cartId = await ensureCartId();
    res = await doRequest();
  }

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
}

function buildProductCard(product) {
  const disabled = !product?.status || product?.stock <= 0;
  const stockLabel = product?.stock > 0 ? `${product.stock} disponibles` : 'Sin stock';
  const buttonLabel = disabled ? 'No disponible' : 'Agregar al carrito';

  return `
    <div class="product-card" data-pid="${product._id}">
      <h3>${product.title}</h3>
      <p>${product.description}</p>
      <p class="price">$${product.price}</p>
      <p class="stock">${stockLabel}</p>
      <p class="category">Categoría: ${product.category}</p>

      <div class="cart-actions">
        <input
          class="qty-input"
          type="number"
          min="1"
          value="1"
          ${disabled ? 'disabled' : ''}
        />
        <button class="btn-add-cart" ${disabled ? 'disabled' : ''}>
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

    const res = await fetch(`/api/products?page=${page}`, { credentials: 'include' });
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
});
