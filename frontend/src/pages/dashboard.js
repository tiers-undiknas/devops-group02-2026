import api from '../api.js';
import showToast from '../components/toast.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Operations Dashboard</h1>
        <p class="page-subtitle">Real-time status of the Order Processing Engine & Dependencies</p>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <button id="btn-refresh-health" class="btn btn-outline">
          Refresh System Status
        </button>

        <button id="btn-quick-order" class="btn btn-primary">
          + Create Sample Order
        </button>
      </div>
    </div>

    <!-- Telemetry Cards -->
    <div class="grid-4" id="stats-grid">
      <div class="card stat-card">
        <span class="stat-label">Total Orders</span>
        <span class="stat-value" id="stat-total">-</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Pending</span>
        <span class="stat-value" style="color: var(--accent-warning)" id="stat-pending">-</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Confirmed</span>
        <span class="stat-value" style="color: var(--accent-success)" id="stat-confirmed">-</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">Failed</span>
        <span class="stat-value" style="color: var(--accent-danger)" id="stat-failed">-</span>
      </div>
    </div>

    <!-- Dependencies & Live Health -->
    <div class="grid-2">
      <div class="card">
        <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Infrastructure Dependencies</h3>
        <div id="infra-health-content">
          <p style="color: var(--text-muted);">Fetching readiness status...</p>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Process Runtime Telemetry</h3>
        <div id="live-health-content">
          <p style="color: var(--text-muted);">Fetching liveness telemetry...</p>
        </div>
      </div>
    </div>

    <!-- Recent Orders Table -->
    <div class="card" style="margin-top: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3 style="font-size: 1.1rem;">Recent Orders</h3>
        <a href="#/orders" class="btn btn-outline btn-sm">View All Orders &rarr;</a>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody id="recent-orders-tbody">
            <tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Loading orders...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach refresh health button
  const refreshHealthBtn =
  document.getElementById('btn-refresh-health');

  refreshHealthBtn?.addEventListener('click', async () => {
    await loadDashboardData();

    showToast(
      'System status refreshed successfully',
      'success'
    );
  });

  // Attach quick sample order button
  const quickOrderBtn = document.getElementById('btn-quick-order');
  quickOrderBtn?.addEventListener('click', async () => {
    quickOrderBtn.disabled = true;
    quickOrderBtn.textContent = 'Submitting...';
    try {
      const sampleNames = ['Alice Johnson', 'Bob Smith', 'Charlie DevOps', 'Daniella Vance'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const sampleEmail = `${randomName.toLowerCase().replace(/\s+/g, '.')}@example.com`;

      await api.createOrder({
        customer_name: randomName,
        customer_email: sampleEmail,
        items: [
          { sku: 'CLOUD-SRV-01', name: 'Virtual Compute Node', price: 150000, quantity: 2 },
          { sku: 'LB-PREM-02', name: 'Managed Load Balancer', price: 50000, quantity: 1 }
        ]
      });

      showToast(`Sample order created for ${randomName}!`, 'success');
      loadDashboardData();
    } catch (err) {
      showToast(`Failed to create order: ${err.message}`, 'error');
    } finally {
      quickOrderBtn.disabled = false;
      quickOrderBtn.textContent = '+ Create Sample Order';
    }
  });

  loadDashboardData();
}

async function loadDashboardData() {
  // 1. Fetch Orders List to compute stats
  try {
    const ordersRes = await api.listOrders({ limit: 100 });
    const orders = ordersRes.data || [];

    const total = ordersRes.pagination?.total || orders.length;
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const failed = orders.filter((o) => o.status === 'failed').length;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('stat-total', total);
    setVal('stat-pending', pending);
    setVal('stat-confirmed', confirmed);
    setVal('stat-failed', failed);

    // Populate recent orders table
    const tbody = document.getElementById('recent-orders-tbody');
    if (tbody) {
      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No orders recorded yet. Click "+ Create Sample Order" above.</td></tr>`;
      } else {
        tbody.innerHTML = orders
          .slice(0, 5)
          .map(
            (o) => `
          <tr>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">${o.id.substring(0, 8)}...</td>
            <td>
              <div style="font-weight: 500;">${escapeHtml(o.customer_name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(o.customer_email)}</div>
            </td>
            <td style="font-family: var(--font-mono);">Rp ${Number(o.total_amount).toLocaleString('id-ID')}</td>
            <td><span class="badge badge-${o.status}">${o.status}</span></td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(o.created_at).toLocaleTimeString()}</td>
          </tr>
        `
          )
          .join('');
      }
    }
  } catch (err) {
    console.error('Failed to load orders', err);
  }

  // 2. Fetch Readiness Dependencies
  try {
    const readyRes = await api.getHealthReady();
    const container = document.getElementById('infra-health-content');
    if (container) {
      const db = readyRes.dependencies?.database || {};
      const redis = readyRes.dependencies?.redis || {};

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 600;">PostgreSQL Connection Pool</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Latency: ${db.latencyMs ?? '-'} ms</div>
            </div>
            <span class="badge ${db.status === 'UP' ? 'badge-confirmed' : 'badge-failed'}">${db.status || 'UNKNOWN'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm);">
            <div>
              <div style="font-weight: 600;">Redis Broker / Queue</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Latency: ${redis.latencyMs ?? '-'} ms</div>
            </div>
            <span class="badge ${redis.status === 'UP' ? 'badge-confirmed' : 'badge-failed'}">${redis.status || 'UNKNOWN'}</span>
          </div>
        </div>
      `;
    }
  } catch (err) {
    const container = document.getElementById('infra-health-content');
    if (container) {
      container.innerHTML = `<p style="color: var(--accent-danger);">Readiness check unreachable (${err.message})</p>`;
    }
  }

  // 3. Fetch Liveness & Process Info
  try {
    const liveRes = await api.getHealthLive();
    const container = document.getElementById('live-health-content');
    if (container) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-secondary);">Node Process PID</span>
            <span style="font-family: var(--font-mono);">${liveRes.pid}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: var(--text-secondary);">Process Uptime</span>
            <span style="font-family: var(--font-mono);">${liveRes.uptimeSeconds} seconds</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
            <span style="color: var(--text-secondary);">V8 Heap Memory Used</span>
            <span style="font-family: var(--font-mono);">${liveRes.memory?.heapUsedMb} MB</span>
          </div>
        </div>
      `;
    }
  } catch (err) {
    const container = document.getElementById('live-health-content');
    if (container) {
      container.innerHTML = `<p style="color: var(--accent-danger);">Liveness check unreachable (${err.message})</p>`;
    }
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

export default renderDashboard;
