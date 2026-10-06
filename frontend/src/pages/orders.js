import api from '../api.js';
import showToast from '../components/toast.js';

let currentFilter = '';
let currentPage = 1;

export async function renderOrders(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Order Management</h1>
        <p class="page-subtitle">Submit new orders, inspect event logs, and trace transaction lifecycles</p>
      </div>
      <div>
        <button id="btn-toggle-form" class="btn btn-primary" style="background-color: #10B981; border-color: #059669;">
          + New Order
        </button>
      </div>
    </div>

    <!-- Create Order Form Modal/Collapsible -->
    <div id="create-order-section" class="card" style="display: none; margin-bottom: 2rem; border-color: var(--border-glow);">
      <h3 style="margin-bottom: 1.25rem;">Create New Transaction</h3>
      <form id="order-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Customer Name</label>
            <input type="text" id="input-customer-name" class="form-control" placeholder="e.g. John Doe" required />
          </div>
          <div class="form-group">
            <label class="form-label">Customer Email</label>
            <input type="email" id="input-customer-email" class="form-control" placeholder="e.g. john@example.com (include 'fail' to trigger failure)" required />
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label class="form-label" style="margin: 0;">Line Items</label>
            <button type="button" id="btn-add-item" class="btn btn-outline btn-sm">+ Add Item</button>
          </div>
          <div id="items-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <!-- Dynamic item rows -->
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" id="btn-cancel-order" class="btn btn-outline">Cancel</button>
          <button type="submit" id="btn-submit-order" class="btn btn-primary">Submit Order</button>
        </div>
      </form>
    </div>

    <!-- Filters & Search -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-sm ${currentFilter === '' ? 'btn-primary' : 'btn-outline'}" data-filter="">All</button>
        <button class="btn btn-sm ${currentFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" data-filter="pending">Pending</button>
        <button class="btn btn-sm ${currentFilter === 'processing' ? 'btn-primary' : 'btn-outline'}" data-filter="processing">Processing</button>
        <button class="btn btn-sm ${currentFilter === 'confirmed' ? 'btn-primary' : 'btn-outline'}" data-filter="confirmed">Confirmed</button>
        <button class="btn btn-sm ${currentFilter === 'failed' ? 'btn-primary' : 'btn-outline'}" data-filter="failed">Failed</button>
      </div>
      <div>
        <button id="btn-refresh-orders" class="btn btn-outline btn-sm">&#8635; Refresh</button>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card" style="padding: 0;">
      <div class="table-container" style="border: none;">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total (Tax 11%)</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading orders...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Drawer / Modal -->
    <div id="order-detail-modal" class="card" style="display: none; margin-top: 2rem; border-color: var(--border-glow);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 id="modal-order-id" style="font-size: 1.2rem; font-family: var(--font-mono);">Order Details</h3>
        <button id="btn-close-modal" class="btn btn-outline btn-sm">&times; Close</button>
      </div>
      <div id="modal-order-content"></div>
    </div>
  `;

  setupOrderForm();
  setupFilterButtons();
  loadOrdersList();
}

function setupOrderForm() {
  const toggleBtn = document.getElementById('btn-toggle-form');
  const section = document.getElementById('create-order-section');
  const cancelBtn = document.getElementById('btn-cancel-order');
  const addItemBtn = document.getElementById('btn-add-item');
  const form = document.getElementById('order-form');

  toggleBtn?.addEventListener('click', () => {
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  });

  cancelBtn?.addEventListener('click', () => {
    section.style.display = 'none';
  });

  // Default initial line item
  addItemRow();

  addItemBtn?.addEventListener('click', () => addItemRow());

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerName = document.getElementById('input-customer-name')?.value.trim();
    const customerEmail = document.getElementById('input-customer-email')?.value.trim();

    const itemRows = document.querySelectorAll('.item-row');
    const items = [];

    itemRows.forEach((row) => {
      const sku = row.querySelector('.item-sku')?.value.trim();
      const name = row.querySelector('.item-name')?.value.trim();
      const price = parseFloat(row.querySelector('.item-price')?.value);
      const quantity = parseInt(row.querySelector('.item-qty')?.value, 10);

      if (sku && name && !isNaN(price) && !isNaN(quantity)) {
        items.push({ sku, name, price, quantity });
      }
    });

    if (items.length === 0) {
      showToast('Please specify at least one valid item', 'error');
      return;
    }

    try {
      const submitBtn = document.getElementById('btn-submit-order');
      if (submitBtn) submitBtn.disabled = true;

      await api.createOrder({
        customer_name: customerName,
        customer_email: customerEmail,
        items
      });

      showToast('Order successfully created!', 'success');
      form.reset();
      section.style.display = 'none';
      loadOrdersList();
    } catch (err) {
      showToast(`Failed to create order: ${err.message}`, 'error');
    } finally {
      const submitBtn = document.getElementById('btn-submit-order');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function addItemRow() {
  const container = document.getElementById('items-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'item-row';
  row.style = 'display: grid; grid-template-columns: 2fr 3fr 2fr 1fr 40px; gap: 0.5rem; align-items: center;';
  row.innerHTML = `
    <input type="text" class="form-control item-sku" placeholder="SKU (e.g. S-01)" value="SKU-${Math.floor(Math.random() * 900 + 100)}" required />
    <input type="text" class="form-control item-name" placeholder="Item Name" value="Cloud Hosting Tier ${Math.floor(Math.random() * 3 + 1)}" required />
    <input type="number" class="form-control item-price" placeholder="Price" value="${(Math.floor(Math.random() * 5 + 1) * 50000)}" step="1000" min="1000" required />
    <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required />
    <button type="button" class="btn btn-outline btn-sm btn-del-item" style="color: var(--accent-danger); padding: 0.65rem 0.5rem;">&times;</button>
  `;

  row.querySelector('.btn-del-item')?.addEventListener('click', () => {
    if (document.querySelectorAll('.item-row').length > 1) {
      row.remove();
    } else {
      showToast('Order must contain at least 1 item', 'info');
    }
  });

  container.appendChild(row);
}

function setupFilterButtons() {
  const buttons = document.querySelectorAll('[data-filter]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter') || '';
      currentPage = 1;
      buttons.forEach((b) => {
        b.className = `btn btn-sm ${b === btn ? 'btn-primary' : 'btn-outline'}`;
      });
      loadOrdersList();
    });
  });

  document.getElementById('btn-refresh-orders')?.addEventListener('click', () => {
    loadOrdersList();
    showToast('Orders refreshed', 'info', 1500);
  });
}

async function loadOrdersList() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  try {
    const params = { page: currentPage, limit: 20 };
    if (currentFilter) params.status = currentFilter;

    const res = await api.listOrders(params);
    const orders = res.data || [];

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 0.85rem;">${o.id}</td>
        <td>
          <div style="font-weight: 500;">${escapeHtml(o.customer_name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(o.customer_email)}</div>
        </td>
        <td style="font-family: var(--font-mono);">Rp ${Number(o.total_amount).toLocaleString('id-ID')}</td>
        <td><span class="badge badge-${o.status}">${o.status}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(o.created_at).toLocaleString()}</td>
        <td>
          <button class="btn btn-outline btn-sm btn-inspect" data-order-id="${o.id}">
            Inspect
          </button>
        </td>
      </tr>
    `
      )
      .join('');

    // Attach inspect buttons
    document.querySelectorAll('.btn-inspect').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-order-id');
        if (id) inspectOrder(id);
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-danger);">Failed to load orders: ${err.message}</td></tr>`;
  }
}

