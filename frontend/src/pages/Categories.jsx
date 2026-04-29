import { useState, useEffect, useRef } from 'react';
import { categoryAPI, exportImportAPI } from '../services/api';
import { downloadBlob } from '../utils/download';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArrowDownTray,
  HiOutlineArrowUpTray, HiOutlineDocumentText, HiOutlineTableCells
} from 'react-icons/hi2';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try { const { data } = await categoryAPI.getAll(); setCategories(data); } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await categoryAPI.update(editing.id, form); toast.success('Kategori diperbarui'); }
      else { await categoryAPI.create(form); toast.success('Kategori ditambahkan'); }
      setShowModal(false); setEditing(null); setForm({ name: '', description: '' }); loadCategories();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try { await categoryAPI.delete(id); toast.success('Kategori dihapus'); loadCategories(); }
    catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Mengexport Excel...', { id: 'export' });
      const { data } = await exportImportAPI.exportCategoriesExcel();
      downloadBlob(data, `kategori-${Date.now()}.xlsx`);
      toast.success('Export Excel berhasil', { id: 'export' });
    } catch { toast.error('Gagal export Excel', { id: 'export' }); }
    setShowExportMenu(false);
  };

  const handleExportPdf = async () => {
    try {
      toast.loading('Mengexport PDF...', { id: 'export' });
      const { data } = await exportImportAPI.exportCategoriesPdf();
      downloadBlob(data, `kategori-${Date.now()}.pdf`);
      toast.success('Export PDF berhasil', { id: 'export' });
    } catch { toast.error('Gagal export PDF', { id: 'export' }); }
    setShowExportMenu(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await exportImportAPI.downloadTemplate('categories');
      downloadBlob(data, 'template-kategori.xlsx');
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
      const { data } = await exportImportAPI.importCategories(formData);
      toast.success(data.message);
      loadCategories();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal import'); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold">Kategori Produk</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-1 text-sm">
            <HiOutlinePlus className="w-4 h-4" /> Tambah
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="card flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{c.name}</p>
              <p className="text-xs text-gray-500 truncate">{c.description || '-'}</p>
              <p className="text-xs text-blue-600 mt-1">{c.product_count} produk</p>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit' : 'Tambah'} Kategori</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nama *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium mb-1">Deskripsi</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
