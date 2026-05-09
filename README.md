# Bungoil POS - Point of Sale System

Sistem Point of Sale (POS) untuk toko sparepart dan jasa mekanik, dibangun dengan **PHP**, **HTML**, **CSS**, **JavaScript**, dan **MySQL**.

## Fitur

- **Dashboard** - Ringkasan penjualan, work order, stok, dan statistik bisnis
- **Kasir (POS)** - Transaksi penjualan dengan barcode scanner, keranjang belanja, cetak struk
- **Produk** - CRUD produk, manajemen stok, filter & pencarian, paginasi
- **Kategori** - Manajemen kategori produk
- **Work Order** - Jasa mekanik dengan tracking status, layanan & sparepart
- **Pelanggan** - Database pelanggan (eceran & grosir), info kendaraan
- **Transaksi** - Riwayat transaksi, detail, pembatalan
- **Laporan** - Penjualan, laba rugi, dan stok
- **Pengeluaran** - Catat pengeluaran operasional
- **Pengguna** - Manajemen user dengan role (admin, kasir, mekanik, owner)
- **Cabang** - Multi-cabang
- **Pengaturan** - Konfigurasi toko, upload logo, backup database
- **Harga Grosir & Eceran** - Dual pricing system
- **Responsive** - Mobile-friendly UI

## Tech Stack

| Komponen   | Teknologi           |
|-----------|---------------------|
| Frontend  | HTML, CSS, JavaScript (Vanilla) |
| Backend   | PHP 8.1+            |
| Database  | MySQL 8.0           |
| Server    | Apache / PHP Built-in Server |

## Instalasi

### Prasyarat
- PHP 8.1+
- MySQL 8.0+
- Extension PHP: pdo_mysql, mbstring, json

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/kodok321/bungoilpos.git
   cd bungoilpos
   ```

2. **Setup database MySQL**
   ```bash
   mysql -u root -e "CREATE DATABASE bungoilpos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -e "CREATE USER 'bungoil'@'localhost' IDENTIFIED BY 'bungoil123';"
   mysql -u root -e "GRANT ALL PRIVILEGES ON bungoilpos.* TO 'bungoil'@'localhost'; FLUSH PRIVILEGES;"
   ```

3. **Konfigurasi database**
   Edit `config/database.php` sesuaikan pengaturan database:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'bungoilpos');
   define('DB_USER', 'bungoil');
   define('DB_PASS', 'bungoil123');
   ```

4. **Inisialisasi database dan data awal**
   ```bash
   php config/init_db.php
   ```

5. **Jalankan server**
   ```bash
   php -S localhost:8000
   ```

6. **Buka browser**: http://localhost:8000

## Akun Default

| Username  | Password    | Role     |
|-----------|-------------|----------|
| admin     | admin123    | Admin    |
| kasir     | kasir123    | Kasir    |
| mekanik   | mekanik123  | Mekanik  |

## Struktur Folder

```
bungoilpos/
├── api/                    # PHP API endpoints
│   ├── auth.php           # Autentikasi
│   ├── products.php       # Produk
│   ├── categories.php     # Kategori
│   ├── transactions.php   # Transaksi
│   ├── customers.php      # Pelanggan
│   ├── work_orders.php    # Work Order
│   ├── reports.php        # Laporan
│   ├── users.php          # Pengguna
│   ├── branches.php       # Cabang
│   ├── expenses.php       # Pengeluaran
│   ├── settings.php       # Pengaturan
│   └── backup.php         # Backup Database
├── assets/
│   ├── css/style.css      # Stylesheet
│   ├── js/
│   │   ├── api.js         # API service layer
│   │   └── app.js         # Main application
│   └── uploads/           # Logo & file uploads
├── config/
│   ├── database.php       # Konfigurasi database
│   └── init_db.php        # Inisialisasi & seed database
├── backups/               # Database backups
├── index.php              # Entry point (SPA)
├── .htaccess              # Apache configuration
└── README.md
```

## Lisensi

MIT License
