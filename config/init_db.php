<?php
require_once __DIR__ . '/database.php';

function initializeDatabase() {
    $pdo = getDB();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(24) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            role ENUM('admin','kasir','mekanik','owner') NOT NULL DEFAULT 'kasir',
            branch_id VARCHAR(24),
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS branches (
            id VARCHAR(24) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            address TEXT,
            phone VARCHAR(20),
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(24) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(24) PRIMARY KEY,
            barcode VARCHAR(50) UNIQUE,
            sku VARCHAR(50) UNIQUE,
            name VARCHAR(200) NOT NULL,
            category_id VARCHAR(24),
            brand VARCHAR(100),
            unit VARCHAR(20) DEFAULT 'pcs',
            retail_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            wholesale_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            wholesale_min_qty INT DEFAULT 12,
            cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            stock INT DEFAULT 0,
            min_stock INT DEFAULT 5,
            location VARCHAR(100),
            image_url VARCHAR(500),
            is_active TINYINT(1) DEFAULT 1,
            branch_id VARCHAR(24),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(24) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100),
            address TEXT,
            customer_type ENUM('retail','wholesale') DEFAULT 'retail',
            vehicle_info TEXT,
            total_purchases DECIMAL(15,2) DEFAULT 0,
            points INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS transactions (
            id VARCHAR(24) PRIMARY KEY,
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            customer_id VARCHAR(24),
            user_id VARCHAR(24) NOT NULL,
            branch_id VARCHAR(24),
            transaction_type ENUM('retail','wholesale') NOT NULL DEFAULT 'retail',
            subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(15,2) DEFAULT 0,
            tax_amount DECIMAL(15,2) DEFAULT 0,
            total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
            paid_amount DECIMAL(15,2) DEFAULT 0,
            change_amount DECIMAL(15,2) DEFAULT 0,
            payment_method ENUM('cash','debit','credit','qris','transfer') DEFAULT 'cash',
            payment_status ENUM('paid','pending','partial','cancelled') DEFAULT 'paid',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS transaction_items (
            id VARCHAR(24) PRIMARY KEY,
            transaction_id VARCHAR(24) NOT NULL,
            product_id VARCHAR(24) NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(15,2) NOT NULL,
            discount DECIMAL(15,2) DEFAULT 0,
            subtotal DECIMAL(15,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS work_orders (
            id VARCHAR(24) PRIMARY KEY,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            customer_id VARCHAR(24),
            mechanic_id VARCHAR(24),
            branch_id VARCHAR(24),
            vehicle_type VARCHAR(100),
            vehicle_plate VARCHAR(20),
            vehicle_year VARCHAR(10),
            complaint TEXT,
            diagnosis TEXT,
            status ENUM('pending','in_progress','waiting_parts','completed','cancelled','delivered') DEFAULT 'pending',
            service_fee DECIMAL(15,2) DEFAULT 0,
            parts_total DECIMAL(15,2) DEFAULT 0,
            discount_amount DECIMAL(15,2) DEFAULT 0,
            total_amount DECIMAL(15,2) DEFAULT 0,
            payment_status ENUM('paid','pending','partial') DEFAULT 'pending',
            payment_method VARCHAR(20) DEFAULT 'cash',
            estimated_completion DATETIME,
            completed_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
            FOREIGN KEY (mechanic_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS work_order_items (
            id VARCHAR(24) PRIMARY KEY,
            work_order_id VARCHAR(24) NOT NULL,
            product_id VARCHAR(24) NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(15,2) NOT NULL,
            subtotal DECIMAL(15,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS work_order_services (
            id VARCHAR(24) PRIMARY KEY,
            work_order_id VARCHAR(24) NOT NULL,
            service_name VARCHAR(200) NOT NULL,
            description TEXT,
            price DECIMAL(15,2) NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS expenses (
            id VARCHAR(24) PRIMARY KEY,
            category VARCHAR(100) NOT NULL,
            description TEXT,
            amount DECIMAL(15,2) NOT NULL,
            branch_id VARCHAR(24),
            user_id VARCHAR(24),
            date DATE DEFAULT (CURDATE()),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS stock_movements (
            id VARCHAR(24) PRIMARY KEY,
            product_id VARCHAR(24) NOT NULL,
            branch_id VARCHAR(24),
            movement_type ENUM('in','out','adjustment','transfer','return') NOT NULL,
            quantity INT NOT NULL,
            reference_type VARCHAR(50),
            reference_id VARCHAR(24),
            notes TEXT,
            user_id VARCHAR(24),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Create indexes (ignore if exists)
    $indexes = [
        "CREATE INDEX idx_products_barcode ON products(barcode)",
        "CREATE INDEX idx_products_sku ON products(sku)",
        "CREATE INDEX idx_products_category ON products(category_id)",
        "CREATE INDEX idx_transactions_invoice ON transactions(invoice_number)",
        "CREATE INDEX idx_transactions_date ON transactions(created_at)",
        "CREATE INDEX idx_transactions_customer ON transactions(customer_id)",
        "CREATE INDEX idx_work_orders_number ON work_orders(order_number)",
        "CREATE INDEX idx_work_orders_status ON work_orders(status)",
        "CREATE INDEX idx_stock_movements_product ON stock_movements(product_id)"
    ];

    foreach ($indexes as $idx) {
        try { $pdo->exec($idx); } catch (PDOException $e) { /* Index may already exist */ }
    }
}

function seedDatabase() {
    $pdo = getDB();

    // Check if already seeded
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM users");
    if ($stmt->fetch()['cnt'] > 0) return;

    // Default branch
    $branchId = generateId();
    $pdo->prepare("INSERT INTO branches (id, name, address, phone) VALUES (?, ?, ?, ?)")
        ->execute([$branchId, 'Toko Pusat', 'Jl. Utama No. 1', '081234567890']);

    // Default users
    $adminId = generateId();
    $pdo->prepare("INSERT INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute([$adminId, 'admin', password_hash('admin123', PASSWORD_DEFAULT), 'Administrator', 'admin', $branchId]);

    $kasirId = generateId();
    $pdo->prepare("INSERT INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute([$kasirId, 'kasir', password_hash('kasir123', PASSWORD_DEFAULT), 'Kasir 1', 'kasir', $branchId]);

    $mekanikId = generateId();
    $pdo->prepare("INSERT INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute([$mekanikId, 'mekanik', password_hash('mekanik123', PASSWORD_DEFAULT), 'Mekanik 1', 'mekanik', $branchId]);

    // Categories
    $categories = [
        ['Oli & Pelumas', 'Oli mesin, oli gardan, grease'],
        ['Filter', 'Filter oli, filter udara, filter bensin'],
        ['Rem', 'Kampas rem, disc brake, master rem'],
        ['Kelistrikan', 'Aki, lampu, kabel, relay'],
        ['Mesin', 'Piston, ring, klep, gasket'],
        ['Body & Exterior', 'Spion, bumper, lampu depan'],
        ['Ban & Velg', 'Ban motor, ban mobil, velg'],
        ['Rantai & Gear', 'Rantai, gear depan, gear belakang'],
        ['Busi', 'Busi standar, busi iridium'],
        ['Aksesoris', 'Helm, sarung tangan, dll']
    ];

    $categoryIds = [];
    foreach ($categories as $cat) {
        $id = generateId();
        $categoryIds[$cat[0]] = $id;
        $pdo->prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)")
            ->execute([$id, $cat[0], $cat[1]]);
    }

    // Sample products
    $products = [
        ['Oli Yamalube 10W-40 0.8L', '8991111111', 'OLI-YMH-001', 'Oli & Pelumas', 'Yamaha', 45000, 40000, 35000, 100],
        ['Oli AHM SPX2 0.8L', '8991111112', 'OLI-AHM-001', 'Oli & Pelumas', 'Honda', 48000, 43000, 37000, 80],
        ['Oli Shell Helix HX5 1L', '8991111113', 'OLI-SHL-001', 'Oli & Pelumas', 'Shell', 85000, 75000, 65000, 50],
        ['Filter Oli Honda Beat', '8991111114', 'FLT-HND-001', 'Filter', 'Honda', 25000, 20000, 15000, 60],
        ['Filter Udara Vario 125', '8991111115', 'FLT-HND-002', 'Filter', 'Honda', 35000, 30000, 22000, 40],
        ['Kampas Rem Depan Beat', '8991111116', 'REM-HND-001', 'Rem', 'Honda', 30000, 25000, 18000, 45],
        ['Disc Brake Vario', '8991111117', 'REM-HND-002', 'Rem', 'Honda', 120000, 105000, 85000, 20],
        ['Aki Yuasa GTZ5S', '8991111118', 'ELK-YAS-001', 'Kelistrikan', 'Yuasa', 185000, 165000, 140000, 25],
        ['Lampu LED H6 Autovision', '8991111119', 'ELK-AVS-001', 'Kelistrikan', 'Autovision', 75000, 65000, 50000, 30],
        ['Busi NGK CPR9EA-9', '8991111120', 'BSI-NGK-001', 'Busi', 'NGK', 35000, 30000, 22000, 100],
        ['Busi Denso Iridium IU27', '8991111121', 'BSI-DNS-001', 'Busi', 'Denso', 85000, 75000, 60000, 50],
        ['Rantai SSS 428H-130', '8991111122', 'RNT-SSS-001', 'Rantai & Gear', 'SSS', 95000, 85000, 70000, 30],
        ['Gear Set Sinnob Jupiter', '8991111123', 'RNT-SNB-001', 'Rantai & Gear', 'Sinnob', 250000, 225000, 185000, 15],
        ['Ban FDR Sport XR Evo 80/80-17', '8991111124', 'BAN-FDR-001', 'Ban & Velg', 'FDR', 195000, 175000, 150000, 20],
        ['Ban IRC NR72 70/90-17', '8991111125', 'BAN-IRC-001', 'Ban & Velg', 'IRC', 155000, 140000, 120000, 25],
        ['Spion Honda Beat PnP', '8991111126', 'BDY-HND-001', 'Body & Exterior', 'Honda', 45000, 38000, 30000, 35],
        ['Piston Kit Vario 150 STD', '8991111127', 'MSN-HND-001', 'Mesin', 'Honda', 350000, 320000, 270000, 10],
        ['Helm KYT Galaxy Slide', '8991111128', 'AKS-KYT-001', 'Aksesoris', 'KYT', 250000, 230000, 190000, 15],
        ['V-Belt Honda Vario 125', '8991111129', 'MSN-HND-002', 'Mesin', 'Honda', 145000, 130000, 105000, 20],
        ['Roller Kawahara Vario', '8991111130', 'MSN-KWH-001', 'Mesin', 'Kawahara', 65000, 55000, 42000, 30]
    ];

    foreach ($products as $p) {
        $id = generateId();
        $catId = $categoryIds[$p[3]] ?? null;
        $pdo->prepare("INSERT INTO products (id, name, barcode, sku, category_id, brand, retail_price, wholesale_price, cost_price, stock, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([$id, $p[0], $p[1], $p[2], $catId, $p[4], $p[5], $p[6], $p[7], $p[8], $branchId]);
    }

    // Sample customers
    $customers = [
        ['Budi Santoso', '081234567891', 'budi@email.com', 'Jl. Merdeka No. 10', 'retail', 'Honda Beat 2020 - B 1234 XY'],
        ['Toko Jaya Motor', '081234567892', 'jaya@email.com', 'Jl. Raya No. 5', 'wholesale', ''],
        ['Ahmad Fadillah', '081234567893', 'ahmad@email.com', 'Jl. Anggrek No. 3', 'retail', 'Yamaha NMAX 2021 - B 5678 AB'],
        ['CV Berkah Parts', '081234567894', 'berkah@email.com', 'Jl. Industri No. 12', 'wholesale', ''],
        ['Siti Nurhaliza', '081234567895', 'siti@email.com', 'Jl. Melati No. 7', 'retail', 'Honda Vario 150 2022 - B 9012 CD']
    ];

    foreach ($customers as $c) {
        $id = generateId();
        $pdo->prepare("INSERT INTO customers (id, name, phone, email, address, customer_type, vehicle_info) VALUES (?, ?, ?, ?, ?, ?, ?)")
            ->execute([$id, $c[0], $c[1], $c[2], $c[3], $c[4], $c[5]]);
    }

    // Default settings
    $settings = [
        ['store_name', 'Bungoil Motor Parts'],
        ['store_address', 'Jl. Utama No. 1, Jakarta'],
        ['store_phone', '081234567890'],
        ['store_email', 'bungoil@email.com'],
        ['tax_rate', '0'],
        ['receipt_footer', 'Terima kasih atas kunjungan Anda!'],
        ['currency_symbol', 'Rp'],
    ];

    foreach ($settings as $s) {
        $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")
            ->execute([$s[0], $s[1]]);
    }

    echo "Database seeded successfully!\n";
}

// Run initialization
initializeDatabase();
seedDatabase();
