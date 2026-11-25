import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import showToast from '../src/components/toast.js';

describe('Toast component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="toast-container"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('menampilkan toast dengan tipe yang diminta', () => {
    showToast('Halo', 'success');
    const toast = document.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast.className).toContain('toast-success');
    expect(toast.textContent).toContain('Halo');
  });

  it('meng-escape HTML agar tidak terjadi XSS', () => {
    showToast('<img src=x onerror=alert(1)>');
    expect(document.querySelector('.toast img')).toBeNull();
    expect(document.querySelector('.toast').textContent).toContain('<img');
  });

  it('menghapus toast setelah durasi habis', () => {
    showToast('Sementara', 'info', 1000);
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.toast')).toBeNull();
  });

  it('tidak error bila container tidak ada', () => {
    document.body.innerHTML = '';
    expect(() => showToast('x')).not.toThrow();
  });
});
