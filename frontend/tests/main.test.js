import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/components/navbar.js', () => ({ default: vi.fn() }));
vi.mock('../src/pages/dashboard.js', () => ({ default: vi.fn() }));
vi.mock('../src/pages/orders.js', () => ({ default: vi.fn() }));
vi.mock('../src/pages/diagnostics.js', () => ({ default: vi.fn() }));

import renderNavbar from '../src/components/navbar.js';
import renderDashboard from '../src/pages/dashboard.js';
import renderOrders from '../src/pages/orders.js';
import renderDiagnostics from '../src/pages/diagnostics.js';

describe('Router (main.js)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '<main id="main-content"></main>';
    await import('../src/main.js');
  });

  it('merender dashboard untuk rute #/', () => {
    window.location.hash = '#/';
    window.dispatchEvent(new Event('hashchange'));
    expect(renderNavbar).toHaveBeenCalledWith('#/');
    expect(renderDashboard).toHaveBeenCalled();
  });

  it('merender halaman orders untuk rute #/orders', () => {
    window.location.hash = '#/orders';
    window.dispatchEvent(new Event('hashchange'));
    expect(renderOrders).toHaveBeenCalled();
  });

  it('merender halaman diagnostics untuk rute #/diagnostics', () => {
    window.location.hash = '#/diagnostics';
    window.dispatchEvent(new Event('hashchange'));
    expect(renderDiagnostics).toHaveBeenCalled();
  });

  it('rute tidak dikenal kembali ke dashboard', () => {
    window.location.hash = '#/tidak-ada';
    window.dispatchEvent(new Event('hashchange'));
    expect(renderDashboard).toHaveBeenCalled();
  });

  it('tidak melakukan apa pun bila #main-content tidak ada', () => {
    document.body.innerHTML = '';
    window.location.hash = '#/orders';
    window.dispatchEvent(new Event('hashchange'));
    expect(renderOrders).not.toHaveBeenCalled();
  });
});
