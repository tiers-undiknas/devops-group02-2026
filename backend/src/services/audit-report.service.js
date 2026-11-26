// Modul sementara untuk simulasi coverage SC-05.
const knownStatuses = new Set(['pending', 'processing', 'confirmed', 'failed']);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validNumber(value) {
  return (typeof value === 'number' || hasText(value)) && Number.isFinite(Number(value));
}

function isPresent(value) {
  return value !== null && value !== undefined;
}

function validTime(value) {
  return hasText(value) && Number.isFinite(Date.parse(value));
}

const orderRules = [
  {
    code: 'missing-order-id',
    severity: 'error',
    message: 'Pesanan belum memiliki ID.',
    matches(order) {
      return !hasText(order.id);
    }
  },
  {
    code: 'unknown-order-status',
    severity: 'error',
    message: 'Status pesanan tidak dikenali.',
    matches(order) {
      return !knownStatuses.has(order.status);
    }
  },
  {
    code: 'missing-customer-name',
    severity: 'warning',
    message: 'Nama pelanggan belum terisi.',
    matches(order) {
      return !hasText(order.customer_name);
    }
  },
  {
    code: 'missing-customer-email',
    severity: 'warning',
    message: 'Alamat surel pelanggan belum terisi.',
    matches(order) {
      return !hasText(order.customer_email);
    }
  },
  {
    code: 'missing-created-at',
    severity: 'warning',
    message: 'Waktu pembuatan pesanan belum terisi.',
    matches(order) {
      return !isPresent(order.created_at);
    }
  },
  {
    code: 'invalid-created-at',
    severity: 'error',
    message: 'Waktu pembuatan pesanan tidak valid.',
    matches(order) {
      return isPresent(order.created_at) && !validTime(order.created_at);
    }
  },
  {
    code: 'invalid-updated-at',
    severity: 'error',
    message: 'Waktu pembaruan pesanan tidak valid.',
    matches(order) {
      return isPresent(order.updated_at) && !validTime(order.updated_at);
    }
  },
  {
    code: 'updated-before-created',
    severity: 'error',
    message: 'Waktu pembaruan mendahului pembuatan pesanan.',
    matches(order) {
      return validTime(order.updated_at) && validTime(order.created_at) && Date.parse(order.updated_at) < Date.parse(order.created_at);
    }
  },
  {
    code: 'invalid-total',
    severity: 'error',
    message: 'Total pesanan tidak dapat dibaca sebagai angka.',
    matches(order) {
      return !validNumber(order.total_amount);
    }
  },
  {
    code: 'negative-total',
    severity: 'error',
    message: 'Total pesanan bernilai negatif.',
    matches(order) {
      return validNumber(order.total_amount) && Number(order.total_amount) < 0;
    }
  },
  {
    code: 'missing-failure-reason',
    severity: 'warning',
    message: 'Pesanan gagal tanpa alasan yang tercatat.',
    matches(order) {
      return order.status === 'failed' && !hasText(order.failure_reason);
    }
  },
  {
    code: 'unexpected-failure-reason',
    severity: 'warning',
    message: 'Pesanan berhasil masih memuat alasan kegagalan.',
    matches(order) {
      return order.status === 'confirmed' && hasText(order.failure_reason);
    }
  },
  {
    code: 'missing-items',
    severity: 'error',
    message: 'Rincian barang belum tersedia.',
    matches(order) {
      return !Array.isArray(order.items?.line_items);
    }
  },
  {
    code: 'empty-items',
    severity: 'error',
    message: 'Daftar barang pada pesanan kosong.',
    matches(order) {
      return Array.isArray(order.items?.line_items) && order.items.line_items.length === 0;
    }
  },
  {
    code: 'missing-breakdown',
    severity: 'warning',
    message: 'Rincian perhitungan total belum tersedia.',
    matches(order) {
      return !isRecord(order.items?.breakdown);
    }
  }
];

const itemRules = [
  {
    code: 'missing-sku',
    severity: 'error',
    message: 'Barang tidak memiliki SKU.',
    matches(item) {
      return !hasText(item.sku);
    }
  },
  {
    code: 'missing-item-name',
    severity: 'warning',
    message: 'Nama barang belum terisi.',
    matches(item) {
      return !hasText(item.name);
    }
  },
  {
    code: 'invalid-price',
    severity: 'error',
    message: 'Harga satuan tidak dapat dibaca sebagai angka.',
    matches(item) {
      return !validNumber(item.price);
    }
  },
  {
    code: 'nonpositive-price',
    severity: 'error',
    message: 'Harga satuan harus positif.',
    matches(item) {
      return validNumber(item.price) && Number(item.price) <= 0;
    }
  },
  {
    code: 'invalid-quantity',
    severity: 'error',
    message: 'Jumlah barang tidak dapat dibaca sebagai angka.',
    matches(item) {
      return !validNumber(item.quantity);
    }
  },
  {
    code: 'fractional-quantity',
    severity: 'error',
    message: 'Jumlah barang harus berupa bilangan bulat.',
    matches(item) {
      return validNumber(item.quantity) && !Number.isInteger(Number(item.quantity));
    }
  },
  {
    code: 'nonpositive-quantity',
    severity: 'error',
    message: 'Jumlah barang harus positif.',
    matches(item) {
      return validNumber(item.quantity) && Number(item.quantity) <= 0;
    }
  }
];

