const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function getStoreLogo() {
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'store_logo'").get();
    if (setting && setting.value) {
      const logoPath = path.join(__dirname, '../../uploads', setting.value);
      if (fs.existsSync(logoPath)) return logoPath;
    }
  } catch {}
  return null;
}

function getStoreName() {
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'store_name'").get();
    return setting?.value || 'Bung Oil POS';
  } catch { return 'Bung Oil POS'; }
}

function addPdfHeader(doc, title) {
  const storeName = getStoreName();
  const logoPath = getStoreLogo();
  let yPos = 40;

  if (logoPath) {
    try {
      doc.image(logoPath, 40, yPos, { width: 50, height: 50 });
      doc.fontSize(18).font('Helvetica-Bold').text(storeName, 100, yPos + 5);
      doc.fontSize(10).font('Helvetica').text(title, 100, yPos + 28);
      yPos += 60;
    } catch {
      doc.fontSize(18).font('Helvetica-Bold').text(storeName, 40, yPos);
      doc.fontSize(10).font('Helvetica').text(title, 40, yPos + 25);
      yPos += 50;
    }
  } else {
    doc.fontSize(18).font('Helvetica-Bold').text(storeName, 40, yPos);
    doc.fontSize(10).font('Helvetica').text(title, 40, yPos + 25);
    yPos += 50;
  }

  const now = new Date();
  doc.fontSize(8).text(`Dicetak: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`, 40, yPos);
  yPos += 20;

  doc.moveTo(40, yPos).lineTo(doc.page.width - 40, yPos).stroke();
  return yPos + 10;
}

