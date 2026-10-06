# Contributing Guide
## Core Order & Billing Engine — DevOps Group 02 2026

Dokumen ini menjadi pedoman kontribusi teknis bagi seluruh anggota DevOps Group 02 dalam mengembangkan repository Core Order & Billing Engine.

Seluruh kontribusi wajib mengikuti prinsip:

- Trunk-Based Development (TBD)
- Conventional Commits v1.0.0
- Semantic Versioning 2.0.0
- Pull Request based workflow
- Peer Code Review
- Short-Lived Branches
- Linear Git History
- Squash and Merge

Tujuan utama aturan ini adalah menjaga kualitas kode, mempercepat proses integrasi, mengurangi merge debt, serta memastikan setiap perubahan pada branch `main` telah melalui proses review yang dapat diaudit.

---

# 1. Prinsip Dasar Kontribusi

Branch `main` merupakan trunk dan menjadi satu-satunya sumber kode utama yang dianggap stabil.

Anggota tim **DILARANG** melakukan direct push ke branch `main`.

Semua perubahan harus melalui alur:

```text
main
↓
short-lived branch
↓
development
↓
local testing
↓
commit
↓
push
↓
Pull Request
↓
peer review
↓
revision
↓
approval
↓
Squash and Merge
↓
main
```

Setiap Pull Request wajib:

1. Berasal dari branch berumur pendek.
2. Memiliki ruang lingkup perubahan yang kecil dan terfokus.
3. Menggunakan pesan commit sesuai Conventional Commits.
4. Melewati pengujian lokal yang relevan.
5. Mendapatkan minimal satu approval.
6. Memperoleh review dari Code Owner apabila file yang diubah memiliki owner.
7. Menyelesaikan seluruh conversation sebelum merge.
8. Digabungkan menggunakan Squash and Merge.

---

# 2. Sinkronisasi Sebelum Memulai Pekerjaan

Sebelum membuat branch baru, developer wajib memastikan branch `main` lokal sudah sesuai dengan remote.

Gunakan:

```bash
git switch main
git pull --ff-only origin main
git fetch --prune
```

Pastikan kondisi repository bersih:

```bash
git status
```

Output yang diharapkan:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Developer tidak diperbolehkan membuat feature branch dari `main` yang tertinggal dari remote.

---

# 3. Aturan Penamaan Branch

Format branch yang digunakan adalah:

```text
<kategori>/<deskripsi-singkat>
```

Nama branch:

- menggunakan huruf kecil;
- menggunakan tanda `-` sebagai pemisah kata;
- singkat tetapi menjelaskan tujuan perubahan;
- tidak menggunakan nama pribadi;
- tidak menggunakan nama seperti `update`, `new`, atau `test123`.

Kategori branch yang digunakan:

| Kategori | Kegunaan |
|---|---|
| `feat/` | Pengembangan fitur baru |
| `fix/` | Perbaikan bug |
| `docs/` | Dokumentasi |
| `refactor/` | Refactoring tanpa mengubah behavior utama |
| `test/` | Penambahan/perbaikan automated test |
| `perf/` | Peningkatan performa |
| `ci/` | Perubahan CI/CD |
| `build/` | Perubahan dependency/build |
| `chore/` | Maintenance dan repository governance |

Contoh branch yang valid:

```text
feat/api-memory-details
feat/ui-health-refresh
fix/worker-job-logging
test/health-memory-coverage
docs/branching-strategy
chore/repository-governance
```

Contoh yang tidak diperbolehkan:

```text
feature1
update
dedykoding
newbranch
fix
coba-coba
```

---

# 4. Short-Lived Branches

Tim menggunakan prinsip Trunk-Based Development sehingga branch perubahan harus berumur pendek.

Target tim:

- branch diselesaikan dalam waktu kurang dari 24 jam;
- perubahan dibuat kecil dan terfokus;
- satu branch menyelesaikan satu tujuan utama;
- branch segera dihapus setelah Pull Request berhasil di-merge.

Jika pekerjaan terlalu besar untuk diselesaikan dalam branch pendek, fitur harus dipecah menjadi beberapa increment kecil atau menggunakan Feature Flag.

