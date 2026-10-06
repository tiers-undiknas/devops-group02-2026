# Branching Strategy
## Core Order & Billing Engine — DevOps Group 02 2026

Dokumen ini mendefinisikan strategi percabangan (branching strategy) yang digunakan oleh DevOps Group 02 dalam pengembangan **Core Order & Billing Engine**. Repository menggunakan pendekatan **Trunk-Based Development (TBD)** dengan branch berumur pendek, Pull Request wajib, peer review, Conventional Commits, serta Squash and Merge untuk menjaga riwayat `main` tetap linear.

Strategi ini dipilih karena repository berbentuk monorepo yang memuat beberapa komponen yang saling terhubung, antara lain:

- Backend REST API berbasis Express.js;
- Queue Worker berbasis BullMQ/Redis;
- Database dan migration;
- Frontend SPA berbasis Vite;
- Telemetry;
- Automated Test berbasis Vitest.

Tujuan utama strategi ini adalah mempercepat integrasi perubahan, menekan risiko konflik, menjaga kualitas `main`, serta mendukung siklus rilis yang cepat dan terukur.

---

# 1. Analisis Kritis GitFlow vs Trunk-Based Development

## 1.1 Karakteristik GitFlow

GitFlow menggunakan beberapa branch berumur relatif panjang, seperti:

```text
main
develop
feature/*
release/*
hotfix/*
```

Pada model ini, fitur biasanya dikembangkan di `feature/*`, kemudian digabungkan ke `develop`. Ketika akan melakukan rilis, tim membuat `release/*`, lalu setelah stabil perubahan digabungkan kembali ke `main` dan `develop`.

Model tersebut sesuai untuk proyek yang memiliki siklus rilis panjang dan tahapan stabilisasi formal. Namun, pendekatan ini kurang ideal untuk repository kelompok yang menargetkan integrasi cepat dan rilis harian.

---

## 1.2 Kelemahan GitFlow pada Siklus Rilis Harian Monorepo

Pada monorepo Core Order & Billing Engine, backend, frontend, worker, database, telemetry, dan test berada dalam satu basis kode. Perubahan kecil pada satu modul dapat memengaruhi modul lain.

Jika GitFlow digunakan, developer dapat bekerja beberapa hari pada branch berbeda sebelum perubahan bertemu kembali di `develop`. Kondisi ini meningkatkan jarak antara kode yang sedang dikerjakan dengan kondisi terbaru repository.

Sebagai contoh:

```text
main
  \
   develop
      \
       feature/api-a
       feature/worker-b
       feature/frontend-c
```

Apabila ketiga branch tersebut berjalan lama, masing-masing developer membuat asumsi terhadap versi kode yang berbeda. Ketika akhirnya digabungkan, konflik dan ketidaksesuaian integrasi baru muncul di akhir proses.

Untuk siklus rilis harian, proses tersebut menambah tahapan yang tidak selalu memberikan nilai tambah. Developer harus melewati feature branch, `develop`, kemungkinan release branch, baru kemudian `main`. Semakin banyak titik integrasi, semakin tinggi pula biaya koordinasi.

---

# 2. Merge Debt

**Merge Debt** adalah akumulasi pekerjaan integrasi yang tertunda karena branch terlalu lama terpisah dari trunk.

Merge Debt tidak hanya berarti konflik Git secara tekstual. Masalah yang lebih serius adalah konflik semantik, yaitu kode dapat berhasil di-merge tetapi perilakunya sudah tidak sesuai dengan perubahan terbaru di branch lain.

Contoh pada repository ini:

- developer A mengubah response endpoint health API;
- developer B mengubah dashboard frontend yang membaca endpoint tersebut;
- developer C mengubah integration test;
- ketiga perubahan berada di branch panjang yang berbeda.

Jika integrasi baru dilakukan beberapa hari kemudian, frontend atau test dapat menggunakan kontrak API yang sudah berubah. Akibatnya, tim harus melakukan pekerjaan tambahan untuk merekonsiliasi kode.

