import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/api.js', () => ({
  default: { getHealthReady: vi.fn() }
}));

import api from '../src/api.js';
import renderNavbar from '../src/components/navbar.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Navbar component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<header id="header-container"></header>';
    vi.clearAllMocks();
  });

  it('merender 3 link dan menandai link aktif', async () => {
    api.getHealthReady.mockResolvedValue({ status: 'READY' });
    renderNavbar('#/orders');
    await flush();
    const links = document.querySelectorAll('.nav-link');
    expect(links).toHaveLength(3);
    expect(document.querySelector('.nav-link.active').getAttribute('href')).toBe('#/orders');
  });

  it('menampilkan System Healthy saat status READY', async () => {
    api.getHealthReady.mockResolvedValue({ status: 'READY' });
    renderNavbar();
    await flush();
    expect(document.getElementById('nav-status-text').textContent).toBe('System Healthy');
  });

  it('menampilkan Degraded saat status bukan READY', async () => {
    api.getHealthReady.mockResolvedValue({ status: 'DOWN' });
    renderNavbar();
    await flush();
    expect(document.getElementById('nav-status-text').textContent).toBe('Degraded');
    expect(document.querySelector('.status-dot').className).toContain('down');
  });

  it('menampilkan Offline saat API gagal', async () => {
    api.getHealthReady.mockRejectedValue(new Error('network'));
    renderNavbar();
    await flush();
    expect(document.getElementById('nav-status-text').textContent).toBe('Offline');
  });

  it('tidak error bila container header tidak ada', () => {
    document.body.innerHTML = '';
    expect(() => renderNavbar()).not.toThrow();
  });
});