const breakdownRules = [
  {
    code: 'invalid-subtotal',
    severity: 'error',
    message: 'Subtotal tidak dapat dibaca sebagai angka.',
    matches(breakdown) {
      return !validNumber(breakdown.subtotal);
    }
  },
  {
    code: 'negative-subtotal',
    severity: 'error',
    message: 'Subtotal bernilai negatif.',
    matches(breakdown) {
      return validNumber(breakdown.subtotal) && Number(breakdown.subtotal) < 0;
    }
  },
  {
    code: 'invalid-tax',
    severity: 'error',
    message: 'Nilai pajak tidak dapat dibaca sebagai angka.',
    matches(breakdown) {
      return !validNumber(breakdown.tax);
    }
  },
  {
    code: 'negative-tax',
    severity: 'error',
    message: 'Nilai pajak bernilai negatif.',
    matches(breakdown) {
      return validNumber(breakdown.tax) && Number(breakdown.tax) < 0;
    }
  },
  {
    code: 'invalid-tax-rate',
    severity: 'error',
    message: 'Tarif pajak tidak dapat dibaca sebagai angka.',
    matches(breakdown) {
      return !validNumber(breakdown.tax_rate);
    }
  },
  {
    code: 'negative-tax-rate',
    severity: 'error',
    message: 'Tarif pajak bernilai negatif.',
    matches(breakdown) {
      return validNumber(breakdown.tax_rate) && Number(breakdown.tax_rate) < 0;
    }
  }
];

const eventRules = [
  {
    code: 'missing-event-type',
    severity: 'error',
    message: 'Jenis peristiwa belum terisi.',
    matches(event) {
      return !hasText(event.event_type);
    }
  },
  {
    code: 'missing-event-order',
    severity: 'warning',
    message: 'Peristiwa tidak mencantumkan ID pesanan.',
    matches(event) {
      return !hasText(event.order_id);
    }
  },
  {
    code: 'missing-event-time',
    severity: 'warning',
    message: 'Waktu peristiwa belum terisi.',
    matches(event) {
      return !isPresent(event.created_at);
    }
  },
  {
    code: 'invalid-event-time',
    severity: 'error',
    message: 'Waktu peristiwa tidak valid.',
    matches(event) {
      return isPresent(event.created_at) && !validTime(event.created_at);
    }
  }
];

function collectFindings(rules, record, location, findings) {
  for (const rule of rules) {
    if (rule.matches(record)) {
      findings.push({
        location,
        code: rule.code,
        severity: rule.severity,
        message: rule.message
      });
    }
  }
}

function auditList(records, rules, field, findings) {
  records.forEach((record, index) => {
    const location = field + '[' + index + ']';
    if (isRecord(record)) {
      collectFindings(rules, record, location, findings);
    } else {
      findings.push({
        location,
        code: 'invalid-record',
        severity: 'error',
        message: 'Entri harus berupa objek.'
      });
    }
  });
}

function reconcileAmounts(order, breakdown, findings) {
  if (![order.total_amount, breakdown.subtotal, breakdown.tax].every(validNumber)) {
    return;
  }
  const expected = Math.round((Number(breakdown.subtotal) + Number(breakdown.tax)) * 100);
  const actual = Math.round(Number(order.total_amount) * 100);
  if (actual !== expected) {
    findings.push({
      location: 'total_amount',
      code: 'total-mismatch',
      severity: 'error',
      message: 'Total pesanan berbeda dari jumlah subtotal dan pajak.'
    });
  }
}

function checkOrderEvents(order, findings) {
  for (const [index, event] of order.events.entries()) {
    if (!isRecord(event)) {
      continue;
    }
    const location = 'events[' + index + ']';
    if (hasText(order.id) && hasText(event.order_id) && order.id !== event.order_id) {
      findings.push({
        location,
        code: 'event-order-mismatch',
        severity: 'error',
        message: 'Peristiwa merujuk ke pesanan lain.'
      });
    }
    if (validTime(event.created_at) && validTime(order.created_at)
        && Date.parse(event.created_at) < Date.parse(order.created_at)) {
      findings.push({
        location,
        code: 'event-before-order',
        severity: 'warning',
        message: 'Waktu peristiwa mendahului pembuatan pesanan.'
      });
    }
  }
}

export function auditOrder(order) {
  if (!isRecord(order)) {
    throw new TypeError('Data pesanan harus berupa objek.');
  }

  const findings = [];
  collectFindings(orderRules, order, 'order', findings);
  if (Array.isArray(order.items?.line_items)) {
    auditList(order.items.line_items, itemRules, 'items.line_items', findings);
  }

  const breakdown = order.items?.breakdown;
  if (isRecord(breakdown)) {
    collectFindings(breakdownRules, breakdown, 'items.breakdown', findings);
    reconcileAmounts(order, breakdown, findings);
  }

  if (Array.isArray(order.events)) {
    auditList(order.events, eventRules, 'events', findings);
    checkOrderEvents(order, findings);
  }

  return {
    orderId: order.id ?? null,
    errorCount: findings.filter(finding => finding.severity === 'error').length,
    warningCount: findings.filter(finding => finding.severity === 'warning').length,
    findings
  };
}

export function buildAuditReport(orders) {
  if (!Array.isArray(orders)) {
    throw new TypeError('Daftar pesanan harus berupa array.');
  }

  const reports = orders.map(auditOrder);
  return {
    ordersReviewed: reports.length,
    ordersWithFindings: reports.filter(report => report.findings.length > 0).length,
    totalErrors: reports.reduce((sum, report) => sum + report.errorCount, 0),
    totalWarnings: reports.reduce((sum, report) => sum + report.warningCount, 0),
    reports
  };
}