Semakin lama branch hidup, semakin besar Merge Debt yang harus dibayar.

TBD mengurangi Merge Debt dengan prinsip:

```text
small change
↓
short-lived branch
↓
review
↓
merge to main
↓
next small change
```

Dengan integrasi yang sering, konflik ditemukan ketika ukurannya masih kecil dan konteks perubahan masih dipahami developer.

---

# 3. Dampak terhadap DORA Metrics

Strategi branching tidak hanya memengaruhi kenyamanan developer, tetapi juga memengaruhi indikator delivery performance.

Dua metrik DORA yang relevan adalah:

1. **Lead Time for Changes (LTTC)**
2. **Change Failure Rate (CFR)**

---

## 3.1 Lead Time for Changes (LTTC)

Lead Time for Changes menggambarkan waktu dari perubahan kode dibuat sampai perubahan tersebut siap atau berhasil masuk ke alur rilis.

Pada GitFlow, alurnya dapat menjadi:

```text
coding
↓
feature branch
↓
merge to develop
↓
integration
↓
release branch
↓
stabilization
↓
main
```

Setiap lapisan menambah waktu tunggu.

Dalam TBD:

```text
coding
↓
short-lived branch
↓
Pull Request
↓
review
↓
main
```

Jumlah hand-off lebih sedikit sehingga perubahan kecil dapat masuk ke trunk lebih cepat.

Pada repository kelompok, branch seperti:

```text
feat/api-memory-details
feat/diagnostics-heap-usage
feat/ui-health-refresh
```

ditargetkan selesai kurang dari 24 jam. Dengan demikian, jarak waktu antara implementasi dan integrasi tetap pendek.

TBD pada konteks ini membantu menurunkan LTTC karena perubahan tidak menunggu release branch atau integrasi besar di akhir periode.

---

## 3.2 Change Failure Rate (CFR)

Change Failure Rate menggambarkan persentase perubahan yang menyebabkan kegagalan setelah perubahan diterapkan.

Secara sekilas, integrasi cepat terlihat lebih berisiko. Namun jika setiap perubahan:

- kecil;
- direview;
- diuji;
- tidak langsung di-push ke `main`;
- dan digabung melalui Squash and Merge;

maka kegagalan justru lebih mudah diisolasi.

Misalnya satu PR hanya mengubah satu endpoint dan test terkait. Jika terjadi masalah, ruang pencarian penyebab jauh lebih kecil daripada satu release branch yang membawa banyak perubahan sekaligus.

Pada GitFlow dengan branch panjang, risiko CFR dapat meningkat karena perubahan besar digabung sekaligus dan interaksi antarfitur baru terlihat terlambat.

TBD membantu menekan CFR melalui:

- ukuran perubahan kecil;
- test lebih sering;
- review lebih fokus;
- feedback lebih cepat;
- integrasi kontinu ke `main`.

Dengan demikian, target tim bukan sekadar "merge lebih cepat", tetapi **merge lebih kecil, lebih sering, dan tetap terkontrol**.

---

# 4. Alasan Tim Memilih Trunk-Based Development

DevOps Group 02 menggunakan `main` sebagai trunk.

Setiap perubahan dilakukan melalui short-lived branch:

```text
main
↓
<kategori>/<deskripsi-singkat>
↓
Pull Request
↓
Peer Review
↓
Revision
↓
Approval
↓
Squash and Merge
↓
main
```

Keuntungan utama pendekatan ini untuk monorepo kelompok:

1. Integrasi dilakukan lebih sering.
2. Konflik ditemukan lebih cepat.
3. Scope PR lebih mudah direview.
4. Test dapat difokuskan pada perubahan kecil.
5. Riwayat `main` tetap linear.
6. Setiap PR dapat diaudit.
7. Risiko Merge Debt lebih rendah.
8. LTTC lebih pendek dibanding alur dengan banyak branch permanen.

---

# 5. SOP Short-Lived Branches

Setiap feature branch wajib mematuhi SOP berikut.

## 5.1 Sinkronisasi Sebelum Membuat Branch

Developer wajib memperbarui `main` terlebih dahulu:

```bash
git switch main
git pull --ff-only origin main
git fetch --prune
```

Pastikan:

```bash
git status
```

menunjukkan working tree bersih.

---

## 5.2 Membuat Branch

Format:

```text
<kategori>/<deskripsi-singkat>
```

Contoh:

```text
feat/api-memory-details
fix/worker-job-logging
feat/ui-health-refresh
test/health-memory-coverage
docs/branching-strategy
```

Branch wajib dibuat dari `main` terbaru.

---

## 5.3 Batas Usia Branch

Target maksimum usia branch:

```text
≤ 24 jam
```

Branch yang diperkirakan tidak selesai dalam 24 jam harus dipecah menjadi beberapa perubahan yang lebih kecil.

Tujuannya agar branch tidak tertinggal jauh dari trunk.

---

## 5.4 Batas Ukuran Perubahan

Target ukuran perubahan:

```text
≤ 400 baris kode per Pull Request
```

Batas ini bukan sekadar angka administratif. PR kecil:

- lebih cepat direview;
- lebih mudah diuji;
- lebih mudah dipahami;
- lebih mudah di-rollback;
- lebih kecil kemungkinan membawa perubahan tidak relevan.

Jika perubahan melewati 400 baris kode, developer harus mengevaluasi apakah pekerjaan dapat dipecah berdasarkan:

- endpoint;
- layer;
- modul;
- test;
- UI component;
- migration;
- feature flag.

File generated seperti lock file dapat memiliki perubahan besar dan perlu dinilai berdasarkan konteks, tetapi kode bisnis tetap harus dijaga kecil dan terfokus.

---

# 6. Prosedur Teknis Short-Lived Branch

Workflow harian:

```text
1. Sync main
↓
2. Create branch
↓
3. Implement small change
↓
4. Run relevant tests
↓
5. Commit using Conventional Commits
↓
6. Push branch
↓
7. Open Pull Request
↓
8. Code Owner review
↓
9. Revision commit if required
↓
10. Resolve conversation
↓
11. Approval
↓
12. Squash and Merge
↓
13. Delete branch
```

Sebelum PR:

```bash
git diff
git diff --check
npm test
```

atau pengujian spesifik:

```bash
npm run test:backend
npm run test:frontend
```

---

# 7. Menangani Fitur Kompleks yang Membutuhkan 2 Minggu

TBD tidak berarti setiap fitur harus selesai secara penuh dalam 24 jam.

Jika tim harus mengembangkan fitur backend yang membutuhkan dua minggu, solusi yang digunakan adalah:

**Feature Flag / Feature Toggle**

Dengan feature flag, kode yang belum siap dapat tetap diintegrasikan ke trunk tetapi tidak aktif bagi pengguna normal.

Dengan demikian tim menghindari:

```text
feature/complex-feature
↓
hidup 2 minggu
↓
tertinggal jauh dari main
↓
merge debt besar
```

Sebaliknya:

```text
small increment 1 → main
small increment 2 → main
small increment 3 → main
...
feature tetap OFF
↓
fitur lengkap
↓
flag diaktifkan
```

---

# 8. Konsep Feature Flag

Feature flag adalah conditional logic yang menentukan apakah fitur tertentu diaktifkan.

Contoh sederhana menggunakan environment variable:

```env
FEATURE_ADVANCED_ORDER=false
```

Pada backend Express.js:

```js
const isAdvancedOrderEnabled =
  process.env.FEATURE_ADVANCED_ORDER === 'true';
```

Kemudian digunakan dalam endpoint:

```js
router.post('/orders', async (req, res) => {
  if (isAdvancedOrderEnabled) {
    return advancedOrderService.create(req, res);
  }

  return standardOrderService.create(req, res);
});
```

Ketika fitur belum selesai:

```text
FEATURE_ADVANCED_ORDER=false
```

Kode baru tetap dapat diintegrasikan ke `main`, tetapi pengguna tetap menggunakan behavior lama.

Setelah implementasi dan pengujian selesai:

