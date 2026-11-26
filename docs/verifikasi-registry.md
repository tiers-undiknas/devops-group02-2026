# Verifikasi dan troubleshooting container registry

## Hasil uji rilis 1.0.0

Troy menarik `ope-backend:1.0.0` dan `ope-frontend:1.0.0` dari GHCR di MacBook Air, dari folder uji di luar repositori. Kontainer backend mencapai status `healthy`. Log menunjukkan dua migrasi database selesai dan API mulai mendengarkan pada port 3000.

| Image | Disk Usage | Content Size |
| --- | ---: | ---: |
| `ope-backend:1.0.0` | 210 MB | 51 MB |
| `ope-frontend:1.0.0` | 73,7 MB | 21 MB |

Jika diukur dari kolom `Disk Usage`, frontend memenuhi target di bawah 100 MB dan backend masih melebihi target tersebut.

## Analisis tiga kasus SC-05

### 1. Nama repositori image mengandung huruf kapital

Docker menolak nama repositori seperti `Tiers-Undiknas/ope-backend` dengan pesan `repository name must be lowercase`. Dalam contoh Bash di modul, `repo_lc=${IMAGE_PREFIX,,}` mengubah huruf pada nilai `IMAGE_PREFIX` menjadi huruf kecil sebelum nama image dibentuk. Workflow kelompok memakai `docker/metadata-action` untuk menormalkan nama image. [Aturan penamaan Docker Metadata Action](https://github.com/docker/metadata-action#image-name-and-tag-sanitization)

### 2. Login ke GHCR berhasil, tetapi push ditolak

Login membuktikan identitas. Saat push, GHCR juga memeriksa izin menulis ke paket tujuan. Pengaturan **Workflow permissions** di repositori menetapkan izin awal `GITHUB_TOKEN`. Job `build-and-push-registry` meminta `packages: write` untuk menerbitkan image dan `contents: read` untuk membaca kode. Jika push masih ditolak, periksa apakah paket memberi akses tulis kepada repositori yang menjalankan workflow. [Izin token di GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idpermissions)

### 3. Image terbit meskipun pengujian gagal

Tanpa `needs`, job publikasi dapat berjalan bersamaan dengan pengujian dan memperbarui tag `1.0` sebelum kegagalan tes diketahui. Deployment yang menarik tag itu bisa menjalankan kode yang gagal diuji. Dengan `needs: [backend-ci, frontend-ci]`, publikasi menunggu kedua job berhasil. Jika salah satunya gagal, GitHub melewati job publikasi. [Dependensi job GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds)