Developer tidak diperbolehkan membuat long-lived feature branch yang terpisah dari `main` selama beberapa hari atau minggu.

---

# 5. Conventional Commits

Semua pesan commit wajib mengikuti pola:

```text
<type>(<scope>): <description>
```

Contoh:

```text
feat(api): expose heap memory details in liveness probe
```

Struktur:

```text
feat       = type
api        = scope
expose ... = description
```

Type yang diperbolehkan:

| Type | Kegunaan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Dokumentasi |
| `style` | Formatting tanpa perubahan logic |
| `refactor` | Refactoring kode |
| `perf` | Peningkatan performa |
| `test` | Automated test |
| `build` | Dependency/build system |
| `ci` | CI/CD |
| `chore` | Maintenance |

Repository menggunakan Commitlint dan Husky `commit-msg` hook. Commit yang tidak mengikuti format akan diblokir secara otomatis.

Contoh commit yang **DITOLAK**:

```text
update
fix
perbaikan
new code
ubah file
```

Contoh commit yang **DITERIMA**:

```text
feat(api): expose heap memory details in liveness probe
fix(worker): improve failed job logging
feat(ui): add manual system status refresh
test(api): validate heap usage percentage range
docs(repo): document branching strategy
chore(repo): configure repository governance
```

---

# 6. Scope Commit Berdasarkan Modul

## 6.1 Backend API & Services

Scope yang disarankan:

```text
api
service
```

Contoh:

```text
feat(api): expose heap memory details in liveness probe
fix(api): validate diagnostic request parameters
refactor(service): simplify order calculation flow
```

Direktori utama:

```text
/backend/src/routes/
/backend/src/services/
```

## 6.2 Queue Worker

Scope:

```text
worker
```

Contoh:

```text
fix(worker): add retry metadata to failed job logs
refactor(worker): standardize job lifecycle log metadata
perf(worker): reduce unnecessary queue lookups
```

File terkait:

```text
/backend/src/worker.js
/backend/src/infra/
```

## 6.3 Database & Migrations

Scope:

```text
db
```

Contoh:

```text
feat(db): add index for order lookup
fix(db): correct migration rollback behavior
refactor(db): simplify database connection configuration
```

Direktori:

```text
/backend/src/db/
```

## 6.4 Frontend SPA

Scope:

```text
ui
frontend
```

Contoh:

```text
feat(ui): add manual system status refresh
fix(ui): prevent duplicate status refresh requests
refactor(ui): simplify dashboard health rendering
```

Direktori:

```text
/frontend/
```

## 6.5 Telemetry

Scope:

```text
telemetry
```

Contoh:

```text
feat(telemetry): expose queue processing metric
fix(telemetry): prevent duplicate metric registration
```

Direktori:

```text
/backend/src/telemetry/
```

## 6.6 Vitest / Automated Tests

Scope:

```text
test
api
worker
ui
```

Contoh:

```text
test(api): cover liveness memory telemetry
test(api): validate heap usage percentage range
test(worker): cover failed job retry metadata
test(ui): cover health refresh interaction
```

Lokasi:

```text
/backend/tests/
/backend/vitest.config.js
```

---

# 7. Git Commit Workflow

Setelah melakukan perubahan:

```bash
git status
```

Periksa terlebih dahulu file yang berubah.

Gunakan:

```bash
git diff
git diff --check
```

Kemudian hanya stage file yang relevan.

Contoh:

```bash
git add backend/src/routes/health.routes.js
```

Buat commit:

```bash
git commit -m "feat(api): expose heap memory details in liveness probe"
```

Husky dan Commitlint akan memvalidasi pesan commit secara otomatis.

Kemudian push:

```bash
git push -u origin <nama-branch>
```

Push berikutnya cukup menggunakan:

```bash
git push
```

---

# 8. Pengujian Sebelum Pull Request

Developer wajib menjalankan pengujian yang relevan sebelum membuka PR.

## Backend

```bash
npm run test:backend
```

## Frontend