```text
FEATURE_ADVANCED_ORDER=true
```

fitur dapat diaktifkan tanpa harus mempertahankan branch selama dua minggu.

---

# 9. Contoh Implementasi Toggle yang Lebih Aman

Konfigurasi dapat dipisahkan:

```js
// backend/src/config/features.js

export const features = {
  advancedOrder:
    process.env.FEATURE_ADVANCED_ORDER === 'true'
};
```

Kemudian pada service atau route:

```js
import { features } from '../config/features.js';

router.post('/orders', async (req, res, next) => {
  try {
    if (features.advancedOrder) {
      const result =
        await advancedOrderService.create(req.body);

      return res.status(201).json(result);
    }

    const result =
      await orderService.create(req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
```

Pendekatan tersebut memisahkan deployment dari feature release.

Artinya:

```text
Deploy kode ≠ Aktifkan fitur
```

Kode dapat masuk ke production tetapi fitur masih tersembunyi.

---

# 10. Strategi Pengembangan Fitur 2 Minggu

Contoh fitur kompleks:

```text
Advanced Order Processing
```

Daripada membuat satu branch selama dua minggu, pekerjaan dapat dibagi:

### Hari 1

```text
feat/order-feature-flag
```

Menambahkan konfigurasi toggle.

### Hari 2–3

```text
feat/advanced-order-service
```

Menambahkan service dasar tetapi flag masih OFF.

### Hari 4–5

```text
test/advanced-order-service
```

Menambahkan unit test.

### Hari 6–8

```text
feat/advanced-order-validation
```

Menambahkan validation layer.

### Hari 9–11

```text
feat/advanced-order-worker
```

Integrasi dengan queue worker.

### Hari 12–13

```text
test/advanced-order-integration
```

Integration test.

### Hari 14

Validasi akhir dan aktifkan flag pada environment yang sesuai.

Setiap branch tetap berumur pendek walaupun pengembangan fitur secara keseluruhan berlangsung dua minggu.

---

# 11. Risiko Feature Flags

Feature flag juga memiliki risiko apabila tidak dikelola.

Risiko:

- dead code;
- terlalu banyak kombinasi flag;
- konfigurasi environment tidak konsisten;
- test tidak mencakup kondisi ON dan OFF;
- flag lama tidak pernah dihapus.

Karena itu setiap feature flag harus memiliki lifecycle:

```text
Create
↓
Develop
↓
Test OFF
↓
Test ON
↓
Enable
↓
Stabilize
↓
Remove flag
```

Setelah fitur stabil, flag sementara harus dihapus melalui PR tersendiri.

---

# 12. Hubungan TBD, Merge Debt, LTTC, dan CFR

Hubungan strategi dapat dirangkum sebagai berikut:

```text
Short-lived branches
        ↓
Frequent integration
        ↓
Lower Merge Debt
        ↓
Smaller changes
        ↓
Faster review
        ↓
Lower Lead Time for Changes
```

Sementara:

```text
Smaller changes
        ↓
Focused testing
        ↓
Focused code review
        ↓
Earlier defect detection
        ↓
Lower probability of failed changes
        ↓
Better Change Failure Rate
```

Dengan demikian, TBD bukan sekadar strategi Git. TBD merupakan pendekatan teknis yang memengaruhi kemampuan tim untuk mengirim perubahan secara cepat dan aman.

---

# 13. Kebijakan Branch Protection

Branch `main` dilindungi menggunakan repository ruleset.

Kebijakan yang diterapkan:

- direct push ke `main` dilarang;
- perubahan wajib melalui Pull Request;
- minimal satu approval diperlukan;
- stale approval dibatalkan setelah commit baru;
- review Code Owner diwajibkan;
- unresolved conversation memblokir merge;
- linear history diwajibkan;
- force push diblokir;
- branch `main` tidak boleh dihapus;
- metode merge dibatasi ke Squash and Merge;
- bypass list dikosongkan agar aturan berlaku bagi seluruh anggota.

Kebijakan tersebut menjadikan `main` sebagai trunk yang selalu terkontrol.

---