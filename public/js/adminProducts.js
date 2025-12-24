// public/js/adminProducts.js
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('product-form');
  const formTitle = document.getElementById('form-title');
  const productIdInput = document.getElementById('product-id');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const productsList = document.getElementById('products-list');
  const notice = document.getElementById('notice');

  let editMode = false;

  function showNotice(message, type = 'info') {
    notice.textContent = message;
    notice.className = `notice ${type}`;
    notice.hidden = false;
    setTimeout(() => { notice.hidden = true; }, 4000);
  }

  function resetForm() {
    form.reset();
    productIdInput.value = '';
    formTitle.textContent = '➕ Nuevo Producto';
    submitBtn.textContent = '💾 Guardar';
    cancelBtn.hidden = true;
    editMode = false;
    document.getElementById('status').checked = true;
  }

  async function loadProducts() {
    productsList.innerHTML = '<p>⏳ Cargando productos...</p>';

    try {
      const res = await fetch('/api/products?limit=100', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        productsList.innerHTML = `<div class="error">❌ ${data.error || 'Error al cargar'}</div>`;
        return;
      }

      const products = data.payload || [];

      if (products.length === 0) {
        productsList.innerHTML = '<p>No hay productos registrados.</p>';
        return;
      }

      productsList.innerHTML = products.map(p => `
        <div class="product-admin-card ${!p.status ? 'inactive' : ''}" data-id="${p._id}">
          <div class="product-info">
            <strong>${p.title}</strong>
            <span class="product-code">[${p.code}]</span>
            <span class="product-price">$${p.price}</span>
            <span class="product-stock">Stock: ${p.stock}</span>
            <span class="product-category">${p.category}</span>
            ${!p.status ? '<span class="badge-inactive">Inactivo</span>' : ''}
          </div>
          <div class="product-actions">
            <button class="btn btn-sm btn-edit" data-action="edit">✏️ Editar</button>
            <button class="btn btn-sm btn-danger" data-action="delete">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('');

    } catch (err) {
      productsList.innerHTML = `<div class="error">❌ Error: ${err.message}</div>`;
    }
  }

  // Submit form (create or update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
      title: document.getElementById('title').value.trim(),
      code: document.getElementById('code').value.trim(),
      description: document.getElementById('description').value.trim(),
      price: parseFloat(document.getElementById('price').value),
      stock: parseInt(document.getElementById('stock').value),
      category: document.getElementById('category').value.trim(),
      status: document.getElementById('status').checked
    };

    try {
      let res;
      if (editMode && productIdInput.value) {
        // UPDATE
        res = await fetch(`/api/products/${productIdInput.value}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(productData)
        });
      } else {
        // CREATE
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(productData)
        });
      }

      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || data.message || 'Error al guardar', 'error');
        return;
      }

      showNotice(editMode ? '✅ Producto actualizado' : '✅ Producto creado', 'success');
      resetForm();
      await loadProducts();

    } catch (err) {
      showNotice(`❌ Error: ${err.message}`, 'error');
    }
  });

  // Cancel edit
  cancelBtn.addEventListener('click', resetForm);

  // Click en lista (edit/delete)
  productsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const card = btn.closest('.product-admin-card');
    const productId = card?.dataset.id;
    const action = btn.dataset.action;

    if (action === 'edit') {
      // Cargar datos del producto en el form
      try {
        const res = await fetch(`/api/products/${productId}`, { credentials: 'include' });
        const data = await res.json();

        if (!res.ok) {
          showNotice('Error al cargar producto', 'error');
          return;
        }

        const p = data.payload;
        productIdInput.value = p._id;
        document.getElementById('title').value = p.title;
        document.getElementById('code').value = p.code;
        document.getElementById('description').value = p.description || '';
        document.getElementById('price').value = p.price;
        document.getElementById('stock').value = p.stock;
        document.getElementById('category').value = p.category;
        document.getElementById('status').checked = p.status;

        formTitle.textContent = '✏️ Editar Producto';
        submitBtn.textContent = '💾 Actualizar';
        cancelBtn.hidden = false;
        editMode = true;

        // Scroll al form
        form.scrollIntoView({ behavior: 'smooth' });

      } catch (err) {
        showNotice(`❌ Error: ${err.message}`, 'error');
      }
    }

    if (action === 'delete') {
      if (!confirm('¿Estás seguro de eliminar este producto?')) return;

      try {
        const res = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok) {
          showNotice(data.error || 'Error al eliminar', 'error');
          return;
        }

        showNotice('✅ Producto eliminado', 'success');
        await loadProducts();

      } catch (err) {
        showNotice(`❌ Error: ${err.message}`, 'error');
      }
    }
  });

  // Cargar productos al iniciar
  await loadProducts();
});
