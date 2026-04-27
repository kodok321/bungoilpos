require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('../config/database');
const { generateId } = require('../utils/helpers');

initializeDatabase();

const seed = db.transaction(() => {
  console.log('Seeding database...');

  // Default branch
  const branchId = generateId();
  db.prepare('INSERT OR IGNORE INTO branches (id, name, address, phone) VALUES (?, ?, ?, ?)').run(
    branchId, 'Toko Pusat', 'Jl. Utama No. 1', '081234567890'
  );

  // Default admin user (password: admin123)
  const adminId = generateId();
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    adminId, 'admin', adminPassword, 'Administrator', 'admin', branchId
  );

  // Default kasir user (password: kasir123)
  const kasirId = generateId();
  const kasirPassword = bcrypt.hashSync('kasir123', 10);
  db.prepare('INSERT OR IGNORE INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    kasirId, 'kasir', kasirPassword, 'Kasir 1', 'kasir', branchId
  );

  // Default mekanik user (password: mekanik123)
  const mekanikId = generateId();
  const mekanikPassword = bcrypt.hashSync('mekanik123', 10);
  db.prepare('INSERT OR IGNORE INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)').run(
    mekanikId, 'mekanik', mekanikPassword, 'Mekanik 1', 'mekanik', branchId
  );

  // Categories
  const categories = [
    { name: 'Oli & Pelumas', desc: 'Oli mesin, oli gardan, grease' },
    { name: 'Filter', desc: 'Filter oli, filter udara, filter bensin' },
    { name: 'Rem', desc: 'Kampas rem, disc brake, master rem' },
    { name: 'Kelistrikan', desc: 'Aki, lampu, kabel, relay' },
    { name: 'Mesin', desc: 'Piston, ring, klep, gasket' },
    { name: 'Body & Exterior', desc: 'Spion, bumper, lampu depan' },
    { name: 'Ban & Velg', desc: 'Ban motor, ban mobil, velg' },
    { name: 'Rantai & Gear', desc: 'Rantai, gear depan, gear belakang' },
    { name: 'Busi', desc: 'Busi standar, busi iridium' },
    { name: 'Aksesoris', desc: 'Helm, sarung tangan, dll' }
  ];

  const categoryIds = {};
  for (const cat of categories) {
    const id = generateId();
    categoryIds[cat.name] = id;
    db.prepare('INSERT OR IGNORE INTO categories (id, name, description) VALUES (?, ?, ?)').run(id, cat.name, cat.desc);
  }

  // Sample products
  const products = [
    { name: 'Oli Yamalube 10W-40 0.8L', barcode: '8991111111', category: 'Oli & Pelumas', brand: 'Yamaha', retail: 45000, wholesale: 40000, cost: 35000, stock: 100 },
    { name: 'Oli AHM SPX2 0.8L', barcode: '8991111112', category: 'Oli & Pelumas', brand: 'Honda', retail: 48000, wholesale: 43000, cost: 37000, stock: 80 },
    { name: 'Oli Shell Helix HX5 1L', barcode: '8991111113', category: 'Oli & Pelumas', brand: 'Shell', retail: 85000, wholesale: 75000, cost: 65000, stock: 50 },
    { name: 'Filter Oli Honda Beat', barcode: '8991111114', category: 'Filter', brand: 'Honda', retail: 25000, wholesale: 20000, cost: 15000, stock: 60 },
    { name: 'Filter Udara Vario 125', barcode: '8991111115', category: 'Filter', brand: 'Honda', retail: 35000, wholesale: 30000, cost: 22000, stock: 40 },
    { name: 'Kampas Rem Depan Beat', barcode: '8991111116', category: 'Rem', brand: 'Honda', retail: 30000, wholesale: 25000, cost: 18000, stock: 45 },
    { name: 'Disc Brake Vario', barcode: '8991111117', category: 'Rem', brand: 'Honda', retail: 120000, wholesale: 105000, cost: 85000, stock: 20 },
    { name: 'Aki Yuasa GTZ5S', barcode: '8991111118', category: 'Kelistrikan', brand: 'Yuasa', retail: 185000, wholesale: 165000, cost: 140000, stock: 25 },
    { name: 'Lampu LED H6 Autovision', barcode: '8991111119', category: 'Kelistrikan', brand: 'Autovision', retail: 75000, wholesale: 65000, cost: 50000, stock: 30 },
    { name: 'Busi NGK CPR9EA-9', barcode: '8991111120', category: 'Busi', brand: 'NGK', retail: 35000, wholesale: 30000, cost: 22000, stock: 100 },
    { name: 'Busi Denso Iridium IU27', barcode: '8991111121', category: 'Busi', brand: 'Denso', retail: 85000, wholesale: 75000, cost: 60000, stock: 50 },
    { name: 'Rantai SSS 428H-130', barcode: '8991111122', category: 'Rantai & Gear', brand: 'SSS', retail: 95000, wholesale: 85000, cost: 70000, stock: 30 },
    { name: 'Gear Set Sinnob Jupiter', barcode: '8991111123', category: 'Rantai & Gear', brand: 'Sinnob', retail: 250000, wholesale: 225000, cost: 185000, stock: 15 },
    { name: 'Ban FDR Sport XR Evo 80/80-17', barcode: '8991111124', category: 'Ban & Velg', brand: 'FDR', retail: 195000, wholesale: 175000, cost: 150000, stock: 20 },
    { name: 'Ban IRC NR73 90/90-14', barcode: '8991111125', category: 'Ban & Velg', brand: 'IRC', retail: 165000, wholesale: 150000, cost: 125000, stock: 25 },
    { name: 'Piston Kit Honda Beat', barcode: '8991111126', category: 'Mesin', brand: 'Honda', retail: 150000, wholesale: 135000, cost: 105000, stock: 10 },
    { name: 'Gasket Set Top Vario', barcode: '8991111127', category: 'Mesin', brand: 'Honda', retail: 45000, wholesale: 38000, cost: 28000, stock: 20 },
    { name: 'Spion Kiri Honda Beat', barcode: '8991111128', category: 'Body & Exterior', brand: 'Honda', retail: 55000, wholesale: 48000, cost: 35000, stock: 30 },
    { name: 'V-Belt Honda Vario 125', barcode: '8991111129', category: 'Mesin', brand: 'Honda', retail: 120000, wholesale: 105000, cost: 85000, stock: 15 },
    { name: 'Roller Set Honda Beat', barcode: '8991111130', category: 'Mesin', brand: 'Honda', retail: 65000, wholesale: 55000, cost: 42000, stock: 25 }
  ];

  for (const p of products) {
    const id = generateId();
    db.prepare(`
      INSERT OR IGNORE INTO products (id, barcode, sku, name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, 'pcs', ?, ?, 12, ?, ?, 5, ?)
    `).run(id, p.barcode, `SKU-${p.barcode.slice(-4)}`, p.name, categoryIds[p.category], p.brand, p.retail, p.wholesale, p.cost, p.stock, branchId);
  }

  // Sample customers
  const customers = [
    { name: 'Budi Santoso', phone: '081234567891', type: 'retail', vehicle: 'Honda Beat 2020' },
    { name: 'Toko Jaya Motor', phone: '081234567892', type: 'wholesale', vehicle: null },
    { name: 'Agus Setiawan', phone: '081234567893', type: 'retail', vehicle: 'Yamaha NMAX 2022' },
    { name: 'CV. Sumber Rezeki', phone: '081234567894', type: 'wholesale', vehicle: null },
    { name: 'Dedi Kurniawan', phone: '081234567895', type: 'retail', vehicle: 'Honda Vario 125 2021' }
  ];

  for (const c of customers) {
    db.prepare('INSERT OR IGNORE INTO customers (id, name, phone, customer_type, vehicle_info) VALUES (?, ?, ?, ?, ?)').run(
      generateId(), c.name, c.phone, c.type, c.vehicle
    );
  }

  // Default settings
  const defaultSettings = {
    store_name: 'Toko Sparepart & Bengkel',
    store_address: 'Jl. Utama No. 1',
    store_phone: '081234567890',
    tax_rate: '0',
    receipt_footer: 'Terima kasih atas kunjungan Anda!',
    currency: 'IDR',
    printer_type: 'thermal',
    printer_width: '80'
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }

  console.log('Seed completed!');
  console.log('Default users:');
  console.log('  admin / admin123 (Admin)');
  console.log('  kasir / kasir123 (Kasir)');
  console.log('  mekanik / mekanik123 (Mekanik)');
});

seed();
process.exit(0);
