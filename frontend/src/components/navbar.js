import api from '../api.js';

export function renderNavbar(currentPath = '#/') {
  const container = document.getElementById('header-container');
  if (!container) return;

  const links = [
    { href: '#/', label: 'Dashboard' },
    { href: '#/orders', label: 'Orders' },
    { href: '#/diagnostics', label: 'Chaos & SRE' }
  ];

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-container">
        <a href="#/" class="navbar-brand">
          <span class="brand-badge">DevOps</span>
          <span>Order Engine</span>
        </a>
        <ul class="nav-links">
          ${links
            .map(
              (link) => `
            <li>
              <a href="${link.href}" class="nav-link ${currentPath === link.href ? 'active' : ''}">
                ${link.label}
              </a>
            </li>
          `
            )
            .join('')}
        </ul>
        <div id="nav-status-indicator" class="nav-status">
          <div class="status-dot"></div>
          <span id="nav-status-text">Checking...</span>
        </div>
      </div>
    </nav>
  `;

  // Periodically check readiness status
  updateReadinessBadge();
}

async function updateReadinessBadge() {
  const badge = document.getElementById('nav-status-indicator');
  const text = document.getElementById('nav-status-text');
  const dot = badge?.querySelector('.status-dot');

  if (!badge || !text || !dot) return;

  try {
    const res = await api.getHealthReady();
    if (res.status === 'READY') {
      text.textContent = 'System Healthy';
      dot.className = 'status-dot';
      badge.style.color = 'var(--accent-success)';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.25)';
    } else {
      text.textContent = 'Degraded';
      dot.className = 'status-dot down';
      badge.style.color = 'var(--accent-danger)';
      badge.style.borderColor = 'rgba(239, 68, 68, 0.25)';
    }
  } catch {
    text.textContent = 'Offline';
    dot.className = 'status-dot down';
    badge.style.color = 'var(--accent-danger)';
    badge.style.borderColor = 'rgba(239, 68, 68, 0.25)';
  }
}

export default renderNavbar;
