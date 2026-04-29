import { useState, useEffect, useRef } from 'react';
import { productAPI, categoryAPI, exportImportAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import { downloadBlob } from '../utils/download';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle, HiOutlineArrowDownTray, HiOutlineArrowUpTray,
  HiOutlineDocumentText, HiOutlineTableCells
} from 'react-icons/hi2';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const { hasRole } = useAuth();
  const importRef = useRef(null);

  const [form, setForm] = useState({
    name: '', barcode: '', sku: '', category_id: '', brand: '', unit: 'pcs',
    retail_price: '', wholesale_price: '', wholesale_min_qty: 12, cost_price: '',
    stock: '', min_stock: 5, location: ''
  });

  const [stockForm, setStockForm] = useState({ quantity: '', movement_type: 'in', notes: '' });

  useEffect(() => { loadData(); }, [search, categoryFilter, lowStockFilter, page]);
  useEffect(() => { loadCategories(); }, []);

  const loadData = async () => {
    try {
      const { data } = await productAPI.getAll({ search, category_id: categoryFilter, low_stock: lowStockFilter, page, limit: 20 });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadCategories = async () => {
    try { const { data } = await categoryAPI.getAll(); setCategories(data); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, retail_price: parseFloat(form.retail_price) || 0, wholesale_price: parseFloat(form.wholesale_price) || 0, cost_price: parseFloat(form.cost_price) || 0, stock: parseInt(form.stock) || 0, min_stock: parseInt(form.min_stock) || 5, wholesale_min_qty: parseInt(form.wholesale_min_qty) || 12 };
      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
        toast.success('Produk berhasil diperbarui');
      } else {
        await productAPI.create(payload);
        toast.success('Produk berhasil ditambahkan');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal menyimpan'); }
  };

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    try {
      await productAPI.adjustStock(stockProduct.id, { ...stockForm, quantity: parseInt(stockForm.quantity) });
      toast.success('Stok berhasil disesuaikan');
      setShowStockModal(false);
      setStockForm({ quantity: '', movement_type: 'in', notes: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Produk berhasil dihapus');
      loadData();
    } catch (err) { toast.error('Gagal menghapus'); }
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name, barcode: p.barcode || '', sku: p.sku || '', category_id: p.category_id || '', brand: p.brand || '', unit: p.unit || 'pcs', retail_price: p.retail_price, wholesale_price: p.wholesale_price, wholesale_min_qty: p.wholesale_min_qty, cost_price: p.cost_price, stock: p.stock, min_stock: p.min_stock, location: p.location || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setForm({ name: '', barcode: '', sku: '', category_id: '', brand: '', unit: 'pcs', retail_price: '', wholesale_price: '', wholesale_min_qty: 12, cost_price: '', stock: '', min_stock: 5, location: '' });
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Mengexport Excel...', { id: 'export' });
      const { data } = await exportImportAPI.exportProductsExcel();
      downloadBlob(data, `produk-stok-${Date.now()}.xlsx`);
      toast.success('Export Excel berhasil', { id: 'export' });
    } catch { toast.error('Gagal export Excel', { id: 'export' }); }
    setShowExportMenu(false);
  };

  const handleExportPdf = async () => {
    try {
      toast.loading('Mengexport PDF...', { id: 'export' });
      const { data } = await exportImportAPI.exportProductsPdf();
      downloadBlob(data, `produk-stok-${Date.now()}.pdf`);
      toast.success('Export PDF berhasil', { id: 'export' });
    } catch { toast.error('Gagal export PDF', { id: 'export' }); }
    setShowExportMenu(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await exportImportAPI.downloadTemplate('products');
      downloadBlob(data, 'template-produk.xlsx');
      toast.success('Template berhasil didownload');
    } catch { toast.error('Gagal download template'); }
    setShowExportMenu(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setImporting(true);
    try {
      const { data } = await exportImportAPI.importProducts(formData);
      toast.success(data.message);
      loadData();
      loadCategories();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal import'); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9" placeholder="Cari produk, barcode, brand..." />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-auto">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={lowStockFilter} onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1); }} className="rounded" />
          <HiOutlineExclamationTriangle className="w-4 h-4 text-yellow-500" /> Stok Menipis
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {hasRole('admin', 'owner') && (
          <>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1 text-sm">
              <HiOutlinePlus className="w-4 h-4" /> <span className="hidden sm:inline">Tambah Produk</span><span className="sm:hidden">Tambah</span>
            </button>

            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn-secondary flex items-center gap-1 text-sm">
                <HiOutlineArrowDownTray className="w-4 h-4" /> Export
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 py-1 min-w-[180px]">
                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><HiOutlineTableCells className="w-4 h-4 text-green-600" /> Export Excel</button>
                    <button onClick={handleExportPdf} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><HiOutlineDocumentText className="w-4 h-4 text-red-600" /> Export PDF</button>
                    <hr className="my-1" />
                    <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><HiOutlineArrowDownTray className="w-4 h-4 text-blue-600" /> Download Template</button>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => importRef.current?.click()} disabled={importing} className="btn-secondary flex items-center gap-1 text-sm">
              <HiOutlineArrowUpTray className="w-4 h-4" /> {importing ? 'Importing...' : 'Import'}
            </button>
            <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </>
        )}
      </div>

      {/* Products Table */}
      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Produk</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Barcode/SKU</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Kategori</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Harga Eceran</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Harga Grosir</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 hidden xl:table-cell">HPP</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Stok</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Tidak ada produk</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.brand || '-'} &bull; {p.unit}</p>
                  <p className="text-xs text-gray-400 md:hidden">{p.barcode || p.sku || '-'}</p>
                </td>
                <td className="py-3 px-4 text-xs hidden md:table-cell"><p>{p.barcode || '-'}</p><p className="text-gray-400">{p.sku}</p></td>
                <td className="py-3 px-4 text-xs hidden lg:table-cell">{p.category_name || '-'}</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(p.retail_price)}</td>
                <td className="py-3 px-4 text-right hidden lg:table-cell">{formatCurrency(p.wholesale_price)}</td>
                <td className="py-3 px-4 text-right text-gray-500 hidden xl:table-cell">{formatCurrency(p.cost_price)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`badge ${p.stock <= p.min_stock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    {hasRole('admin', 'owner') && (
                      <>
                        <button onClick={() => { setStockProduct(p); setShowStockModal(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Sesuaikan Stok">
                          <HiOutlinePlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-500">Menampilkan {products.length} dari {pagination.total} produk</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm px-3 py-1">&laquo; Prev</button>
            <span className="px-3 py-1 text-sm">Hal {page}/{pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm px-3 py-1">Next &raquo;</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Nama Produk *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
                <div><label className="block text-sm font-medium mb-1">Barcode</label><input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">SKU</label><input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" placeholder="Auto-generate jika kosong" /></div>
                <div><label className="block text-sm font-medium mb-1">Kategori</label><select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field"><option value="">Pilih Kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Brand</label><input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Satuan</label><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field"><option value="pcs">pcs</option><option value="set">set</option><option value="box">box</option><option value="liter">liter</option><option value="kg">kg</option><option value="meter">meter</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Harga Eceran *</label><input type="number" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} className="input-field" required /></div>
                <div><label className="block text-sm font-medium mb-1">Harga Grosir</label><input type="number" value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Min. Qty Grosir</label><input type="number" value={form.wholesale_min_qty} onChange={(e) => setForm({ ...form, wholesale_min_qty: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Harga Modal (HPP)</label><input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="input-field" /></div>
                {!editingProduct && <div><label className="block text-sm font-medium mb-1">Stok Awal</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" /></div>}
                <div><label className="block text-sm font-medium mb-1">Stok Minimum</label><input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Lokasi Rak</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="Contoh: Rak A-1" /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && stockProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Sesuaikan Stok</h3>
            <p className="text-sm text-gray-500 mb-4">{stockProduct.name} (Stok saat ini: {stockProduct.stock})</p>
            <form onSubmit={handleStockAdjust} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tipe</label>
                <select value={stockForm.movement_type} onChange={(e) => setStockForm({ ...stockForm, movement_type: e.target.value })} className="input-field">
                  <option value="in">Masuk (+)</option>
                  <option value="out">Keluar (-)</option>
                  <option value="adjustment">Sesuaikan (=)</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Jumlah</label><input type="number" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} className="input-field" required min="0" /></div>
              <div><label className="block text-sm font-medium mb-1">Catatan</label><input type="text" value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} className="input-field" placeholder="Alasan perubahan stok" /></div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
