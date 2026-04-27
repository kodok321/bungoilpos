import { useState, useEffect } from 'react';
import { branchAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineBuildingStorefront } from 'react-icons/hi2';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { try { const { data } = await branchAPI.getAll(); setBranches(data); } catch (err) { console.error(err); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await branchAPI.update(editing.id, form); toast.success('Cabang diperbarui'); }
      else { await branchAPI.create(form); toast.success('Cabang ditambahkan'); }
      setShowModal(false); setEditing(null); setForm({ name: '', address: '', phone: '' }); loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manajemen Cabang</h3>
        <button onClick={() => { setEditing(null); setForm({ name: '', address: '', phone: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Tambah Cabang</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(b => (
          <div key={b.id} className="card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><HiOutlineBuildingStorefront className="w-6 h-6 text-blue-600" /></div>
              <div className="flex-1">
                <h4 className="font-medium">{b.name}</h4>
                <p className="text-sm text-gray-500">{b.address || '-'}</p>
                <p className="text-sm text-gray-500">{b.phone || '-'}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span>{b.user_count || 0} user</span>
                  <span>{b.product_count || 0} produk</span>
                </div>
              </div>
              <button onClick={() => { setEditing(b); setForm({ name: b.name, address: b.address || '', phone: b.phone || '' }); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit' : 'Tambah'} Cabang</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nama *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium mb-1">Alamat</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Telepon</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
