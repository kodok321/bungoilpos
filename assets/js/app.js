let currentUser = null;
let currentPage = 'dashboard';

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await API.getProfile();
        showApp();
        navigateTo('dashboard');
    } catch {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('app-page').classList.add('hidden');
}

function showApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app-page').classList.remove('hidden');
    renderSidebar();
}

// ========== LOGIN ==========
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Memproses...';
    try {
        const result = await API.login({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        });
        currentUser = result.user;
        showApp();
        navigateTo('dashboard');
        showToast('Login berhasil!');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Masuk';
    }
});

// ========== SIDEBAR ==========
function renderSidebar() {
    const role = currentUser.role;
    const nav = document.getElementById('sidebar-nav');
    const items = [
        { id: 'dashboard', icon: 'home', label: 'Dashboard', roles: ['admin','kasir','mekanik','owner'] },
        { id: 'pos', icon: 'cart', label: 'Kasir (POS)', roles: ['admin','kasir','owner'] },
        { id: 'products', icon: 'cube', label: 'Produk', roles: ['admin','kasir','owner'] },
        { id: 'categories', icon: 'tag', label: 'Kategori', roles: ['admin','owner'] },
        { id: 'work-orders', icon: 'wrench', label: 'Work Order', roles: ['admin','kasir','mekanik','owner'] },
        { id: 'customers', icon: 'users', label: 'Pelanggan', roles: ['admin','kasir','owner'] },
        { id: 'transactions', icon: 'receipt', label: 'Transaksi', roles: ['admin','kasir','owner'] },
        { id: 'reports', icon: 'chart', label: 'Laporan', roles: ['admin','owner'] },
        { id: 'expenses', icon: 'money', label: 'Pengeluaran', roles: ['admin','owner'] },
        { id: 'users', icon: 'user-cog', label: 'Pengguna', roles: ['admin','owner'] },
        { id: 'branches', icon: 'building', label: 'Cabang', roles: ['admin','owner'] },
        { id: 'settings', icon: 'settings', label: 'Pengaturan', roles: ['admin','owner'] },
    ];

    nav.innerHTML = items.filter(i => i.roles.includes(role)).map(item => `
        <div class="nav-item ${currentPage === item.id ? 'active' : ''}" onclick="navigateTo('${item.id}')">
            ${getIcon(item.icon)}
            <span>${item.label}</span>
        </div>
    `).join('');

    document.getElementById('user-name').textContent = currentUser.full_name;
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('user-avatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
}

async function handleLogout() {
    try {
        await API.logout();
    } catch {}
    currentUser = null;
    showLogin();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// ========== NAVIGATION ==========
function navigateTo(page) {
    currentPage = page;
    renderSidebar();
    const content = document.getElementById('page-content');
    document.querySelector('.sidebar').classList.remove('open');

    switch(page) {
        case 'dashboard': renderDashboard(content); break;
        case 'pos': renderPOS(content); break;
        case 'products': renderProducts(content); break;
        case 'categories': renderCategories(content); break;
        case 'work-orders': renderWorkOrders(content); break;
        case 'customers': renderCustomers(content); break;
        case 'transactions': renderTransactions(content); break;
        case 'reports': renderReports(content); break;
        case 'expenses': renderExpenses(content); break;
        case 'users': renderUsers(content); break;
        case 'branches': renderBranches(content); break;
        case 'settings': renderSettings(content); break;
        default: content.innerHTML = '<p>Halaman tidak ditemukan</p>';
    }
}

// ========== DASHBOARD ==========
async function renderDashboard(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await API.getDashboard();
        el.innerHTML = `
            <div class="page-header"><h1>Dashboard</h1><p>Ringkasan bisnis Anda hari ini</p></div>
            <div class="grid grid-3 gap-4 mb-4">
                <div class="card stat-card">
                    <div class="stat-icon green">${getIcon('money')}</div>
                    <div><div class="stat-value">${formatCurrency(data.today_sales.total)}</div>
                    <div class="stat-label">Penjualan Hari Ini</div>
                    <div class="stat-sub">${data.today_sales.count} transaksi</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon blue">${getIcon('cart')}</div>
                    <div><div class="stat-value">${formatCurrency(data.month_sales.total)}</div>
                    <div class="stat-label">Penjualan Bulan Ini</div>
                    <div class="stat-sub">${data.month_sales.count} transaksi</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon orange">${getIcon('wrench')}</div>
                    <div><div class="stat-value">${data.active_work_orders.count}</div>
                    <div class="stat-label">Work Order Aktif</div>
                    <div class="stat-sub">${data.today_work_orders.count} hari ini</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon red">${getIcon('alert')}</div>
                    <div><div class="stat-value">${data.low_stock_products.count}</div>
                    <div class="stat-label">Stok Menipis</div>
                    <div class="stat-sub">dari ${data.total_products.count} produk</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon purple">${getIcon('cube')}</div>
                    <div><div class="stat-value">${data.total_products.count}</div>
                    <div class="stat-label">Total Produk</div>
                    <div class="stat-sub">produk aktif</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon indigo">${getIcon('users')}</div>
                    <div><div class="stat-value">${data.total_customers.count}</div>
                    <div class="stat-label">Total Pelanggan</div>
                    <div class="stat-sub">pelanggan terdaftar</div></div>
                </div>
            </div>
            <div class="grid grid-2 gap-4">
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold text-lg">Transaksi Terbaru</h3>
                        <a href="#" onclick="navigateTo('transactions');return false" class="text-sm text-blue">Lihat Semua</a>
                    </div>
                    ${data.recent_transactions.length === 0 ? '<p class="text-gray text-center p-4">Belum ada transaksi</p>' :
                    data.recent_transactions.map(t => `
                        <div class="flex justify-between items-center p-2" style="border-bottom:1px solid #f3f4f6">
                            <div><div class="font-semibold text-sm">${escapeHtml(t.invoice_number)}</div>
                            <div class="text-xs text-gray">${escapeHtml(t.customer_name || 'Umum')} &bull; ${formatDate(t.created_at)}</div></div>
                            <div class="text-right"><div class="font-bold text-sm">${formatCurrency(t.total_amount)}</div>
                            <span class="badge ${t.transaction_type === 'wholesale' ? 'badge-purple' : 'badge-blue'}">${t.transaction_type === 'wholesale' ? 'Grosir' : 'Eceran'}</span></div>
                        </div>
                    `).join('')}
                </div>
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold text-lg">Work Order Terbaru</h3>
                        <a href="#" onclick="navigateTo('work-orders');return false" class="text-sm text-blue">Lihat Semua</a>
                    </div>
                    ${data.recent_work_orders.length === 0 ? '<p class="text-gray text-center p-4">Belum ada work order</p>' :
                    data.recent_work_orders.map(wo => `
                        <div class="flex justify-between items-center p-2" style="border-bottom:1px solid #f3f4f6">
                            <div><div class="font-semibold text-sm">${escapeHtml(wo.order_number)}</div>
                            <div class="text-xs text-gray">${escapeHtml(wo.customer_name || '-')} &bull; ${escapeHtml(wo.vehicle_type || '-')}</div></div>
                            <div class="text-right">${getStatusBadge(wo.status)}<div class="text-xs text-gray mt-1">${formatDate(wo.created_at)}</div></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">Gagal memuat dashboard: ${err.message}</p>`; }
}

// ========== POS ==========
let posCart = [];
let posProducts = [];
let posCustomers = [];

async function renderPOS(el) {
    posCart = [];
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const [prodData, custData] = await Promise.all([
            API.getProducts({ limit: 200 }),
            API.getCustomers()
        ]);
        posProducts = prodData.products || [];
        posCustomers = custData;
        renderPOSContent(el);
    } catch (err) { el.innerHTML = `<p class="text-red">Gagal memuat POS: ${err.message}</p>`; }
}

function renderPOSContent(el) {
    el.innerHTML = `
        <div class="page-header"><h1>Kasir (Point of Sale)</h1></div>
        <div class="pos-layout">
            <div class="pos-products card">
                <div class="flex gap-2 mb-3">
                    <div class="search-input flex-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input class="form-control" id="pos-search" placeholder="Cari produk..." oninput="filterPOSProducts()">
                    </div>
                    <input class="form-control" id="pos-barcode" style="width:200px" placeholder="Scan barcode..." onkeydown="handleBarcodeScan(event)">
                </div>
                <div class="product-grid" id="pos-product-grid"></div>
            </div>
            <div class="pos-cart card flex-col">
                <div class="cart-header">
                    <div class="form-row">
                        <div class="form-group" style="margin-bottom:0">
                            <select class="form-control" id="pos-customer"><option value="">Pelanggan Umum</option>
                            ${posCustomers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}</select>
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <select class="form-control" id="pos-type" onchange="updatePOSPrices()">
                                <option value="retail">Eceran</option><option value="wholesale">Grosir</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="cart-items" id="pos-cart-items">
                    <div class="empty-state"><p>Keranjang kosong</p></div>
                </div>
                <div class="cart-summary" id="pos-cart-summary"></div>
                <div class="cart-actions">
                    <div class="form-row mb-2">
                        <select class="form-control" id="pos-payment">
                            <option value="cash">Tunai</option><option value="debit">Debit</option>
                            <option value="credit">Kredit</option><option value="qris">QRIS</option>
                            <option value="transfer">Transfer</option>
                        </select>
                        <input class="form-control" id="pos-paid" type="number" placeholder="Jumlah bayar" oninput="updatePOSSummary()">
                    </div>
                    <div class="form-row mb-2">
                        <input class="form-control" id="pos-discount" type="number" placeholder="Diskon" value="0" oninput="updatePOSSummary()">
                        <button class="btn btn-outline w-full" onclick="posQuickPay()">Uang Pas</button>
                    </div>
                    <button class="btn btn-success btn-lg w-full" onclick="posCheckout()">
                        ${getIcon('cart')} Bayar Sekarang
                    </button>
                </div>
            </div>
        </div>
    `;
    filterPOSProducts();
    updatePOSSummary();
}

function filterPOSProducts() {
    const search = (document.getElementById('pos-search')?.value || '').toLowerCase();
    const grid = document.getElementById('pos-product-grid');
    const filtered = posProducts.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.barcode || '').includes(search) ||
        (p.sku || '').toLowerCase().includes(search) ||
        (p.brand || '').toLowerCase().includes(search)
    );
    const type = document.getElementById('pos-type')?.value || 'retail';
    grid.innerHTML = filtered.length === 0 ? '<p class="text-gray text-center p-4">Produk tidak ditemukan</p>' :
        filtered.map(p => {
            const price = type === 'wholesale' ? p.wholesale_price : p.retail_price;
            return `<div class="product-card" onclick="addToCart('${p.id}')">
                <div class="name">${escapeHtml(p.name)}</div>
                <div class="brand">${escapeHtml(p.brand || '-')}</div>
                <div class="price">${formatCurrency(price)}</div>
                <div class="stock-info ${p.stock <= p.min_stock ? 'stock-low' : ''}">Stok: ${p.stock} ${p.unit || 'pcs'}</div>
            </div>`;
        }).join('');
}