const exportImportController = {
  // ============ PRODUCTS EXPORT ============
  async exportProductsExcel(req, res) {
    try {
      const products = db.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1 ORDER BY p.name ASC
      `).all();

      const workbook = new ExcelJS.Workbook();
      workbook.creator = getStoreName();
      const sheet = workbook.addWorksheet('Produk & Stok');

      sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Produk', key: 'name', width: 30 },
        { header: 'Barcode', key: 'barcode', width: 15 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Kategori', key: 'category_name', width: 18 },
        { header: 'Brand', key: 'brand', width: 15 },
        { header: 'Satuan', key: 'unit', width: 8 },
        { header: 'Harga Eceran', key: 'retail_price', width: 15 },
        { header: 'Harga Grosir', key: 'wholesale_price', width: 15 },
        { header: 'Min Qty Grosir', key: 'wholesale_min_qty', width: 14 },
        { header: 'Harga Modal', key: 'cost_price', width: 15 },
        { header: 'Stok', key: 'stock', width: 8 },
        { header: 'Min Stok', key: 'min_stock', width: 8 },
        { header: 'Lokasi', key: 'location', width: 12 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      products.forEach((p, i) => {
        sheet.addRow({
          no: i + 1, name: p.name, barcode: p.barcode || '', sku: p.sku || '',
          category_name: p.category_name || '', brand: p.brand || '', unit: p.unit || 'pcs',
          retail_price: p.retail_price, wholesale_price: p.wholesale_price,
          wholesale_min_qty: p.wholesale_min_qty, cost_price: p.cost_price,
          stock: p.stock, min_stock: p.min_stock, location: p.location || ''
        });
      });

      ['H', 'I', 'K'].forEach(col => {
        sheet.getColumn(col).numFmt = '#,##0';
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=produk-stok-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal export produk: ' + error.message });
    }
  },

  exportProductsPdf(req, res) {
    try {
      const products = db.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1 ORDER BY p.name ASC
      `).all();

      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=produk-stok-${Date.now()}.pdf`);
      doc.pipe(res);

      let yPos = addPdfHeader(doc, 'Laporan Produk & Stok');

      const cols = [
        { header: 'No', x: 40, width: 25 },
        { header: 'Nama Produk', x: 65, width: 150 },
        { header: 'SKU', x: 215, width: 70 },
        { header: 'Kategori', x: 285, width: 80 },
        { header: 'Brand', x: 365, width: 65 },
        { header: 'Harga Eceran', x: 430, width: 80 },
        { header: 'Harga Grosir', x: 510, width: 80 },
        { header: 'HPP', x: 590, width: 70 },
        { header: 'Stok', x: 660, width: 35 },
        { header: 'Min', x: 695, width: 30 },
        { header: 'Lokasi', x: 725, width: 55 },
      ];

      doc.fontSize(7).font('Helvetica-Bold');
      cols.forEach(col => doc.text(col.header, col.x, yPos, { width: col.width }));
      yPos += 15;
      doc.moveTo(40, yPos).lineTo(780, yPos).stroke();
      yPos += 5;

      doc.font('Helvetica').fontSize(7);
      const formatRp = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

      products.forEach((p, i) => {
        if (yPos > 540) {
          doc.addPage();
          yPos = addPdfHeader(doc, 'Laporan Produk & Stok');
          doc.fontSize(7).font('Helvetica-Bold');
          cols.forEach(col => doc.text(col.header, col.x, yPos, { width: col.width }));
          yPos += 15;
          doc.moveTo(40, yPos).lineTo(780, yPos).stroke();
          yPos += 5;
          doc.font('Helvetica').fontSize(7);
        }

        doc.text(String(i + 1), cols[0].x, yPos, { width: cols[0].width });
        doc.text(p.name || '', cols[1].x, yPos, { width: cols[1].width });
        doc.text(p.sku || '', cols[2].x, yPos, { width: cols[2].width });
        doc.text(p.category_name || '', cols[3].x, yPos, { width: cols[3].width });
        doc.text(p.brand || '', cols[4].x, yPos, { width: cols[4].width });
        doc.text(formatRp(p.retail_price), cols[5].x, yPos, { width: cols[5].width });
        doc.text(formatRp(p.wholesale_price), cols[6].x, yPos, { width: cols[6].width });
        doc.text(formatRp(p.cost_price), cols[7].x, yPos, { width: cols[7].width });
        doc.text(String(p.stock), cols[8].x, yPos, { width: cols[8].width });
        doc.text(String(p.min_stock), cols[9].x, yPos, { width: cols[9].width });
        doc.text(p.location || '', cols[10].x, yPos, { width: cols[10].width });
        yPos += 14;
      });

      doc.fontSize(8).font('Helvetica-Bold');
      yPos += 10;
      doc.text(`Total: ${products.length} produk`, 40, yPos);

      doc.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal export PDF: ' + error.message });
    }
  },

  async importProducts(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'File Excel diperlukan' });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const sheet = workbook.worksheets[0];

      if (!sheet) return res.status(400).json({ error: 'File Excel kosong' });

      const categories = db.prepare('SELECT * FROM categories').all();
      const catMap = {};
      categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

      let imported = 0;
      let updated = 0;
      let errors = [];

      const importTransaction = db.transaction(() => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const name = row.getCell(2).value?.toString()?.trim();
          if (!name) return;

          const barcode = row.getCell(3).value?.toString()?.trim() || null;
          const sku = row.getCell(4).value?.toString()?.trim() || null;
          const categoryName = row.getCell(5).value?.toString()?.trim() || '';
          const brand = row.getCell(6).value?.toString()?.trim() || null;
          const unit = row.getCell(7).value?.toString()?.trim() || 'pcs';
          const retail_price = parseFloat(row.getCell(8).value) || 0;
          const wholesale_price = parseFloat(row.getCell(9).value) || 0;
          const wholesale_min_qty = parseInt(row.getCell(10).value) || 12;
          const cost_price = parseFloat(row.getCell(11).value) || 0;
          const stock = parseInt(row.getCell(12).value) || 0;
          const min_stock = parseInt(row.getCell(13).value) || 5;
          const location = row.getCell(14).value?.toString()?.trim() || null;

          let category_id = null;
          if (categoryName) {
            category_id = catMap[categoryName.toLowerCase()] || null;
            if (!category_id) {
              const newCatId = generateId();
              db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(newCatId, categoryName);
              catMap[categoryName.toLowerCase()] = newCatId;
              category_id = newCatId;
            }
          }

          let existing = null;
          if (barcode) existing = db.prepare('SELECT id FROM products WHERE barcode = ?').get(barcode);
          if (!existing && sku) existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);

          if (existing) {
            db.prepare(`
              UPDATE products SET name = ?, category_id = ?, brand = ?, unit = ?,
              retail_price = ?, wholesale_price = ?, wholesale_min_qty = ?, cost_price = ?,
              stock = ?, min_stock = ?, location = ?, updated_at = datetime('now')
              WHERE id = ?
            `).run(name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, location, existing.id);
            updated++;
          } else {
            const id = generateId();
            const generatedSku = sku || `SKU-${Date.now().toString(36).toUpperCase()}-${rowNumber}`;
            db.prepare(`
              INSERT INTO products (id, barcode, sku, name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, location)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, barcode, generatedSku, name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, location);
            imported++;
          }
        });
      });

      importTransaction();

      // Cleanup uploaded file
      try { fs.unlinkSync(req.file.path); } catch {}

      res.json({ message: `Import selesai: ${imported} produk baru, ${updated} produk diperbarui`, imported, updated, errors });
    } catch (error) {
      if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: 'Gagal import produk: ' + error.message });
    }
  },

  // ============ CATEGORIES EXPORT ============
  async exportCategoriesExcel(req, res) {
    try {
      const categories = db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        GROUP BY c.id ORDER BY c.name ASC
      `).all();

      const workbook = new ExcelJS.Workbook();
      workbook.creator = getStoreName();
      const sheet = workbook.addWorksheet('Kategori');

      sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Kategori', key: 'name', width: 30 },
        { header: 'Deskripsi', key: 'description', width: 40 },
        { header: 'Jumlah Produk', key: 'product_count', width: 15 },
        { header: 'Tanggal Dibuat', key: 'created_at', width: 20 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      categories.forEach((c, i) => {
        sheet.addRow({
          no: i + 1, name: c.name, description: c.description || '',
          product_count: c.product_count, created_at: c.created_at || ''
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=kategori-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal export kategori: ' + error.message });
    }
  },

  exportCategoriesPdf(req, res) {
    try {
      const categories = db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        GROUP BY c.id ORDER BY c.name ASC
      `).all();

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=kategori-${Date.now()}.pdf`);
      doc.pipe(res);

      let yPos = addPdfHeader(doc, 'Laporan Kategori');

      const cols = [
        { header: 'No', x: 40, width: 30 },
        { header: 'Nama Kategori', x: 70, width: 150 },
        { header: 'Deskripsi', x: 220, width: 220 },
        { header: 'Jumlah Produk', x: 440, width: 80 },
      ];

      doc.fontSize(9).font('Helvetica-Bold');
      cols.forEach(col => doc.text(col.header, col.x, yPos, { width: col.width }));
      yPos += 18;
      doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
      yPos += 8;

      doc.font('Helvetica').fontSize(9);
      categories.forEach((c, i) => {
        if (yPos > 750) {
          doc.addPage();
          yPos = addPdfHeader(doc, 'Laporan Kategori');
          doc.fontSize(9).font('Helvetica-Bold');
          cols.forEach(col => doc.text(col.header, col.x, yPos, { width: col.width }));
          yPos += 18;
          doc.moveTo(40, yPos).lineTo(555, yPos).stroke();
          yPos += 8;
          doc.font('Helvetica').fontSize(9);
        }

        doc.text(String(i + 1), cols[0].x, yPos, { width: cols[0].width });
        doc.text(c.name, cols[1].x, yPos, { width: cols[1].width });
        doc.text(c.description || '-', cols[2].x, yPos, { width: cols[2].width });
        doc.text(String(c.product_count), cols[3].x, yPos, { width: cols[3].width });
        yPos += 16;
      });

      doc.fontSize(9).font('Helvetica-Bold');
      yPos += 10;
      doc.text(`Total: ${categories.length} kategori`, 40, yPos);
      doc.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal export PDF kategori: ' + error.message });
    }
  },

  async importCategories(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'File Excel diperlukan' });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const sheet = workbook.worksheets[0];

      if (!sheet) return res.status(400).json({ error: 'File Excel kosong' });

      let imported = 0;
      let updated = 0;

      const importTransaction = db.transaction(() => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const name = row.getCell(2).value?.toString()?.trim();
          if (!name) return;
          const description = row.getCell(3).value?.toString()?.trim() || null;

          const existing = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(name);
          if (existing) {
            db.prepare('UPDATE categories SET description = ? WHERE id = ?').run(description, existing.id);
            updated++;
          } else {
            db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(generateId(), name, description);
            imported++;
          }
        });
      });

      importTransaction();
      try { fs.unlinkSync(req.file.path); } catch {}

      res.json({ message: `Import selesai: ${imported} kategori baru, ${updated} kategori diperbarui`, imported, updated });
    } catch (error) {
      if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: 'Gagal import kategori: ' + error.message });
    }
  },

  // ============ WORK ORDERS EXPORT ============
  async exportWorkOrdersExcel(req, res) {
    try {
      const { status, date_from, date_to } = req.query;
      let query = `
        SELECT wo.*, c.name as customer_name, c.phone as customer_phone,
        u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.mechanic_id = u.id WHERE 1=1
      `;
      const params = [];
      if (status) { query += ' AND wo.status = ?'; params.push(status); }
      if (date_from) { query += ' AND date(wo.created_at) >= ?'; params.push(date_from); }
      if (date_to) { query += ' AND date(wo.created_at) <= ?'; params.push(date_to); }
      query += ' ORDER BY wo.created_at DESC';

      const workOrders = db.prepare(query).all(...params);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = getStoreName();
      const sheet = workbook.addWorksheet('Work Order');

      sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'No. Order', key: 'order_number', width: 18 },
        { header: 'Tanggal', key: 'created_at', width: 18 },
        { header: 'Pelanggan', key: 'customer_name', width: 20 },
        { header: 'No. HP', key: 'customer_phone', width: 15 },
        { header: 'Kendaraan', key: 'vehicle', width: 20 },
        { header: 'No. Polisi', key: 'vehicle_plate', width: 12 },
        { header: 'Mekanik', key: 'mechanic_name', width: 18 },
        { header: 'Keluhan', key: 'complaint', width: 25 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Biaya Jasa', key: 'service_fee', width: 14 },
        { header: 'Biaya Part', key: 'parts_total', width: 14 },
        { header: 'Diskon', key: 'discount_amount', width: 12 },
        { header: 'Total', key: 'total_amount', width: 14 },
        { header: 'Pembayaran', key: 'payment_status', width: 12 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      const statusLabels = { pending: 'Menunggu', in_progress: 'Dikerjakan', waiting_parts: 'Tunggu Part', completed: 'Selesai', cancelled: 'Dibatalkan', delivered: 'Diserahkan' };
      const paymentLabels = { paid: 'Lunas', pending: 'Belum', partial: 'Sebagian' };

      workOrders.forEach((wo, i) => {
        sheet.addRow({
          no: i + 1, order_number: wo.order_number, created_at: wo.created_at || '',
          customer_name: wo.customer_name || '-', customer_phone: wo.customer_phone || '',
          vehicle: `${wo.vehicle_type || ''} ${wo.vehicle_year || ''}`.trim(),
          vehicle_plate: wo.vehicle_plate || '', mechanic_name: wo.mechanic_name || '-',
          complaint: wo.complaint || '', status: statusLabels[wo.status] || wo.status,
          service_fee: wo.service_fee, parts_total: wo.parts_total,
          discount_amount: wo.discount_amount, total_amount: wo.total_amount,
          payment_status: paymentLabels[wo.payment_status] || wo.payment_status
        });
      });

      ['K', 'L', 'M', 'N'].forEach(col => {
        sheet.getColumn(col).numFmt = '#,##0';
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=work-orders-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal export work orders: ' + error.message });
    }
  },

  exportWorkOrdersPdf(req, res) {
    try {
      const { status, date_from, date_to } = req.query;
      let query = `
        SELECT wo.*, c.name as customer_name, u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.mechanic_id = u.id WHERE 1=1
      `;
      const params = [];
      if (status) { query += ' AND wo.status = ?'; params.push(status); }
      if (date_from) { query += ' AND date(wo.created_at) >= ?'; params.push(date_from); }
      if (date_to) { query += ' AND date(wo.created_at) <= ?'; params.push(date_to); }
      query += ' ORDER BY wo.created_at DESC';

      const workOrders = db.prepare(query).all(...params);

      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=work-orders-${Date.now()}.pdf`);
      doc.pipe(res);

      let yPos = addPdfHeader(doc, 'Laporan Work Order');

      const statusLabels = { pending: 'Menunggu', in_progress: 'Dikerjakan', waiting_parts: 'Tunggu Part', completed: 'Selesai', cancelled: 'Dibatalkan', delivered: 'Diserahkan' };
      const formatRp = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

      const cols = [
        { header: 'No', x: 40, width: 25 },
        { header: 'No. Order', x: 65, width: 85 },
        { header: 'Tanggal', x: 150, width: 70 },
        { header: 'Pelanggan', x: 220, width: 100 },
        { header: 'Kendaraan', x: 320, width: 80 },
        { header: 'Mekanik', x: 400, width: 80 },
        { header: 'Status', x: 480, width: 60 },
        { header: 'Jasa', x: 540, width: 65 },
        { header: 'Part', x: 605, width: 65 },
        { header: 'Total', x: 670, width: 70 },
        { header: 'Bayar', x: 740, width: 45 },
      ];

      doc.fontSize(7).font('Helvetica-Bold');
      cols.forEach(col => doc.text(col.header, col.x, yPos, { width: col.width }));
      yPos += 15;
      doc.moveTo(40, yPos).lineTo(780, yPos).stroke();
      yPos += 5;

      doc.font('Helvetica').fontSize(7);
      workOrders.forEach((wo, i) => {
        if (yPos > 540) {
          doc.addPage();
          yPos = addPdfHeader(doc, 'Laporan Work Order');
          doc.fontSize(7).font('Helvetica-Bold');
          cols.forEach(col => doc.text(col.header, col.x, yPos, { width: col.width }));
          yPos += 15;
          doc.moveTo(40, yPos).lineTo(780, yPos).stroke();
          yPos += 5;
          doc.font('Helvetica').fontSize(7);
        }

        const date = wo.created_at ? new Date(wo.created_at).toLocaleDateString('id-ID') : '';

        doc.text(String(i + 1), cols[0].x, yPos, { width: cols[0].width });
        doc.text(wo.order_number, cols[1].x, yPos, { width: cols[1].width });
        doc.text(date, cols[2].x, yPos, { width: cols[2].width });
        doc.text(wo.customer_name || '-', cols[3].x, yPos, { width: cols[3].width });
        doc.text(`${wo.vehicle_type || ''} ${wo.vehicle_plate || ''}`.trim(), cols[4].x, yPos, { width: cols[4].width });
        doc.text(wo.mechanic_name || '-', cols[5].x, yPos, { width: cols[5].width });
        doc.text(statusLabels[wo.status] || wo.status, cols[6].x, yPos, { width: cols[6].width });
        doc.text(formatRp(wo.service_fee), cols[7].x, yPos, { width: cols[7].width });
        doc.text(formatRp(wo.parts_total), cols[8].x, yPos, { width: cols[8].width });
        doc.text(formatRp(wo.total_amount), cols[9].x, yPos, { width: cols[9].width });
        doc.text(wo.payment_status === 'paid' ? 'Lunas' : wo.payment_status === 'partial' ? 'Sebagian' : 'Belum', cols[10].x, yPos, { width: cols[10].width });
        yPos += 14;
      });

      doc.fontSize(8).font('Helvetica-Bold');
      yPos += 10;
      doc.text(`Total: ${workOrders.length} work order`, 40, yPos);
      doc.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal export PDF work orders: ' + error.message });
    }
  },

  async importWorkOrders(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'File Excel diperlukan' });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      const sheet = workbook.worksheets[0];

      if (!sheet) return res.status(400).json({ error: 'File Excel kosong' });

      const customers = db.prepare('SELECT * FROM customers').all();
      const custMap = {};
      customers.forEach(c => { custMap[c.name.toLowerCase()] = c.id; });

      const mechanics = db.prepare("SELECT * FROM users WHERE role = 'mekanik'").all();
      const mechMap = {};
      mechanics.forEach(m => { mechMap[m.full_name.toLowerCase()] = m.id; });

      let imported = 0;

      const importTransaction = db.transaction(() => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const order_number = row.getCell(2).value?.toString()?.trim();
          if (!order_number) return;

          const existing = db.prepare('SELECT id FROM work_orders WHERE order_number = ?').get(order_number);
          if (existing) return;

          const customerName = row.getCell(4).value?.toString()?.trim() || '';
          const vehicle_plate = row.getCell(7).value?.toString()?.trim() || null;
          const mechanicName = row.getCell(8).value?.toString()?.trim() || '';
          const complaint = row.getCell(9).value?.toString()?.trim() || null;
          const status = row.getCell(10).value?.toString()?.trim()?.toLowerCase() || 'pending';
          const service_fee = parseFloat(row.getCell(11).value) || 0;
          const parts_total = parseFloat(row.getCell(12).value) || 0;
          const discount_amount = parseFloat(row.getCell(13).value) || 0;
          const total_amount = parseFloat(row.getCell(14).value) || 0;

          const customer_id = customerName ? (custMap[customerName.toLowerCase()] || null) : null;
          const mechanic_id = mechanicName ? (mechMap[mechanicName.toLowerCase()] || null) : null;

          const statusMap = { menunggu: 'pending', dikerjakan: 'in_progress', 'tunggu part': 'waiting_parts', selesai: 'completed', dibatalkan: 'cancelled', diserahkan: 'delivered' };
          const mappedStatus = statusMap[status] || status;
          const validStatuses = ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'delivered'];
          const finalStatus = validStatuses.includes(mappedStatus) ? mappedStatus : 'pending';

          const vehicleText = row.getCell(6).value?.toString()?.trim() || '';

          db.prepare(`
            INSERT INTO work_orders (id, order_number, customer_id, mechanic_id, vehicle_type, vehicle_plate, complaint, status, service_fee, parts_total, discount_amount, total_amount, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(generateId(), order_number, customer_id, mechanic_id, vehicleText, vehicle_plate, complaint, finalStatus, service_fee, parts_total, discount_amount, total_amount, 'pending');

          imported++;
        });
      });

      importTransaction();
      try { fs.unlinkSync(req.file.path); } catch {}

      res.json({ message: `Import selesai: ${imported} work order baru`, imported });
    } catch (error) {
      if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: 'Gagal import work orders: ' + error.message });
    }
  },

  // ============ TEMPLATE DOWNLOAD ============
  async downloadTemplate(req, res) {
    try {
      const { type } = req.params;
      const workbook = new ExcelJS.Workbook();

      if (type === 'products') {
        const sheet = workbook.addWorksheet('Template Produk');
        sheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'Nama Produk *', key: 'name', width: 30 },
          { header: 'Barcode', key: 'barcode', width: 15 },
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Kategori', key: 'category', width: 18 },
          { header: 'Brand', key: 'brand', width: 15 },
          { header: 'Satuan', key: 'unit', width: 8 },
          { header: 'Harga Eceran', key: 'retail_price', width: 15 },
          { header: 'Harga Grosir', key: 'wholesale_price', width: 15 },
          { header: 'Min Qty Grosir', key: 'wholesale_min_qty', width: 14 },
          { header: 'Harga Modal', key: 'cost_price', width: 15 },
          { header: 'Stok', key: 'stock', width: 8 },
          { header: 'Min Stok', key: 'min_stock', width: 8 },
          { header: 'Lokasi', key: 'location', width: 12 },
        ];
        sheet.addRow({ no: 1, name: 'Contoh Oli 10W-40', barcode: '123456', sku: 'SKU-001', category: 'Oli & Pelumas', brand: 'Yamaha', unit: 'pcs', retail_price: 45000, wholesale_price: 40000, wholesale_min_qty: 12, cost_price: 35000, stock: 100, min_stock: 5, location: 'Rak A-1' });
      } else if (type === 'categories') {
        const sheet = workbook.addWorksheet('Template Kategori');
        sheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'Nama Kategori *', key: 'name', width: 30 },
          { header: 'Deskripsi', key: 'description', width: 40 },
        ];
        sheet.addRow({ no: 1, name: 'Contoh Kategori', description: 'Deskripsi kategori' });
      } else if (type === 'work-orders') {
        const sheet = workbook.addWorksheet('Template Work Order');
        sheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'No. Order *', key: 'order_number', width: 18 },
          { header: 'Tanggal', key: 'date', width: 18 },
          { header: 'Pelanggan', key: 'customer', width: 20 },
          { header: 'No. HP', key: 'phone', width: 15 },
          { header: 'Kendaraan', key: 'vehicle', width: 20 },
          { header: 'No. Polisi', key: 'plate', width: 12 },
          { header: 'Mekanik', key: 'mechanic', width: 18 },
          { header: 'Keluhan', key: 'complaint', width: 25 },
          { header: 'Status', key: 'status', width: 12 },
          { header: 'Biaya Jasa', key: 'service_fee', width: 14 },
          { header: 'Biaya Part', key: 'parts_total', width: 14 },
          { header: 'Diskon', key: 'discount', width: 12 },
          { header: 'Total', key: 'total', width: 14 },
        ];
        sheet.addRow({ no: 1, order_number: 'WO-250101-001', date: '2025-01-01', customer: 'John', phone: '081234567890', vehicle: 'Honda Beat 2022', plate: 'B 1234 XY', mechanic: 'Mekanik 1', complaint: 'Servis rutin', status: 'Menunggu', service_fee: 50000, parts_total: 100000, discount: 0, total: 150000 });
      } else {
        return res.status(400).json({ error: 'Tipe template tidak valid' });
      }

      const headerRow = workbook.worksheets[0].getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=template-${type}-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ error: 'Gagal download template: ' + error.message });
    }
  }
};

module.exports = exportImportController;
