# POS Sparepart & Bengkel

Aplikasi Point of Sale (POS) untuk toko sparepart dengan fitur eceran, grosir, dan jasa mekanik.

## Fitur Utama

- **Kasir (POS)** - Transaksi eceran & grosir dengan harga berbeda, scan barcode, cetak struk
- **Manajemen Stok** - CRUD produk, kategori, tracking stok, alert stok menipis
- **Work Order** - Jasa mekanik dengan tracking status, sparepart, dan biaya jasa
- **Laporan Keuangan** - Penjualan, laba rugi, grafik, pengeluaran
- **Multi-User & Role** - Admin, Kasir, Mekanik, Owner dengan akses berbeda
- **Manajemen Pelanggan** - Data pelanggan eceran & grosir, riwayat transaksi
- **Multi-Cabang** - Dukungan banyak cabang
- **Cetak Struk** - Support printer thermal 58mm & 80mm

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: SQLite (offline-first, bisa switch ke PostgreSQL)
- **Auth**: JWT-based authentication

## Instalasi

```bash
# Clone repo
git clone <repo-url>
cd pos-system

# Install semua dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Setup database & seed data
cp backend/.env.example backend/.env
npm run seed

# Jalankan development
npm run dev
```

## Akun Demo

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| kasir | kasir123 | Kasir |
| mekanik | mekanik123 | Mekanik |

## Struktur Folder

```
pos-system/
├── backend/
│   └── src/
│       ├── config/          # Database config
│       ├── controllers/     # Business logic
│       ├── middleware/       # Auth middleware
│       ├── routes/           # API routes
│       ├── seeders/          # Database seeder
│       ├── utils/            # Helper functions
│       └── server.js         # Entry point
├── frontend/
│   └── src/
│       ├── components/       # Reusable components
│       ├── context/          # React context
│       ├── pages/            # Page components
│       ├── services/         # API services
│       ├── utils/            # Helper functions
│       └── App.jsx           # Main app
└── package.json
```

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register user (admin) |
| GET | /api/products | List produk |
| POST | /api/products | Tambah produk |
| GET | /api/products/barcode/:barcode | Cari by barcode |
| POST | /api/transactions | Buat transaksi |
| GET | /api/work-orders | List work order |
| POST | /api/work-orders | Buat work order |
| GET | /api/reports/dashboard | Dashboard data |
| GET | /api/reports/sales | Laporan penjualan |
| GET | /api/reports/profit | Laporan laba rugi |
| GET | /api/reports/stock | Laporan stok |

## Konfigurasi Database

Aplikasi menggunakan SQLite secara default (offline-first). File database disimpan di `backend/data/pos.db`.

Untuk beralih ke PostgreSQL/MySQL, ubah konfigurasi di `backend/src/config/database.js`.