function addToCart(productId) {
    const product = posProducts.find(p => p.id === productId);
    if (!product) return;
    const type = document.getElementById('pos-type')?.value || 'retail';
    const existing = posCart.find(c => c.product_id === productId);
    if (existing) {
        if (existing.quantity >= product.stock) { showToast('Stok tidak mencukupi', 'error'); return; }
        existing.quantity++;
        existing.subtotal = existing.quantity * existing.unit_price;
    } else {
        if (product.stock <= 0) { showToast('Stok habis', 'error'); return; }
        const price = type === 'wholesale' ? product.wholesale_price : product.retail_price;
        posCart.push({ product_id: product.id, name: product.name, unit_price: parseFloat(price), quantity: 1, stock: product.stock, subtotal: parseFloat(price), discount: 0 });
    }
    renderPOSCart();
}

function handleBarcodeScan(e) {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const barcode = e.target.value.trim();
        const product = posProducts.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product.id);
            e.target.value = '';
        } else {
            showToast('Produk tidak ditemukan', 'error');
        }
    }
}

function updatePOSPrices() {
    const type = document.getElementById('pos-type')?.value || 'retail';
    posCart.forEach(item => {
        const product = posProducts.find(p => p.id === item.product_id);
        if (product) {
            item.unit_price = parseFloat(type === 'wholesale' ? product.wholesale_price : product.retail_price);
            item.subtotal = item.quantity * item.unit_price;
        }
    });
    renderPOSCart();
    filterPOSProducts();
}

function renderPOSCart() {
    const container = document.getElementById('pos-cart-items');
    if (posCart.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Keranjang kosong</p></div>';
    } else {
        container.innerHTML = posCart.map((item, i) => `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-price">${formatCurrency(item.unit_price)}</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateCartQty(${i}, ${item.quantity - 1})">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQty(${i}, ${item.quantity + 1})">+</button>
                </div>
                <div class="item-subtotal">${formatCurrency(item.subtotal)}</div>
                <button class="btn-remove" onclick="removeFromCart(${i})">&times;</button>
            </div>
        `).join('');
    }
    updatePOSSummary();
}

function updateCartQty(index, qty) {
    if (qty <= 0) { posCart.splice(index, 1); }
    else {
        if (qty > posCart[index].stock) { showToast('Stok tidak mencukupi', 'error'); return; }
        posCart[index].quantity = qty;
        posCart[index].subtotal = qty * posCart[index].unit_price;
    }
    renderPOSCart();
}

function removeFromCart(index) {
    posCart.splice(index, 1);
    renderPOSCart();
}

function updatePOSSummary() {
    const subtotal = posCart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = parseFloat(document.getElementById('pos-discount')?.value || 0);
    const total = subtotal - discount;
    const paid = parseFloat(document.getElementById('pos-paid')?.value || 0);
    const change = paid - total;

    const summary = document.getElementById('pos-cart-summary');
    if (summary) {
        summary.innerHTML = `
            <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
            ${discount > 0 ? `<div class="summary-row text-red"><span>Diskon</span><span>-${formatCurrency(discount)}</span></div>` : ''}
            <div class="summary-row summary-total"><span>Total</span><span>${formatCurrency(total)}</span></div>
            ${paid > 0 ? `<div class="summary-row"><span>Bayar</span><span>${formatCurrency(paid)}</span></div>
            <div class="summary-row ${change >= 0 ? 'text-green' : 'text-red'}"><span>Kembalian</span><span>${formatCurrency(change)}</span></div>` : ''}
        `;
    }
}

function posQuickPay() {
    const subtotal = posCart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = parseFloat(document.getElementById('pos-discount')?.value || 0);
    document.getElementById('pos-paid').value = subtotal - discount;
    updatePOSSummary();
}

async function posCheckout() {
    if (posCart.length === 0) { showToast('Keranjang kosong', 'error'); return; }
    const paymentMethod = document.getElementById('pos-payment').value;
    const paid = parseFloat(document.getElementById('pos-paid').value || 0);
    const discount = parseFloat(document.getElementById('pos-discount').value || 0);
    const subtotal = posCart.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal - discount;

    if (paymentMethod === 'cash' && paid < total) { showToast('Pembayaran kurang', 'error'); return; }

    try {
        const result = await API.createTransaction({
            customer_id: document.getElementById('pos-customer').value || null,
            transaction_type: document.getElementById('pos-type').value,
            items: posCart.map(c => ({ product_id: c.product_id, quantity: c.quantity, discount: c.discount })),
            discount_amount: discount,
            paid_amount: paymentMethod === 'cash' ? paid : total,
            payment_method: paymentMethod
        });
        showToast('Transaksi berhasil!');
        showReceipt(result.transaction);

        const prodData = await API.getProducts({ limit: 200 });
        posProducts = prodData.products || [];
        posCart = [];
        renderPOSCart();
        filterPOSProducts();
        document.getElementById('pos-discount').value = 0;
        document.getElementById('pos-paid').value = '';
        document.getElementById('pos-customer').value = '';
    } catch (err) { showToast(err.message, 'error'); }
}

