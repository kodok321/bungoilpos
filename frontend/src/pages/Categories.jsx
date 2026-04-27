import { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Kategori Produk</h3>
        <button onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-1">
          <HiOutlinePlus className="w-4 h-4" /> Tambah
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-gray-500">{c.description || '-'}</p>
              <p className="text-xs text-blue-600 mt-1">{c.product_count} produk</p>
            </div>
            <div className="flex gap-1">
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
