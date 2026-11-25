import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/api.js', () => ({
  default: {
    triggerCpuStress: vi.fn(),
    triggerMemoryLeak: vi.fn(),
    triggerCrash: vi.fn()
  }
}));
vi.mock('../src/components/toast.js', () => ({ default: vi.fn() }));

import api from '../src/api.js';
import showToast from '../src/components/toast.js';
import renderDiagnostics from '../src/pages/diagnostics.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Diagnostics page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<main id="main-content"></main>';
    renderDiagnostics(document.getElementById('main-content'));
  });

  it('merender semua tombol chaos', () => {
    expect(document.getElementById('btn-trigger-cpu')).not.toBeNull();
    expect(document.getElementById('btn-trigger-mem')).not.toBeNull();
    expect(document.getElementById('btn-trigger-crash')).not.toBeNull();
  });

  it('CPU stress: memanggil API dengan durasi dari input dan mencatat hasil', async () => {
    api.triggerCpuStress.mockResolvedValue({ iterations: 99 });
    document.getElementById('cpu-duration-input').value = '1500';
    document.getElementById('btn-trigger-cpu').click();
    await flush();
    expect(api.triggerCpuStress).toHaveBeenCalledWith(1500);
    expect(document.getElementById('diag-output').textContent).toContain('CPU_STRESS');
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('CPU Stress completed'), 'success');
    expect(document.getElementById('btn-trigger-cpu').disabled).toBe(false);
  });

  it('CPU stress: menampilkan error bila API gagal', async () => {
    api.triggerCpuStress.mockRejectedValue(new Error('gagal'));
    document.getElementById('btn-trigger-cpu').click();
    await flush();
    expect(document.getElementById('diag-output').textContent).toContain('CPU_STRESS_ERROR');
    expect(showToast).toHaveBeenCalledWith('CPU Stress failed: gagal', 'error');
  });

  it('memory leak: memanggil API dengan ukuran dari input', async () => {
    api.triggerMemoryLeak.mockResolvedValue({ heapUsedMb: 120 });
    document.getElementById('mem-size-input').value = '70';
    document.getElementById('btn-trigger-mem').click();
    await flush();
    expect(api.triggerMemoryLeak).toHaveBeenCalledWith(70);
    expect(document.getElementById('diag-output').textContent).toContain('MEMORY_LEAK');
  });

  it('memory leak: menampilkan error bila API gagal', async () => {
    api.triggerMemoryLeak.mockRejectedValue(new Error('oom'));
    document.getElementById('btn-trigger-mem').click();
    await flush();
    expect(showToast).toHaveBeenCalledWith('Memory leak failed: oom', 'error');
  });

  it('crash: dibatalkan bila user menolak konfirmasi', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    document.getElementById('btn-trigger-crash').click();
    await flush();
    expect(api.triggerCrash).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('crash: memanggil API bila user menyetujui', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    api.triggerCrash.mockResolvedValue({ message: 'bye' });
    document.getElementById('btn-trigger-crash').click();
    await flush();
    expect(api.triggerCrash).toHaveBeenCalled();
    expect(document.getElementById('diag-output').textContent).toContain('PROCESS_CRASH');
    vi.unstubAllGlobals();
  });

  it('crash: server yang langsung mati tetap dicatat sebagai respons', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    api.triggerCrash.mockRejectedValue(new Error('socket hang up'));
    document.getElementById('btn-trigger-crash').click();
    await flush();
    expect(document.getElementById('diag-output').textContent).toContain('CRASH_RESPONSE');
    vi.unstubAllGlobals();
  });
});