async function inspectOrder(id) {
  const modal = document.getElementById('order-detail-modal');
  const modalTitle = document.getElementById('modal-order-id');
  const modalContent = document.getElementById('modal-order-content');
  const closeBtn = document.getElementById('btn-close-modal');

  if (!modal || !modalTitle || !modalContent) return;

  modal.style.display = 'block';
  modalTitle.textContent = `Order: ${id}`;
  modalContent.innerHTML = '<p style="color: var(--text-muted);">Loading audit trail...</p>';
  modal.scrollIntoView({ behavior: 'smooth' });

  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  try {
    const res = await api.getOrderById(id);
    const order = res.data;
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const lineItems = items?.line_items || [];
    const breakdown = items?.breakdown || {};
    const events = order.events || [];

    modalContent.innerHTML = `
      <div class="grid-2" style="margin-bottom: 1.5rem;">
        <div>
          <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-secondary);">Order Information</h4>
          <p><strong>Customer:</strong> ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_email)})</p>
          <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
          ${order.failure_reason ? `<p style="color: var(--accent-danger);"><strong>Failure Reason:</strong> ${escapeHtml(order.failure_reason)}</p>` : ''}
          <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div>
          <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-secondary);">Financial Summary</h4>
          <p>Subtotal: <strong>Rp ${Number(breakdown.subtotal || 0).toLocaleString('id-ID')}</strong></p>
          <p>PPN Tax (11%): <strong>Rp ${Number(breakdown.tax || 0).toLocaleString('id-ID')}</strong></p>
          <p style="font-size: 1.1rem; color: var(--accent-primary); margin-top: 0.25rem;">
            Total: <strong>Rp ${Number(order.total_amount).toLocaleString('id-ID')}</strong>
          </p>
        </div>
      </div>

      <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--text-secondary);">Purchased Items</h4>
      <div class="table-container" style="margin-bottom: 1.5rem;">
        <table>
          <thead>
            <tr><th>SKU</th><th>Name</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${lineItems
        .map(
          (item) => `
              <tr>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;">${escapeHtml(item.sku)}</td>
                <td>${escapeHtml(item.name)}</td>
                <td style="font-family: var(--font-mono);">Rp ${Number(item.price).toLocaleString('id-ID')}</td>
                <td>${item.quantity}</td>
                <td style="font-family: var(--font-mono);">Rp ${Number(item.price * item.quantity).toLocaleString('id-ID')}</td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>
      </div>

      <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-secondary);">Event History & State Machine Audit</h4>
      <div class="timeline">
        ${events.length === 0
        ? '<p style="color: var(--text-muted);">No events recorded</p>'
        : events
          .map(
            (ev) => `
              <div class="timeline-item">
                <div class="timeline-title">${ev.event_type}</div>
                <div class="timeline-meta">${new Date(ev.created_at).toLocaleString()}</div>
                <pre style="margin-top: 0.35rem; font-size: 0.75rem; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; overflow-x: auto;">${escapeHtml(
              typeof ev.payload === 'string' ? ev.payload : JSON.stringify(ev.payload, null, 2)
            )}</pre>
              </div>
            `
          )
          .join('')
      }
      </div>
    `;
  } catch (err) {
    modalContent.innerHTML = `<p style="color: var(--accent-danger);">Failed to inspect order: ${err.message}</p>`;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

export default renderOrders;