function showReceipt(transaction) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Struk Transaksi</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <div class="modal-body">
                <div class="receipt" id="receipt-content">
                    <div class="receipt-header">
                        <h3>Bungoil Motor Parts</h3>
                        <p>${escapeHtml(transaction.invoice_number)}</p>
                        <p>${formatDate(transaction.created_at)}</p>
                    </div>
                    <div class="receipt-divider"></div>
                    ${transaction.customer_name ? `<p>Pelanggan: ${escapeHtml(transaction.customer_name)}</p>` : ''}
                    <div class="receipt-divider"></div>
                    <div class="receipt-items">
                        ${(transaction.items || []).map(item => `
                            <div class="receipt-item">
                                <div>${escapeHtml(item.product_name)}</div>
                                <div class="flex justify-between"><span>${item.quantity} x ${formatCurrency(item.unit_price)}</span><span>${formatCurrency(item.subtotal)}</span></div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="receipt-divider"></div>
                    <div class="flex justify-between"><span>Subtotal</span><span>${formatCurrency(transaction.subtotal)}</span></div>
                    ${transaction.discount_amount > 0 ? `<div class="flex justify-between"><span>Diskon</span><span>-${formatCurrency(transaction.discount_amount)}</span></div>` : ''}
                    <div class="flex justify-between font-bold"><span>Total</span><span>${formatCurrency(transaction.total_amount)}</span></div>
                    <div class="flex justify-between"><span>Bayar (${transaction.payment_method})</span><span>${formatCurrency(transaction.paid_amount)}</span></div>
                    <div class="flex justify-between"><span>Kembalian</span><span>${formatCurrency(transaction.change_amount)}</span></div>
                    <div class="receipt-divider"></div>
                    <div class="receipt-footer"><p>Terima kasih atas kunjungan Anda!</p></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Tutup</button>
                <button class="btn btn-primary" onclick="printReceipt()">Cetak Struk</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function printReceipt() {
    const content = document.getElementById('receipt-content');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Struk</title><style>
        body{font-family:'Courier New',monospace;font-size:12px;max-width:300px;margin:0 auto;padding:10px}
        .receipt-header{text-align:center}.receipt-divider{border-top:1px dashed #000;margin:5px 0}
        .receipt-item{margin:3px 0}.flex{display:flex;justify-content:space-between}
        .font-bold{font-weight:bold}.receipt-footer{text-align:center;margin-top:10px}
        @media print{body{margin:0}}
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}

// ========== PRODUCTS ==========
let productsData = { products: [], pagination: {} };
let productCategories = [];

async function renderProducts(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const [prodData, catData] = await Promise.all([API.getProducts(), API.getCategories()]);
        productsData = prodData;
        productCategories = catData;
        renderProductsContent(el);
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function renderProductsContent(el) {
    const isAdmin = ['admin', 'owner'].includes(currentUser.role);
    el.innerHTML = `
        <div class="page-header flex justify-between items-center">
            <div><h1>Produk</h1><p>Kelola inventaris produk</p></div>
            ${isAdmin ? `<button class="btn btn-primary" onclick="showProductModal()">+ Tambah Produk</button>` : ''}
        </div>
        <div class="filter-bar">
            <div class="search-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input class="form-control" id="product-search" placeholder="Cari produk..." oninput="searchProducts()">
            </div>
            <select class="form-control" style="width:auto" id="product-cat-filter" onchange="searchProducts()">
                <option value="">Semua Kategori</option>
                ${productCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
            <label class="flex items-center gap-2" style="white-space:nowrap">
                <input type="checkbox" id="product-low-stock" onchange="searchProducts()"> Stok Menipis
            </label>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>Nama</th><th>Barcode</th><th>Kategori</th><th>Harga Jual</th><th>Harga Grosir</th><th>HPP</th><th>Stok</th>${isAdmin ? '<th>Aksi</th>' : ''}
                    </tr></thead>
                    <tbody id="products-tbody"></tbody>
                </table>
            </div>
            <div class="pagination" id="products-pagination"></div>
        </div>
    `;
    renderProductsTable();
}

function renderProductsTable() {
    const isAdmin = ['admin', 'owner'].includes(currentUser.role);
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = productsData.products.map(p => `
        <tr>
            <td><div class="font-semibold">${escapeHtml(p.name)}</div><div class="text-xs text-gray">${escapeHtml(p.brand || '-')}</div></td>
            <td class="text-sm">${escapeHtml(p.barcode || '-')}</td>
            <td><span class="badge badge-blue">${escapeHtml(p.category_name || '-')}</span></td>
            <td>${formatCurrency(p.retail_price)}</td>
            <td>${formatCurrency(p.wholesale_price)}</td>
            <td>${formatCurrency(p.cost_price)}</td>
            <td><span class="${p.stock <= p.min_stock ? 'text-red font-bold' : ''}">${p.stock}</span> ${escapeHtml(p.unit || 'pcs')}</td>
            ${isAdmin ? `<td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline" onclick="showStockModal('${p.id}')">Stok</button>
                    <button class="btn btn-sm btn-primary" onclick="showProductModal('${p.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Hapus</button>
                </div>
            </td>` : ''}
        </tr>
    `).join('');

    const pag = productsData.pagination;
    const pagEl = document.getElementById('products-pagination');
    if (pagEl && pag.total_pages > 1) {
        let html = `<button ${pag.page <= 1 ? 'disabled' : ''} onclick="loadProductsPage(${pag.page - 1})">Prev</button>`;
        for (let i = 1; i <= pag.total_pages; i++) {
            html += `<button class="${i === pag.page ? 'active' : ''}" onclick="loadProductsPage(${i})">${i}</button>`;
        }
        html += `<button ${pag.page >= pag.total_pages ? 'disabled' : ''} onclick="loadProductsPage(${pag.page + 1})">Next</button>`;
        pagEl.innerHTML = html;
    }
}

async function searchProducts() {
    const search = document.getElementById('product-search')?.value || '';
    const catId = document.getElementById('product-cat-filter')?.value || '';
    const lowStock = document.getElementById('product-low-stock')?.checked || false;
    try {
        productsData = await API.getProducts({ search, category_id: catId, low_stock: lowStock, page: 1 });
        renderProductsTable();
    } catch (err) { showToast(err.message, 'error'); }
}

async function loadProductsPage(page) {
    const search = document.getElementById('product-search')?.value || '';
    const catId = document.getElementById('product-cat-filter')?.value || '';
    const lowStock = document.getElementById('product-low-stock')?.checked || false;
    try {
        productsData = await API.getProducts({ search, category_id: catId, low_stock: lowStock, page });
        renderProductsTable();
    } catch (err) { showToast(err.message, 'error'); }
}

async function showProductModal(id = null) {
    let product = null;
    if (id) {
        try { product = await API.getProduct(id); } catch (err) { showToast(err.message, 'error'); return; }
    }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal modal-lg">
            <div class="modal-header"><h3>${product ? 'Edit' : 'Tambah'} Produk</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form id="product-form" onsubmit="saveProduct(event, '${id || ''}')">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>Nama Produk *</label><input class="form-control" name="name" value="${escapeHtml(product?.name || '')}" required></div>
                        <div class="form-group"><label>Brand</label><input class="form-control" name="brand" value="${escapeHtml(product?.brand || '')}"></div>
                    </div>
                    <div class="form-row-3">
                        <div class="form-group"><label>Barcode</label><input class="form-control" name="barcode" value="${escapeHtml(product?.barcode || '')}"></div>
                        <div class="form-group"><label>SKU</label><input class="form-control" name="sku" value="${escapeHtml(product?.sku || '')}"></div>
                        <div class="form-group"><label>Kategori</label><select class="form-control" name="category_id">
                            <option value="">Pilih Kategori</option>
                            ${productCategories.map(c => `<option value="${c.id}" ${product?.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                        </select></div>
                    </div>
                    <div class="form-row-3">
                        <div class="form-group"><label>Harga Jual *</label><input class="form-control" name="retail_price" type="number" value="${product?.retail_price || ''}" required></div>
                        <div class="form-group"><label>Harga Grosir</label><input class="form-control" name="wholesale_price" type="number" value="${product?.wholesale_price || ''}"></div>
                        <div class="form-group"><label>HPP</label><input class="form-control" name="cost_price" type="number" value="${product?.cost_price || ''}"></div>
                    </div>
                    <div class="form-row-3">
                        <div class="form-group"><label>Stok</label><input class="form-control" name="stock" type="number" value="${product?.stock || 0}"></div>
                        <div class="form-group"><label>Min. Stok</label><input class="form-control" name="min_stock" type="number" value="${product?.min_stock || 5}"></div>
                        <div class="form-group"><label>Satuan</label><input class="form-control" name="unit" value="${escapeHtml(product?.unit || 'pcs')}"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Min. Qty Grosir</label><input class="form-control" name="wholesale_min_qty" type="number" value="${product?.wholesale_min_qty || 12}"></div>
                        <div class="form-group"><label>Lokasi</label><input class="form-control" name="location" value="${escapeHtml(product?.location || '')}"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveProduct(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        if (id) { await API.updateProduct(id, data); showToast('Produk berhasil diperbarui'); }
        else { await API.createProduct(data); showToast('Produk berhasil ditambahkan'); }
        document.querySelector('.modal-overlay')?.remove();
        renderProducts(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteProduct(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try { await API.deleteProduct(id); showToast('Produk berhasil dihapus'); renderProducts(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

async function showStockModal(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Sesuaikan Stok</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="adjustStock(event, '${id}')">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>Tipe</label><select class="form-control" name="movement_type">
                            <option value="in">Masuk</option><option value="out">Keluar</option>
                        </select></div>
                        <div class="form-group"><label>Jumlah</label><input class="form-control" name="quantity" type="number" min="1" required></div>
                    </div>
                    <div class="form-group"><label>Catatan</label><input class="form-control" name="notes"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function adjustStock(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        await API.adjustStock(id, data);
        showToast('Stok berhasil disesuaikan');
        document.querySelector('.modal-overlay')?.remove();
        renderProducts(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

// ========== CATEGORIES ==========
async function renderCategories(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const categories = await API.getCategories();
        el.innerHTML = `
            <div class="page-header flex justify-between items-center">
                <div><h1>Kategori</h1><p>Kelola kategori produk</p></div>
                <button class="btn btn-primary" onclick="showCategoryModal()">+ Tambah Kategori</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>Nama</th><th>Deskripsi</th><th>Jumlah Produk</th><th>Aksi</th></tr></thead>
                    <tbody>${categories.map(c => `
                        <tr>
                            <td class="font-semibold">${escapeHtml(c.name)}</td>
                            <td class="text-gray">${escapeHtml(c.description || '-')}</td>
                            <td><span class="badge badge-blue">${c.product_count || 0}</span></td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-primary" onclick="showCategoryModal('${c.id}', '${escapeHtml(c.name)}', '${escapeHtml(c.description || '')}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">Hapus</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function showCategoryModal(id = null, name = '', desc = '') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>${id ? 'Edit' : 'Tambah'} Kategori</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="saveCategory(event, '${id || ''}')">
                <div class="modal-body">
                    <div class="form-group"><label>Nama Kategori *</label><input class="form-control" name="name" value="${name}" required></div>
                    <div class="form-group"><label>Deskripsi</label><textarea class="form-control" name="description">${desc}</textarea></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveCategory(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        if (id) { await API.updateCategory(id, data); showToast('Kategori berhasil diperbarui'); }
        else { await API.createCategory(data); showToast('Kategori berhasil ditambahkan'); }
        document.querySelector('.modal-overlay')?.remove();
        renderCategories(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteCategory(id) {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try { await API.deleteCategory(id); showToast('Kategori berhasil dihapus'); renderCategories(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

// ========== WORK ORDERS ==========
async function renderWorkOrders(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await API.getWorkOrders();
        const workOrders = data.work_orders || [];
        el.innerHTML = `
            <div class="page-header flex justify-between items-center">
                <div><h1>Work Order</h1><p>Kelola work order / jasa mekanik</p></div>
                <button class="btn btn-primary" onclick="showWorkOrderModal()">+ Work Order Baru</button>
            </div>
            <div class="filter-bar">
                <select class="form-control" style="width:auto" id="wo-status-filter" onchange="filterWorkOrders()">
                    <option value="">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="in_progress">Dikerjakan</option>
                    <option value="waiting_parts">Tunggu Part</option>
                    <option value="completed">Selesai</option>
                    <option value="delivered">Diserahkan</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
            </div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>No. Order</th><th>Pelanggan</th><th>Kendaraan</th><th>Mekanik</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody id="wo-tbody">${workOrders.map(wo => renderWORow(wo)).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function renderWORow(wo) {
    return `<tr>
        <td><div class="font-semibold">${escapeHtml(wo.order_number)}</div><div class="text-xs text-gray">${formatDate(wo.created_at)}</div></td>
        <td>${escapeHtml(wo.customer_name || '-')}</td>
        <td><div>${escapeHtml(wo.vehicle_type || '-')}</div><div class="text-xs text-gray">${escapeHtml(wo.vehicle_plate || '')}</div></td>
        <td>${escapeHtml(wo.mechanic_name || '-')}</td>
        <td class="font-bold">${formatCurrency(wo.total_amount)}</td>
        <td>${getStatusBadge(wo.status)}</td>
        <td>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline" onclick="viewWorkOrder('${wo.id}')">Detail</button>
                ${wo.status !== 'completed' && wo.status !== 'cancelled' && wo.status !== 'delivered' ? `
                <select class="form-control" style="width:auto;font-size:0.8rem;padding:0.2rem" onchange="changeWOStatus('${wo.id}', this.value)">
                    <option value="">Ubah Status</option>
                    <option value="in_progress">Dikerjakan</option>
                    <option value="waiting_parts">Tunggu Part</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Batal</option>
                </select>` : ''}
                ${wo.status === 'completed' && wo.payment_status !== 'paid' ? `<button class="btn btn-sm btn-success" onclick="completeWO('${wo.id}')">Bayar</button>` : ''}
            </div>
        </td>
    </tr>`;
}

async function filterWorkOrders() {
    const status = document.getElementById('wo-status-filter')?.value || '';
    try {
        const data = await API.getWorkOrders({ status });
        document.getElementById('wo-tbody').innerHTML = (data.work_orders || []).map(wo => renderWORow(wo)).join('');
    } catch (err) { showToast(err.message, 'error'); }
}

async function viewWorkOrder(id) {
    try {
        const wo = await API.getWorkOrder(id);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header"><h3>Detail Work Order: ${escapeHtml(wo.order_number)}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
                <div class="modal-body">
                    <div class="grid grid-2 gap-4 mb-4">
                        <div><strong>Pelanggan:</strong> ${escapeHtml(wo.customer_name || '-')}</div>
                        <div><strong>Mekanik:</strong> ${escapeHtml(wo.mechanic_name || '-')}</div>
                        <div><strong>Kendaraan:</strong> ${escapeHtml(wo.vehicle_type || '-')} ${escapeHtml(wo.vehicle_plate || '')}</div>
                        <div><strong>Status:</strong> ${getStatusBadge(wo.status)} ${getStatusBadge(wo.payment_status)}</div>
                        <div><strong>Keluhan:</strong> ${escapeHtml(wo.complaint || '-')}</div>
                        <div><strong>Diagnosis:</strong> ${escapeHtml(wo.diagnosis || '-')}</div>
                    </div>
                    ${wo.services && wo.services.length > 0 ? `
                    <h4 class="font-semibold mb-2">Jasa / Layanan</h4>
                    <table class="mb-4"><thead><tr><th>Layanan</th><th>Harga</th></tr></thead><tbody>
                    ${wo.services.map(s => `<tr><td>${escapeHtml(s.service_name)}</td><td>${formatCurrency(s.price)}</td></tr>`).join('')}
                    </tbody></table>` : ''}
                    ${wo.items && wo.items.length > 0 ? `
                    <h4 class="font-semibold mb-2">Sparepart</h4>
                    <table class="mb-4"><thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>
                    ${wo.items.map(i => `<tr><td>${escapeHtml(i.product_name)}</td><td>${i.quantity}</td><td>${formatCurrency(i.unit_price)}</td><td>${formatCurrency(i.subtotal)}</td></tr>`).join('')}
                    </tbody></table>` : ''}
                    <div class="card" style="background:#f8fafc">
                        <div class="flex justify-between"><span>Jasa:</span><span>${formatCurrency(wo.service_fee)}</span></div>
                        <div class="flex justify-between"><span>Sparepart:</span><span>${formatCurrency(wo.parts_total)}</span></div>
                        <div class="flex justify-between font-bold text-lg" style="border-top:2px solid #e5e7eb;padding-top:0.5rem;margin-top:0.5rem"><span>Total:</span><span>${formatCurrency(wo.total_amount)}</span></div>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Tutup</button></div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) { showToast(err.message, 'error'); }
}

async function changeWOStatus(id, status) {
    if (!status) return;
    try {
        await API.updateWorkOrderStatus(id, { status });
        showToast('Status berhasil diperbarui');
        renderWorkOrders(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function completeWO(id) {
    if (!confirm('Selesaikan dan bayar work order ini?')) return;
    try {
        await API.completeWorkOrder(id, { payment_method: 'cash' });
        showToast('Work order selesai & lunas');
        renderWorkOrders(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function showWorkOrderModal() {
    let customers = [], mechanics = [], products = [];
    try {
        [customers, mechanics, products] = await Promise.all([
            API.getCustomers(),
            API.getUsers({ role: 'mekanik' }).catch(() => []),
            API.getProducts({ limit: 200 }).then(d => d.products || []).catch(() => [])
        ]);
    } catch {}

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal modal-lg">
            <div class="modal-header"><h3>Work Order Baru</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form id="wo-form" onsubmit="saveWorkOrder(event)">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>Pelanggan</label><select class="form-control" name="customer_id">
                            <option value="">Pilih Pelanggan</option>
                            ${customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
                        </select></div>
                        <div class="form-group"><label>Mekanik</label><select class="form-control" name="mechanic_id">
                            <option value="">Pilih Mekanik</option>
                            ${mechanics.map(m => `<option value="${m.id}">${escapeHtml(m.full_name)}</option>`).join('')}
                        </select></div>
                    </div>
                    <div class="form-row-3">
                        <div class="form-group"><label>Jenis Kendaraan</label><input class="form-control" name="vehicle_type"></div>
                        <div class="form-group"><label>Plat Nomor</label><input class="form-control" name="vehicle_plate"></div>
                        <div class="form-group"><label>Tahun</label><input class="form-control" name="vehicle_year"></div>
                    </div>
                    <div class="form-group"><label>Keluhan</label><textarea class="form-control" name="complaint"></textarea></div>
                    <div class="form-group"><label>Diagnosis</label><textarea class="form-control" name="diagnosis"></textarea></div>

                    <h4 class="font-semibold mt-4 mb-2">Jasa / Layanan</h4>
                    <div id="wo-services">
                        <div class="form-row mb-2">
                            <input class="form-control" name="svc_name_0" placeholder="Nama layanan">
                            <input class="form-control" name="svc_price_0" type="number" placeholder="Harga">
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline mb-4" onclick="addWOService()">+ Tambah Layanan</button>

                    <h4 class="font-semibold mb-2">Sparepart</h4>
                    <div id="wo-items"></div>
                    <button type="button" class="btn btn-sm btn-outline" onclick="addWOItem()">+ Tambah Part</button>

                    <div class="form-group mt-4"><label>Catatan</label><textarea class="form-control" name="notes"></textarea></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal._products = products;
    modal._svcCount = 1;
    modal._itemCount = 0;
}

function addWOService() {
    const modal = document.querySelector('.modal-overlay');
    const container = document.getElementById('wo-services');
    const idx = modal._svcCount++;
    const div = document.createElement('div');
    div.className = 'form-row mb-2';
    div.innerHTML = `<input class="form-control" name="svc_name_${idx}" placeholder="Nama layanan">
        <input class="form-control" name="svc_price_${idx}" type="number" placeholder="Harga">`;
    container.appendChild(div);
}

function addWOItem() {
    const modal = document.querySelector('.modal-overlay');
    const container = document.getElementById('wo-items');
    const idx = modal._itemCount++;
    const products = modal._products || [];
    const div = document.createElement('div');
    div.className = 'form-row mb-2';
    div.innerHTML = `<select class="form-control" name="item_product_${idx}">
        <option value="">Pilih Produk</option>
        ${products.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (Stok: ${p.stock})</option>`).join('')}
    </select>
    <input class="form-control" name="item_qty_${idx}" type="number" min="1" value="1" placeholder="Qty">`;
    container.appendChild(div);
}

async function saveWorkOrder(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
        customer_id: form.get('customer_id'),
        mechanic_id: form.get('mechanic_id'),
        vehicle_type: form.get('vehicle_type'),
        vehicle_plate: form.get('vehicle_plate'),
        vehicle_year: form.get('vehicle_year'),
        complaint: form.get('complaint'),
        diagnosis: form.get('diagnosis'),
        notes: form.get('notes'),
        services: [],
        items: []
    };

    for (let [key, val] of form.entries()) {
        if (key.startsWith('svc_name_') && val) {
            const idx = key.replace('svc_name_', '');
            data.services.push({ service_name: val, price: form.get(`svc_price_${idx}`) || 0 });
        }
        if (key.startsWith('item_product_') && val) {
            const idx = key.replace('item_product_', '');
            data.items.push({ product_id: val, quantity: form.get(`item_qty_${idx}`) || 1 });
        }
    }

    try {
        await API.createWorkOrder(data);
        showToast('Work order berhasil dibuat');
        document.querySelector('.modal-overlay')?.remove();
        renderWorkOrders(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

// ========== CUSTOMERS ==========
async function renderCustomers(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const customers = await API.getCustomers();
        el.innerHTML = `
            <div class="page-header flex justify-between items-center">
                <div><h1>Pelanggan</h1><p>Kelola data pelanggan</p></div>
                <button class="btn btn-primary" onclick="showCustomerModal()">+ Tambah Pelanggan</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>Nama</th><th>Telepon</th><th>Email</th><th>Tipe</th><th>Info Kendaraan</th><th>Total Belanja</th><th>Aksi</th></tr></thead>
                    <tbody>${customers.map(c => `
                        <tr>
                            <td class="font-semibold">${escapeHtml(c.name)}</td>
                            <td>${escapeHtml(c.phone || '-')}</td>
                            <td>${escapeHtml(c.email || '-')}</td>
                            <td><span class="badge ${c.customer_type === 'wholesale' ? 'badge-purple' : 'badge-blue'}">${c.customer_type === 'wholesale' ? 'Grosir' : 'Eceran'}</span></td>
                            <td class="text-sm">${escapeHtml(c.vehicle_info || '-')}</td>
                            <td>${formatCurrency(c.total_purchases)}</td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-primary" onclick='showCustomerModal(${JSON.stringify(c).replace(/'/g, "&#39;")})'>Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${c.id}')">Hapus</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function showCustomerModal(customer = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>${customer ? 'Edit' : 'Tambah'} Pelanggan</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="saveCustomer(event, '${customer?.id || ''}')">
                <div class="modal-body">
                    <div class="form-group"><label>Nama *</label><input class="form-control" name="name" value="${escapeHtml(customer?.name || '')}" required></div>
                    <div class="form-row">
                        <div class="form-group"><label>Telepon</label><input class="form-control" name="phone" value="${escapeHtml(customer?.phone || '')}"></div>
                        <div class="form-group"><label>Email</label><input class="form-control" name="email" type="email" value="${escapeHtml(customer?.email || '')}"></div>
                    </div>
                    <div class="form-group"><label>Alamat</label><textarea class="form-control" name="address">${escapeHtml(customer?.address || '')}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label>Tipe</label><select class="form-control" name="customer_type">
                            <option value="retail" ${customer?.customer_type === 'retail' ? 'selected' : ''}>Eceran</option>
                            <option value="wholesale" ${customer?.customer_type === 'wholesale' ? 'selected' : ''}>Grosir</option>
                        </select></div>
                        <div class="form-group"><label>Info Kendaraan</label><input class="form-control" name="vehicle_info" value="${escapeHtml(customer?.vehicle_info || '')}"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveCustomer(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        if (id) { await API.updateCustomer(id, data); showToast('Pelanggan berhasil diperbarui'); }
        else { await API.createCustomer(data); showToast('Pelanggan berhasil ditambahkan'); }
        document.querySelector('.modal-overlay')?.remove();
        renderCustomers(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteCustomer(id) {
    if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
    try { await API.deleteCustomer(id); showToast('Pelanggan berhasil dihapus'); renderCustomers(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

// ========== TRANSACTIONS ==========
async function renderTransactions(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const data = await API.getTransactions();
        const transactions = data.transactions || [];
        el.innerHTML = `
            <div class="page-header"><h1>Transaksi</h1><p>Riwayat transaksi penjualan</p></div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>Invoice</th><th>Pelanggan</th><th>Tipe</th><th>Total</th><th>Pembayaran</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
                    <tbody>${transactions.map(t => `
                        <tr>
                            <td class="font-semibold">${escapeHtml(t.invoice_number)}</td>
                            <td>${escapeHtml(t.customer_name || 'Umum')}</td>
                            <td><span class="badge ${t.transaction_type === 'wholesale' ? 'badge-purple' : 'badge-blue'}">${t.transaction_type === 'wholesale' ? 'Grosir' : 'Eceran'}</span></td>
                            <td class="font-bold">${formatCurrency(t.total_amount)}</td>
                            <td class="text-sm">${t.payment_method}</td>
                            <td>${getStatusBadge(t.payment_status)}</td>
                            <td class="text-sm">${formatDate(t.created_at)}</td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline" onclick="viewTransaction('${t.id}')">Detail</button>
                                    ${t.payment_status !== 'cancelled' && ['admin','owner'].includes(currentUser.role) ? `<button class="btn btn-sm btn-danger" onclick="cancelTransaction('${t.id}')">Batal</button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

async function viewTransaction(id) {
    try {
        const t = await API.getTransaction(id);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header"><h3>Detail Transaksi</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
                <div class="modal-body">
                    <div class="grid grid-2 gap-3 mb-4">
                        <div><strong>Invoice:</strong> ${escapeHtml(t.invoice_number)}</div>
                        <div><strong>Tanggal:</strong> ${formatDate(t.created_at)}</div>
                        <div><strong>Pelanggan:</strong> ${escapeHtml(t.customer_name || 'Umum')}</div>
                        <div><strong>Kasir:</strong> ${escapeHtml(t.user_name || '-')}</div>
                        <div><strong>Tipe:</strong> ${t.transaction_type === 'wholesale' ? 'Grosir' : 'Eceran'}</div>
                        <div><strong>Pembayaran:</strong> ${t.payment_method}</div>
                    </div>
                    <table><thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>
                    ${(t.items || []).map(i => `<tr><td>${escapeHtml(i.product_name)}</td><td>${i.quantity}</td><td>${formatCurrency(i.unit_price)}</td><td>${formatCurrency(i.subtotal)}</td></tr>`).join('')}
                    </tbody></table>
                    <div class="card mt-3" style="background:#f8fafc">
                        <div class="flex justify-between"><span>Subtotal:</span><span>${formatCurrency(t.subtotal)}</span></div>
                        ${t.discount_amount > 0 ? `<div class="flex justify-between text-red"><span>Diskon:</span><span>-${formatCurrency(t.discount_amount)}</span></div>` : ''}
                        <div class="flex justify-between font-bold"><span>Total:</span><span>${formatCurrency(t.total_amount)}</span></div>
                        <div class="flex justify-between"><span>Bayar:</span><span>${formatCurrency(t.paid_amount)}</span></div>
                        <div class="flex justify-between"><span>Kembalian:</span><span>${formatCurrency(t.change_amount)}</span></div>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Tutup</button></div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) { showToast(err.message, 'error'); }
}

async function cancelTransaction(id) {
    if (!confirm('Yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.')) return;
    try { await API.cancelTransaction(id); showToast('Transaksi dibatalkan'); renderTransactions(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

// ========== REPORTS ==========
async function renderReports(el) {
    el.innerHTML = `
        <div class="page-header"><h1>Laporan</h1><p>Analisis penjualan dan stok</p></div>
        <div class="flex gap-2 mb-4">
            <button class="btn btn-primary active" onclick="loadSalesReport()" id="btn-sales-report">Penjualan</button>
            <button class="btn btn-outline" onclick="loadProfitReport()" id="btn-profit-report">Laba Rugi</button>
            <button class="btn btn-outline" onclick="loadStockReport()" id="btn-stock-report">Stok</button>
        </div>
        <div class="filter-bar mb-4">
            <input type="date" class="form-control" id="report-start" value="${new Date().toISOString().slice(0, 8)}01" style="width:auto">
            <input type="date" class="form-control" id="report-end" value="${new Date().toISOString().slice(0, 10)}" style="width:auto">
            <button class="btn btn-outline" onclick="refreshReport()">Filter</button>
        </div>
        <div id="report-content"><div class="spinner"></div></div>
    `;
    loadSalesReport();
}

let currentReportType = 'sales';

async function loadSalesReport() {
    currentReportType = 'sales';
    document.getElementById('btn-sales-report').className = 'btn btn-primary';
    document.getElementById('btn-profit-report').className = 'btn btn-outline';
    document.getElementById('btn-stock-report').className = 'btn btn-outline';
    await refreshReport();
}

async function loadProfitReport() {
    currentReportType = 'profit';
    document.getElementById('btn-sales-report').className = 'btn btn-outline';
    document.getElementById('btn-profit-report').className = 'btn btn-primary';
    document.getElementById('btn-stock-report').className = 'btn btn-outline';
    await refreshReport();
}

async function loadStockReport() {
    currentReportType = 'stock';
    document.getElementById('btn-sales-report').className = 'btn btn-outline';
    document.getElementById('btn-profit-report').className = 'btn btn-outline';
    document.getElementById('btn-stock-report').className = 'btn btn-primary';
    await refreshReport();
}

async function refreshReport() {
    const content = document.getElementById('report-content');
    content.innerHTML = '<div class="spinner"></div>';
    const start = document.getElementById('report-start')?.value;
    const end = document.getElementById('report-end')?.value;

    try {
        if (currentReportType === 'sales') {
            const data = await API.getSalesReport({ start_date: start, end_date: end });
            content.innerHTML = `
                <div class="grid grid-4 gap-4 mb-4">
                    <div class="card"><div class="stat-label">Total Transaksi</div><div class="stat-value">${data.summary.total_transactions}</div></div>
                    <div class="card"><div class="stat-label">Total Penjualan</div><div class="stat-value">${formatCurrency(data.summary.total_sales)}</div></div>
                    <div class="card"><div class="stat-label">Total Diskon</div><div class="stat-value">${formatCurrency(data.summary.total_discount)}</div></div>
                    <div class="card"><div class="stat-label">Rata-rata</div><div class="stat-value">${formatCurrency(data.summary.average_transaction)}</div></div>
                </div>
                <div class="card">
                    <h3 class="font-semibold mb-3">Detail Harian</h3>
                    <div class="table-container"><table><thead><tr><th>Tanggal</th><th>Transaksi</th><th>Total</th><th>Diskon</th></tr></thead><tbody>
                    ${data.daily.map(d => `<tr><td>${formatDateShort(d.date)}</td><td>${d.count}</td><td>${formatCurrency(d.total)}</td><td>${formatCurrency(d.discount)}</td></tr>`).join('')}
                    </tbody></table></div>
                </div>
            `;
        } else if (currentReportType === 'profit') {
            const data = await API.getProfitReport({ start_date: start, end_date: end });
            content.innerHTML = `
                <div class="grid grid-4 gap-4 mb-4">
                    <div class="card"><div class="stat-label">Total Pendapatan</div><div class="stat-value">${formatCurrency(data.summary.total_revenue)}</div></div>
                    <div class="card"><div class="stat-label">Total HPP</div><div class="stat-value">${formatCurrency(data.summary.total_cost)}</div></div>
                    <div class="card"><div class="stat-label">Laba Kotor</div><div class="stat-value text-green">${formatCurrency(data.summary.gross_profit)}</div></div>
                    <div class="card"><div class="stat-label">Laba Bersih</div><div class="stat-value ${data.summary.net_profit >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(data.summary.net_profit)}</div></div>
                </div>
                <div class="card">
                    <h3 class="font-semibold mb-3">Detail Harian</h3>
                    <div class="table-container"><table><thead><tr><th>Tanggal</th><th>Pendapatan</th><th>HPP</th><th>Laba</th></tr></thead><tbody>
                    ${data.daily.map(d => `<tr><td>${formatDateShort(d.date)}</td><td>${formatCurrency(d.revenue)}</td><td>${formatCurrency(d.cost)}</td><td class="${d.profit >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(d.profit)}</td></tr>`).join('')}
                    </tbody></table></div>
                </div>
            `;
        } else {
            const data = await API.getStockReport();
            content.innerHTML = `
                <div class="card">
                    <h3 class="font-semibold mb-3">Laporan Stok</h3>
                    <div class="table-container"><table><thead><tr><th>Produk</th><th>Kategori</th><th>Stok</th><th>Min.</th><th>HPP</th><th>Nilai Stok</th><th>Status</th></tr></thead><tbody>
                    ${data.map(p => `<tr>
                        <td><div class="font-semibold">${escapeHtml(p.name)}</div><div class="text-xs text-gray">${escapeHtml(p.brand || '-')}</div></td>
                        <td>${escapeHtml(p.category_name || '-')}</td>
                        <td class="${p.stock <= p.min_stock ? 'text-red font-bold' : ''}">${p.stock}</td>
                        <td>${p.min_stock}</td>
                        <td>${formatCurrency(p.cost_price)}</td>
                        <td>${formatCurrency(p.stock_value)}</td>
                        <td>${p.stock <= 0 ? '<span class="badge badge-red">Habis</span>' : p.stock <= p.min_stock ? '<span class="badge badge-orange">Menipis</span>' : '<span class="badge badge-green">Aman</span>'}</td>
                    </tr>`).join('')}
                    </tbody></table></div>
                </div>
            `;
        }
    } catch (err) { content.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

// ========== EXPENSES ==========
async function renderExpenses(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const expenses = await API.getExpenses();
        const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        el.innerHTML = `
            <div class="page-header flex justify-between items-center">
                <div><h1>Pengeluaran</h1><p>Kelola pengeluaran operasional</p></div>
                <button class="btn btn-primary" onclick="showExpenseModal()">+ Tambah Pengeluaran</button>
            </div>
            <div class="card mb-4 stat-card">
                <div class="stat-icon red">${getIcon('money')}</div>
                <div><div class="stat-value">${formatCurrency(total)}</div><div class="stat-label">Total Pengeluaran Bulan Ini</div></div>
            </div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th><th>Oleh</th><th>Aksi</th></tr></thead>
                    <tbody>${expenses.map(e => `
                        <tr>
                            <td>${formatDateShort(e.date)}</td>
                            <td><span class="badge badge-orange">${escapeHtml(e.category)}</span></td>
                            <td>${escapeHtml(e.description || '-')}</td>
                            <td class="font-bold text-red">${formatCurrency(e.amount)}</td>
                            <td>${escapeHtml(e.user_name || '-')}</td>
                            <td><button class="btn btn-sm btn-danger" onclick="deleteExpense('${e.id}')">Hapus</button></td>
                        </tr>
                    `).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function showExpenseModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Tambah Pengeluaran</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="saveExpense(event)">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>Kategori *</label><select class="form-control" name="category" required>
                            <option value="">Pilih Kategori</option>
                            <option>Operasional</option><option>Gaji</option><option>Sewa</option>
                            <option>Listrik & Air</option><option>Transportasi</option><option>Lainnya</option>
                        </select></div>
                        <div class="form-group"><label>Jumlah *</label><input class="form-control" name="amount" type="number" required></div>
                    </div>
                    <div class="form-group"><label>Deskripsi</label><input class="form-control" name="description"></div>
                    <div class="form-group"><label>Tanggal</label><input class="form-control" name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveExpense(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        await API.createExpense(data);
        showToast('Pengeluaran berhasil ditambahkan');
        document.querySelector('.modal-overlay')?.remove();
        renderExpenses(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteExpense(id) {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return;
    try { await API.deleteExpense(id); showToast('Pengeluaran berhasil dihapus'); renderExpenses(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

// ========== USERS ==========
async function renderUsers(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const users = await API.getUsers();
        el.innerHTML = `
            <div class="page-header flex justify-between items-center">
                <div><h1>Pengguna</h1><p>Kelola pengguna sistem</p></div>
                <button class="btn btn-primary" onclick="showUserModal()">+ Tambah Pengguna</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>Username</th><th>Nama Lengkap</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>${users.map(u => `
                        <tr>
                            <td class="font-semibold">${escapeHtml(u.username)}</td>
                            <td>${escapeHtml(u.full_name)}</td>
                            <td><span class="badge badge-blue">${u.role}</span></td>
                            <td>${u.is_active ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-red">Nonaktif</span>'}</td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline" onclick="showResetPasswordModal('${u.id}')">Reset Pass</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Nonaktifkan</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function showUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Tambah Pengguna</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="saveUser(event)">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>Username *</label><input class="form-control" name="username" required></div>
                        <div class="form-group"><label>Password *</label><input class="form-control" name="password" type="password" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Nama Lengkap *</label><input class="form-control" name="full_name" required></div>
                        <div class="form-group"><label>Role *</label><select class="form-control" name="role" required>
                            <option value="kasir">Kasir</option>
                            <option value="mekanik">Mekanik</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                        </select></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveUser(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        await API.register(data);
        showToast('Pengguna berhasil ditambahkan');
        document.querySelector('.modal-overlay')?.remove();
        renderUsers(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

function showResetPasswordModal(id) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>Reset Password</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="resetUserPassword(event, '${id}')">
                <div class="modal-body">
                    <div class="form-group"><label>Password Baru *</label><input class="form-control" name="new_password" type="password" required></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Reset</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function resetUserPassword(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
        await API.resetPassword(id, { new_password: form.get('new_password') });
        showToast('Password berhasil direset');
        document.querySelector('.modal-overlay')?.remove();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteUser(id) {
    if (!confirm('Yakin ingin menonaktifkan pengguna ini?')) return;
    try { await API.deleteUser(id); showToast('Pengguna berhasil dinonaktifkan'); renderUsers(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

// ========== BRANCHES ==========
async function renderBranches(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const branches = await API.getBranches();
        el.innerHTML = `
            <div class="page-header flex justify-between items-center">
                <div><h1>Cabang</h1><p>Kelola cabang toko</p></div>
                <button class="btn btn-primary" onclick="showBranchModal()">+ Tambah Cabang</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table><thead><tr><th>Nama</th><th>Alamat</th><th>Telepon</th><th>Aksi</th></tr></thead>
                    <tbody>${branches.map(b => `
                        <tr>
                            <td class="font-semibold">${escapeHtml(b.name)}</td>
                            <td>${escapeHtml(b.address || '-')}</td>
                            <td>${escapeHtml(b.phone || '-')}</td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-primary" onclick="showBranchModal('${b.id}', '${escapeHtml(b.name)}', '${escapeHtml(b.address || '')}', '${escapeHtml(b.phone || '')}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteBranch('${b.id}')">Hapus</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}</tbody></table>
                </div>
            </div>
        `;
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

function showBranchModal(id = null, name = '', address = '', phone = '') {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header"><h3>${id ? 'Edit' : 'Tambah'} Cabang</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button></div>
            <form onsubmit="saveBranch(event, '${id || ''}')">
                <div class="modal-body">
                    <div class="form-group"><label>Nama Cabang *</label><input class="form-control" name="name" value="${name}" required></div>
                    <div class="form-group"><label>Alamat</label><textarea class="form-control" name="address">${address}</textarea></div>
                    <div class="form-group"><label>Telepon</label><input class="form-control" name="phone" value="${phone}"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveBranch(e, id) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try {
        if (id) { await API.updateBranch(id, data); showToast('Cabang berhasil diperbarui'); }
        else { await API.createBranch(data); showToast('Cabang berhasil ditambahkan'); }
        document.querySelector('.modal-overlay')?.remove();
        renderBranches(document.getElementById('page-content'));
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteBranch(id) {
    if (!confirm('Yakin ingin menghapus cabang ini?')) return;
    try { await API.deleteBranch(id); showToast('Cabang berhasil dihapus'); renderBranches(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

// ========== SETTINGS ==========
async function renderSettings(el) {
    el.innerHTML = '<div class="spinner"></div>';
    try {
        const settings = await API.getSettings();
        el.innerHTML = `
            <div class="page-header"><h1>Pengaturan</h1><p>Konfigurasi toko dan sistem</p></div>
            <div class="grid grid-2 gap-4">
                <div class="card">
                    <h3 class="font-semibold mb-4">Informasi Toko</h3>
                    <form onsubmit="saveSettings(event)">
                        <div class="form-group"><label>Nama Toko</label><input class="form-control" name="store_name" value="${escapeHtml(settings.store_name || '')}"></div>
                        <div class="form-group"><label>Alamat</label><textarea class="form-control" name="store_address">${escapeHtml(settings.store_address || '')}</textarea></div>
                        <div class="form-group"><label>Telepon</label><input class="form-control" name="store_phone" value="${escapeHtml(settings.store_phone || '')}"></div>
                        <div class="form-group"><label>Email</label><input class="form-control" name="store_email" value="${escapeHtml(settings.store_email || '')}"></div>
                        <div class="form-group"><label>Footer Struk</label><input class="form-control" name="receipt_footer" value="${escapeHtml(settings.receipt_footer || '')}"></div>
                        <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
                    </form>
                </div>
                <div class="card">
                    <h3 class="font-semibold mb-4">Logo Toko</h3>
                    ${settings.store_logo ? `<img src="${escapeHtml(settings.store_logo)}" style="max-width:150px;margin-bottom:1rem;border-radius:8px">
                    <button class="btn btn-danger btn-sm mb-4" onclick="deleteLogo()">Hapus Logo</button>` : '<p class="text-gray mb-4">Belum ada logo</p>'}
                    <form onsubmit="uploadLogo(event)">
                        <div class="form-group"><label>Upload Logo</label><input class="form-control" name="logo" type="file" accept="image/*" required></div>
                        <button type="submit" class="btn btn-primary">Upload</button>
                    </form>

                    <h3 class="font-semibold mt-4 mb-4">Database Backup</h3>
                    <button class="btn btn-success mb-3" onclick="createBackup()">Buat Backup</button>
                    <div id="backup-list"></div>

                    <h3 class="font-semibold mt-4 mb-4">Ubah Password</h3>
                    <form onsubmit="changeMyPassword(event)">
                        <div class="form-group"><label>Password Lama</label><input class="form-control" name="old_password" type="password" required></div>
                        <div class="form-group"><label>Password Baru</label><input class="form-control" name="new_password" type="password" required></div>
                        <button type="submit" class="btn btn-primary">Ubah Password</button>
                    </form>
                </div>
            </div>
        `;
        loadBackups();
    } catch (err) { el.innerHTML = `<p class="text-red">${err.message}</p>`; }
}

async function saveSettings(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    try { await API.updateSettings(data); showToast('Pengaturan berhasil disimpan'); }
    catch (err) { showToast(err.message, 'error'); }
}

async function uploadLogo(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    try { await API.uploadLogo(formData); showToast('Logo berhasil diupload'); renderSettings(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

async function deleteLogo() {
    if (!confirm('Yakin ingin menghapus logo?')) return;
    try { await API.deleteLogo(); showToast('Logo berhasil dihapus'); renderSettings(document.getElementById('page-content')); }
    catch (err) { showToast(err.message, 'error'); }
}

async function createBackup() {
    try { await API.createBackup(); showToast('Backup berhasil dibuat'); loadBackups(); }
    catch (err) { showToast(err.message, 'error'); }
}

async function loadBackups() {
    const container = document.getElementById('backup-list');
    if (!container) return;
    try {
        const backups = await API.getBackups();
        container.innerHTML = backups.length === 0 ? '<p class="text-gray text-sm">Belum ada backup</p>' :
            backups.map(b => `
                <div class="flex justify-between items-center p-2" style="border-bottom:1px solid #f3f4f6">
                    <div><div class="text-sm font-semibold">${escapeHtml(b.filename)}</div>
                    <div class="text-xs text-gray">${formatDate(b.created_at)} &bull; ${(b.size / 1024).toFixed(1)} KB</div></div>
                    <div class="btn-group">
                        <a href="api/backup.php?action=download&filename=${encodeURIComponent(b.filename)}" class="btn btn-sm btn-outline">Download</a>
                        <button class="btn btn-sm btn-danger" onclick="deleteBackup('${escapeHtml(b.filename)}')">Hapus</button>
                    </div>
                </div>
            `).join('');
    } catch {}
}

async function deleteBackup(filename) {
    if (!confirm('Yakin ingin menghapus backup ini?')) return;
    try { await API.deleteBackup(filename); showToast('Backup berhasil dihapus'); loadBackups(); }
    catch (err) { showToast(err.message, 'error'); }
}

async function changeMyPassword(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
        await API.changePassword({ old_password: form.get('old_password'), new_password: form.get('new_password') });
        showToast('Password berhasil diubah');
        e.target.reset();
    } catch (err) { showToast(err.message, 'error'); }
}

// ========== ICONS ==========
function getIcon(name) {
    const icons = {
        'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        'cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
        'cube': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        'tag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
        'wrench': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'receipt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>',
        'chart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        'money': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        'user-cog': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><circle cx="18" cy="14" r="3"/></svg>',
        'building': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
        'settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        'alert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        'logout': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
        'menu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    };
    return icons[name] || '';
}