```bash
npm run test:frontend
```

## Semua test

```bash
npm test
```

Jika diperlukan:

```bash
npm run build:frontend
```

Pull Request tidak boleh menyatakan test berhasil apabila pengujian belum benar-benar dijalankan.

---

# 9. Pull Request

Semua perubahan ke `main` wajib menggunakan Pull Request.

PR menggunakan template:

```text
.github/PULL_REQUEST_TEMPLATE.md
```

Judul PR sebaiknya mengikuti Conventional Commits.

Contoh:

```text
feat(api): expose heap memory details in liveness probe
```

PR wajib menjelaskan:

- perubahan teknis;
- tipe perubahan;
- modul yang terdampak;
- hasil pengujian;
- status keamanan file rahasia;
- kepatuhan branch;
- catatan untuk reviewer.

---

# 10. Peer Code Review

Setiap Pull Request wajib memperoleh minimal satu approval dari anggota lain.

Code Owner mengikuti:

```text
.github/CODEOWNERS
```

Reviewer tidak diperbolehkan hanya memberikan komentar seperti:

```text
oke
bagus
lanjut
approved
```

Review harus membahas aspek teknis.

Contoh review yang baik:

```text
Perhitungan konversi byte ke MB dilakukan berulang.
Sebaiknya dibuat helper function agar logic lebih konsisten
serta mengurangi duplikasi.
```

Atau:

```text
Field heapUsagePercent sudah tersedia, tetapi integration test
belum memvalidasi rentang nilainya. Tambahkan assertion agar
nilai berada pada rentang 0 sampai 100.
```

---

# 11. Prosedur Menanggapi Review

Jika reviewer meminta revisi:

1. Jangan langsung resolve conversation.
2. Perbaiki kode di branch yang sama.
3. Jalankan test kembali.
4. Buat commit revisi.
5. Push commit.
6. Balas komentar reviewer.
7. Resolve conversation setelah revisi tersedia.
8. Reviewer melakukan pemeriksaan ulang.
9. Reviewer memberikan approval.

Contoh commit revisi:

```text
refactor(api): centralize memory conversion to megabytes
```

atau:

```text
fix(ui): prevent duplicate status refresh requests
```

Dengan demikian PR memiliki jejak:

```text
Initial commit
↓
Technical review
↓
Revision commit
↓
Conversation resolved
↓
Approval
↓
Squash and Merge
```

---

# 12. Squash and Merge

Repository hanya memperbolehkan:

```text
Squash and Merge
```

Merge commit dan rebase merge tidak digunakan.

Misalnya sebuah PR mempunyai:

```text
feat(api): expose heap memory details in liveness probe

refactor(api): centralize memory conversion to megabytes
```

Setelah Squash and Merge, branch `main` hanya memiliki:

```text
feat(api): expose heap memory details in liveness probe (#2)
```

Hal ini menjaga history `main` tetap linear dan mudah dibaca.

Branch feature harus dihapus setelah PR selesai.

---

# 13. Semantic Versioning

Project menggunakan Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Contoh:

```text
1.4.2
│ │ │
│ │ └── PATCH
│ └──── MINOR
└────── MAJOR
```

## PATCH

PATCH digunakan untuk perbaikan yang tidak menambah fitur baru dan tidak mengubah kontrak yang telah digunakan pengguna.

Contoh:

```text
1.4.2 → 1.4.3
```

Contoh perubahan:

```text
fix(worker): prevent duplicate failed job logging
```

## MINOR

MINOR digunakan untuk penambahan fitur yang tetap kompatibel dengan versi sebelumnya.

Contoh:

```text
1.4.3 → 1.5.0
```

Contoh:

```text
feat(ui): add manual system status refresh
```

## MAJOR

MAJOR digunakan jika terjadi Breaking Change.

Contoh:

```text
1.5.0 → 2.0.0
```

Breaking Change adalah perubahan yang menyebabkan consumer, API client, frontend, worker, atau integrasi lama harus menyesuaikan implementasinya.

Contoh:

- menghapus endpoint yang sudah tersedia;
- mengganti nama field response API;
- mengubah format payload secara tidak kompatibel;
- menghapus konfigurasi yang masih digunakan;
- mengubah kontrak database/API yang tidak backward-compatible.

---

# 14. Prosedur Formal Breaking Change

Developer wajib menandai Breaking Change secara eksplisit.

Format commit:

```text
feat(api)!: change order response schema
```

atau menggunakan footer:

```text
feat(api): change order response schema

BREAKING CHANGE: field orderId diganti menjadi id dan format response
tidak lagi kompatibel dengan client versi sebelumnya.
```

Jika PR mengandung Breaking Change:

1. Developer wajib menjelaskan dampaknya pada PR.
2. Reviewer wajib memeriksa kompatibilitas.
3. Migration plan harus tersedia jika diperlukan.
4. Dokumentasi harus diperbarui.
5. Release berikutnya harus menaikkan versi MAJOR sesuai kebijakan tim.

Breaking Change tidak boleh di-merge tanpa review dampak kompatibilitas.

---

# 15. Baseline Release

Baseline release pertama project ditetapkan sebagai:

```text
v0.1.0
```

Tag hanya diterbitkan setelah:

- seluruh PR simulasi kelompok selesai;
- seluruh perubahan berhasil masuk ke `main`;
- seluruh test berhasil;
- history `main` diverifikasi linear;
- dokumentasi teknis tersedia;
- tidak terdapat branch perubahan yang belum terselesaikan.

Tag wajib berupa annotated tag.

Contoh:

```bash
git tag -a v0.1.0 -m "Baseline release v0.1.0"
git push origin v0.1.0
```

---

# 16. Checklist Developer Sebelum Membuka PR

Pastikan:

- [ ] Branch dibuat dari `main` terbaru.
- [ ] Nama branch sesuai standar.
- [ ] Perubahan kecil dan terfokus.
- [ ] Tidak melakukan direct push ke `main`.
- [ ] Tidak ada `.env`, credential, atau secret yang ter-commit.
- [ ] `git diff --check` tidak menghasilkan error.
- [ ] Test yang relevan berhasil.
- [ ] Pesan commit mengikuti Conventional Commits.
- [ ] PR menggunakan template yang tersedia.

---

# 17. Checklist Reviewer

Reviewer wajib memastikan:

- [ ] Tujuan perubahan jelas.
- [ ] Perubahan sesuai scope PR.
- [ ] Tidak terdapat perubahan yang tidak relevan.
- [ ] Logic kode dapat dipahami.
- [ ] Error handling memadai.
- [ ] Test mencakup behavior penting.
- [ ] Tidak ada secret atau `.env`.
- [ ] Commit mengikuti Conventional Commits.
- [ ] Perubahan tidak menimbulkan breaking change yang tidak terdokumentasi.
- [ ] Semua komentar teknis telah ditindaklanjuti.
- [ ] Conversation sudah resolved.
- [ ] PR layak memperoleh approval.

---

# 18. Larangan

Anggota tim tidak diperbolehkan:

- melakukan direct push ke `main`;
- melakukan force push terhadap `main`;
- menghapus branch `main`;
- melakukan merge tanpa Pull Request;
- menggabungkan PR sendiri tanpa review anggota lain;
- menggunakan pesan commit bebas;
- menyimpan credential atau `.env`;
- melakukan merge dengan unresolved conversation;
- mempertahankan feature branch berumur panjang;
- melakukan merge commit yang menghasilkan merge bubble.

---

# 19. Alur Kontribusi Harian

Ringkasan workflow:

```text
1. Sync main
        ↓
2. Create short-lived branch
        ↓
3. Implement small change
        ↓
4. Run local test
        ↓
5. Conventional Commit
        ↓
6. Push branch
        ↓
7. Open Pull Request
        ↓
8. Code Owner review
        ↓
9. Technical comment
        ↓
10. Revision commit
        ↓
11. Re-run tests
        ↓
12. Resolve conversation
        ↓
13. Approval
        ↓
14. Squash and Merge
        ↓
15. Delete branch
        ↓
16. Sync main again
```

---
