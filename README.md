# Order Processing Engine (DevOps Seed Project)

[![Node.js](https://img.shields.io/badge/Node.js-v24_LTS-green.svg)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tier_%26_Multi--Process-blue.svg)](#architecture)
[![CI](https://github.com/tiers-undiknas/devops-group02-2026/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/tiers-undiknas/devops-group02-2026/actions/workflows/ci.yml)
[![Backend Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2FbliDedok%2Fc417a22bd35409b7bdfa52c5c622c80b%2Fraw%2Fcoverage.json)](https://gist.github.com/bliDedok/c417a22bd35409b7bdfa52c5c622c80b)
[![Observability](https://img.shields.io/badge/Observability-Prometheus_%2B_Pino-orange.svg)](#observability--metrics)

**Order Processing Engine** adalah aplikasi acuan (_Seed Project_) berstandar _production-grade_ untuk praktikum mata kuliah DevOps (Semester 5). Aplikasi ini dirancang sebagai target nyata untuk rekayasa infrastruktur, kontainerisasi, automasi CI/CD, DevSecOps, Infrastructure as Code (IaC), dan Observabilitas modern.

Aplikasi ini menggunakan arsitektur **Multi-Tier & Multi-Process** dengan pemisahan tegas antara **Frontend SPA Dashboard** dan **Backend API & Background Worker**.

---

## 1. Arsitektur Sistem

```
                              ┌────────────────────────┐
                              │  Frontend Dashboard    │
                              │  (Vite SPA, Port 5173) │
                              └───────────┬────────────┘
                                          │ HTTP / JSON
                                          ▼
                              ┌────────────────────────┐
                              │    Backend API Server  │
                              │  (Express, Port 3000)  │
                              └─────┬────────────┬─────┘
                                    │            │
                     Jobs Enqueued  │            │ Relational Data
                     (BullMQ)       │            │
                                    ▼            ▼
                           ┌─────────────┐  ┌──────────────┐
                           │    Redis    │  │  PostgreSQL  │
                           │  (Port 6379)│  │ (Port 5432)  │
                           └──────┬──────┘  └──────┬───────┘
                                  │                │
                        Job Deq.  │                │ State Updates
                                  ▼                │
                           ┌─────────────┐         │
                           │ Background  │─────────┘
                           │   Worker    │
                           │ (Proc 2)    │
                           └─────────────┘
```

### Komponen & Multi-Process Model

1. **Frontend Tier (`frontend/`)**:
   - Single Page Application (SPA) berbasis Vanilla JavaScript dan Vite.
   - Menyediakan dashboard operasional, formulir transaksi pemesanan, inspeksi _audit trail_ event, serta _Chaos & SRE Console_.
   - Port default: `5173` (dilengkapi _reverse-proxy_ ke backend).

2. **Backend API Server (`backend/src/server.js`)**:
   - Proses HTTP berbasis Node.js LTS v24 dan Express.
   - Menangani validasi payload (Joi), _idempotent database transactions_, structured JSON logging dengan `x-request-id` (`pino` & `pino-http`), serta mengekspor metrik Prometheus.
   - Port default: `3000`.

3. **Background Worker (`backend/src/worker.js`)**:
   - Proses terpisah (_standalone background consumer_) berbasis BullMQ.
   - Mengambil pekerjaan dari Redis, mengeksekusi pemrosesan pembayaran & validasi inventaris, memperbarui status pesanan, dan mencatat _audit trail_ ke PostgreSQL.

4. **PostgreSQL 16+**:
   - Menyimpan entitas relasional tabel `orders` dan riwayat status tabel `order_events`.

5. **Redis 7+**:
   - Berfungsi sebagai antrean pesan (_message broker_) persisten untuk BullMQ.

---

## 2. Struktur Direktori Monorepo

```
seed-project-devops/
├── .env.example                        # Template environment variables
├── .gitignore                          # Standard git ignore rules
├── package.json                        # Root orchestrator scripts
├── README.md                           # Dokumentasi teknis lengkap
│
├── backend/                            # Backend Service (API + Worker)
│   ├── package.json                    # Backend dependencies & scripts
│   ├── vitest.config.js                # Konfigurasi pengujian & target coverage (≥75%)
│   ├── src/
│   │   ├── app.js                      # Express App factory
│   │   ├── server.js                   # Entry point HTTP API Server
│   │   ├── worker.js                   # Entry point BullMQ Background Worker
│   │   ├── config/                     # Konfigurasi berbasis 12-Factor App
│   │   │   └── index.js
│   │   ├── db/                         # PostgreSQL Migrations & Runner
│   │   │   ├── migrate.js
│   │   │   └── migrations/
│   │   │       ├── 001_create_orders_table.sql
│   │   │       └── 002_create_order_events_table.sql
│   │   ├── infra/                      # Driver & Connection Pools
│   │   │   ├── database.js             # pg.Pool & health probe
│   │   │   ├── redis.js                # ioredis client & health probe
│   │   │   ├── queue.js                # BullMQ queue & worker factory
│   │   │   └── logger.js               # Pino structured JSON logger
│   │   ├── middleware/                 # Middleware Express
│   │   │   ├── request-id.js           # X-Request-ID & pino-http tracing
│   │   │   ├── metrics.middleware.js   # HTTP request duration histogram
│   │   │   └── error-handler.js        # Centralized structured error handler
│   │   ├── routes/                     # Router API
│   │   │   ├── health.routes.js        # /healthz/live & /healthz/ready
│   │   │   ├── diagnostics.routes.js   # /api/v1/diagnostics (Chaos)
│   │   │   └── order.routes.js         # /api/v1/orders
│   │   ├── services/                   # Lapisan Logika Bisnis
│   │   │   ├── order.service.js        # Validasi, kalkulasi tax 11%, CRUD DB
│   │   │   └── order-processor.service.js # Pemrosesan background job & state transitions
│   │   └── telemetry/                  # Instrumentasi Prometheus
│   │       └── metrics.js              # Custom Histograms, Counters, & Gauges
│   └── tests/                          # Test Suites (≥75% coverage)
│       ├── helpers/
│       │   └── mocks.js
│       ├── unit/
│       │   ├── config.test.js
│       │   ├── order.service.test.js
│       │   └── order-processor.service.test.js
│       └── integration/
│           ├── health.api.test.js
│           ├── diagnostics.api.test.js
│           └── orders.api.test.js
│
└── frontend/                           # Frontend Service (Vite SPA)
    ├── package.json                    # Frontend dependencies & scripts
    ├── vite.config.js                  # Konfigurasi Vite & Dev API Proxy
    ├── index.html                      # Single page entry point
    ├── src/
    │   ├── main.js                     # Client-side routing
    │   ├── style.css                   # Dark theme design system
    │   ├── api.js                      # REST API client
    │   ├── components/                 # UI components
    │   │   ├── navbar.js
    │   │   └── toast.js
    │   └── pages/                      # Page views
    │       ├── dashboard.js            # Telemetry & status dashboard
    │       ├── orders.js               # Order creation & audit timeline
    │       └── diagnostics.js          # SRE Chaos engineering panel
    └── tests/
        └── api.test.js                 # Frontend API client tests
```

---

## 3. Prasyarat Sistem

- **Node.js**: LTS v24.x atau lebih baru (`node --version`)
- **NPM**: v10.x atau lebih baru (`npm --version`)
- **PostgreSQL**: v16+ (lokal atau remote instance)
- **Redis**: v7+ (lokal atau remote instance)

---

## 4. Panduan Menjalankan Aplikasi

### Langkah 1: Instalasi Dependensi

Jalankan perintah ini di direktori root untuk menginstal dependensi backend dan frontend:

```bash
npm run install:all
```

### Langkah 2: Konfigurasi Variabel Lingkungan

Salin template `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Sesuaikan konfigurasi koneksi PostgreSQL dan Redis jika diperlukan:

```env
DATABASE_URL=postgresql://devops_user:devops_pass@localhost:5432/order_processing
REDIS_URL=redis://localhost:6379
```

### Langkah 3: Menjalankan Migrasi Database

Jalankan migrasi skema tabel PostgreSQL (`orders`, `order_events`, `schema_migrations`):

```bash
cd backend
npm run db:migrate
cd ..
```

### Langkah 4: Menjalankan Komponen Aplikasi (Multi-Process)

Buka 3 tab terminal berbeda:

**Terminal 1: Menjalankan Backend HTTP API Server (Port 3000)**

```bash
npm run dev:backend
```

**Terminal 2: Menjalankan Background Worker (BullMQ Consumer)**

```bash
npm run dev:worker
```

**Terminal 3: Menjalankan Frontend Dev Server (Port 5173)**

```bash
npm run dev:frontend
```

Buka peramban di `http://localhost:5173` untuk mengakses **Order Processing Engine Dashboard**.

---

## 5. Pengujian Otomatis & Code Coverage

Proyek ini dilengkapi pengujian unit dan integrasi dengan **Vitest** dan **Supertest** menggunakan driver _mocks_ terisolasi untuk PostgreSQL dan Redis.

### Menjalankan Seluruh Pengujian

```bash
npm test
```

### Memeriksa Laporan Code Coverage (Target: ≥ 75%)

```bash
npm run test:coverage
```

_Laporan coverage lengkap dalam format text, JSON, dan HTML akan dihasilkan di direktori `backend/coverage/index.html`._

---

## 6. Observabilitas, Probes & Telemetri

### Production Health Probes

Aplikasi mengimplementasikan endpoint liveness & readiness standar Kubernetes:

| Endpoint         | Method | Fungsi & Evaluasi                                                                         | Expected Status                                                                 |
| ---------------- | ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/healthz/live`  | `GET`  | Memastikan event loop Node.js responsif dan melaporkan penggunaan memori heap V8 & uptime | `200 OK`                                                                        |
| `/healthz/ready` | `GET`  | Memeriksa ketersediaan aktif (_ping_) ke pool PostgreSQL dan koneksi Redis                | `200 OK` (jika keduanya UP)<br>`503 Service Unavailable` (jika salah satu DOWN) |

### Structured JSON Logging (Pino)

Setiap permintaan HTTP menyertakan header `x-request-id` (diteruskan dari klien atau di-generate otomatis via UUIDv4). Baris log dicetak dalam format JSON standar cloud-native untuk diagregasi dengan Grafana Loki, Fluentbit, atau ELK Stack:

```json
{
  "level": "info",
  "time": "2026-09-09T08:30:00.000Z",
  "service": "order-processing-engine",
  "env": "development",
  "reqId": "c3d5e2a1-8d2b-4b1f-998f-4f24ef789012",
  "msg": "POST /api/v1/orders completed with status 201"
}
```

### Prometheus Metrics (`GET /metrics`)

Tersedia metrik bawaan Node.js (V8 heap, GC, event loop lag, CPU) dan metrik bisnis kustom:

- `ope_http_request_duration_seconds`: Histogram durasi HTTP request berdasarkan method, route, dan status_code.
- `ope_orders_created_total`: Counter total order yang berhasil dibuat berdasarkan status.
- `ope_order_processing_duration_seconds`: Histogram durasi pemrosesan order pada background worker.
- `ope_queue_active_jobs`: Gauge jumlah pekerjaan aktif di antrean Redis.

---

## 7. Chaos & Incident Injection Endpoints (SRE Lab)

Router `/api/v1/diagnostics` dirancang khusus untuk menguji alert rule Prometheus, dashboard Grafana, dan mekanisme pemulihan otomatis (Docker restart / Kubernetes liveness failure):

1. **CPU Stress Test**:

   ```bash
   curl -X POST http://localhost:3000/api/v1/diagnostics/cpu-stress \
     -H "Content-Type: application/json" \
     -d '{"durationMs": 3000}'
   ```

   _Mengunci CPU dengan loop kalkulasi SHA-256 intensif untuk menguji alert lonjakan CPU._

2. **Memory Leak Simulation**:

   ```bash
   curl -X POST http://localhost:3000/api/v1/diagnostics/memory-leak \
     -H "Content-Type: application/json" \
     -d '{"sizeMb": 50}'
   ```

   _Mengalokasikan array string global tanpa henti untuk memicu lonjakan heap V8 dan menguji OOMKill._

3. **Process Crash**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/diagnostics/crash
   ```
   _Mengeksekusi `process.exit(1)` seketika untuk memvalidasi Docker restart policy (`--restart unless-stopped`) atau Kubernetes crash-loop-backoff._

---

## 8. Ringkasan API Endpoints

| Method | Endpoint                          | Keterangan                                               |
| ------ | --------------------------------- | -------------------------------------------------------- |
| `GET`  | `/healthz/live`                   | Liveness probe Node.js                                   |
| `GET`  | `/healthz/ready`                  | Readiness probe (PostgreSQL & Redis check)               |
| `GET`  | `/metrics`                        | Prometheus metrics endpoint                              |
| `POST` | `/api/v1/orders`                  | Membuat transaksi order baru                             |
| `GET`  | `/api/v1/orders`                  | Mengambil daftar order dengan pagination & filter status |
| `GET`  | `/api/v1/orders/:id`              | Mengambil detail order berdasarkan UUID                  |
| `GET`  | `/api/v1/orders/:id/events`       | Mengambil audit trail / riwayat status order             |
| `POST` | `/api/v1/diagnostics/cpu-stress`  | Pemicu lonjakan CPU                                      |
| `POST` | `/api/v1/diagnostics/memory-leak` | Pemicu kebocoran memori heap V8                          |
| `POST` | `/api/v1/diagnostics/crash`       | Pemicu crash proses seketika                             |
