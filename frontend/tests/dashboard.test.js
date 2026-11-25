import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/api.js', () => ({
  default: {
    listOrders: vi.fn(),
    getHealthReady: vi.fn(),
    getHealthLive: vi.fn(),
    createOrder: vi.fn()
  }
}));
vi.mock('../src/components/toast.js', () => ({ default: vi.fn() }));

import api from '../src/api.js';
import showToast from '../src/components/toast.js';
import renderDashboard from '../src/pages/dashboard.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

const orders = [
  { id: 'aaaaaaaa-1', customer_name: 'Alice', customer_email: 'a@x.com', total_amount: 1000, status: 'confirmed', created_at: '2026-01-01T00:00:00Z' },
  { id: 'bbbbbbbb-2', customer_name: 'Bob', customer_email: 'b@x.com', total_amount: 2000, status: 'pending', created_at: '2026-01-01T00:00:00Z' },
  { id: 'cccccccc-3', customer_name: 'Eve', customer_email: 'e@x.com', total_amount: 3000, status: 'failed', created_at: '2026-01-01T00:00:00Z' }
];

describe('Dashboard page', () => {
  let container;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<main id="main-content"></main>';
    container = document.getElementById('main-content');
    api.listOrders.mockResolvedValue({ data: orders, pagination: { total: 3 } });
    api.getHealthReady.mockResolvedValue({
      dependencies: { database: { status: 'UP', latencyMs: 2 }, redis: { status: 'DOWN', latencyMs: 5 } }
    });
    api.getHealthLive.mockResolvedValue({ pid: 42, uptimeSeconds: 10, memory: { heapUsedMb: 30 } });
  });

  it('menghitung statistik dan mengisi tabel order', async () => {
    await renderDashboard(container);
    await flush();
    expect(document.getElementById('stat-total').textContent).toBe('3');
    expect(document.getElementById('stat-pending').textContent).toBe('1');
    expect(document.getElementById('stat-confirmed').textContent).toBe('1');
    expect(document.getElementById('stat-failed').textContent).toBe('1');
    expect(document.querySelectorAll('#recent-orders-tbody tr')).toHaveLength(3);
  });

  it('menampilkan pesan kosong bila belum ada order', async () => {
    api.listOrders.mockResolvedValue({ data: [] });
    await renderDashboard(container);
    await flush();
    expect(document.getElementById('recent-orders-tbody').textContent).toContain('No orders recorded yet');
  });

  it('menampilkan status dependensi dan telemetri proses', async () => {
    await renderDashboard(container);
    await flush();
    expect(document.getElementById('infra-health-content').textContent).toContain('UP');
    expect(document.getElementById('infra-health-content').textContent).toContain('DOWN');
    expect(document.getElementById('live-health-content').textContent).toContain('42');
  });

  it('menampilkan pesan error saat health check gagal', async () => {
    api.getHealthReady.mockRejectedValue(new Error('boom'));
    api.getHealthLive.mockRejectedValue(new Error('boom'));
    await renderDashboard(container);
    await flush();
    expect(document.getElementById('infra-health-content').textContent).toContain('unreachable');
    expect(document.getElementById('live-health-content').textContent).toContain('unreachable');
  });

  it('tidak crash saat daftar order gagal dimuat', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.listOrders.mockRejectedValue(new Error('fail'));
    await renderDashboard(container);
    await flush();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('tombol refresh memuat ulang data dan menampilkan toast', async () => {
    await renderDashboard(container);
    await flush();
    document.getElementById('btn-refresh-health').click();
    await flush();
    expect(api.listOrders).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith('System status refreshed successfully', 'success');
  });

  it('tombol sample order membuat order dan menampilkan toast sukses', async () => {
    api.createOrder.mockResolvedValue({});
    await renderDashboard(container);
    await flush();
    document.getElementById('btn-quick-order').click();
    await flush();
    expect(api.createOrder).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Sample order created'), 'success');
    expect(document.getElementById('btn-quick-order').disabled).toBe(false);
  });

  it('menampilkan toast error bila pembuatan sample order gagal', async () => {
    api.createOrder.mockRejectedValue(new Error('ditolak'));
    await renderDashboard(container);
    await flush();
    document.getElementById('btn-quick-order').click();
    await flush();
    expect(showToast).toHaveBeenCalledWith('Failed to create order: ditolak', 'error');
  });
});
