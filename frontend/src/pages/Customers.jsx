import { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineEye } from 'react-icons/hi2';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', customer_type: 'retail', vehicle_info: '' });

  useEffect(() => { loadData(); }, [search, typeFilter]);

  const loadData = async () => {
    try { const { data } = await customerAPI.getAll({ search, customer_type: typeFilter }); setCustomers(data); } catch (err) { console.error(err); }
  };

  const loadDetail = async (id) => {
    try { const { data } = await customerAPI.getById(id); setShowDetail(data); } catch (err) { toast.error('Gagal'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await customerAPI.update(editing.id, form); toast.success('Pelanggan diperbarui'); }
      else { await customerAPI.create(form); toast.success('Pelanggan ditambahkan'); }
      setShowModal(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', customer_type: 'retail', vehicle_info: '' }); loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin?')) return;
    try { await customerAPI.delete(id); toast.success('Dihapus'); loadData(); } catch (err) { toast.error('Gagal'); }
  };

  const openEdit = (c) => {
    setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', customer_type: c.customer_type, vehicle_info: c.vehicle_info || '' }); setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" placeholder="Cari pelanggan..." />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-auto">
          <option value="">Semua Tipe</option><option value="retail">Eceran</option><option value="wholesale">Grosir</option>
        </select>
        <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '', customer_type: 'retail', vehicle_info: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Tambah</button>
      </div>

      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Nama</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Telepon</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Tipe</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Kendaraan</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Total Belanja</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Aksi</th>
          </tr></thead>
          <tbody>
            {customers.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data</td></tr> :
            customers.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{c.name}</td>
                <td className="py-3 px-4">{c.phone || '-'}</td>
                <td className="py-3 px-4"><span className={`badge ${c.customer_type === 'wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{c.customer_type === 'wholesale' ? 'Grosir' : 'Eceran'}</span></td>
                <td className="py-3 px-4 text-xs">{c.vehicle_info || '-'}</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(c.total_purchases)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => loadDetail(c.id)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"><HiOutlineEye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit' : 'Tambah'} Pelanggan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Nama *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
                <div><label className="block text-sm font-medium mb-1">Telepon</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium mb-1">Tipe</label><select value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })} className="input-field"><option value="retail">Eceran</option><option value="wholesale">Grosir</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Alamat</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Info Kendaraan</label><input type="text" value={form.vehicle_info} onChange={(e) => setForm({ ...form, vehicle_info: e.target.value })} className="input-field" placeholder="Honda Beat 2020" /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">{showDetail.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">Telepon:</span> {showDetail.phone || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {showDetail.email || '-'}</div>
              <div><span className="text-gray-500">Tipe:</span> {showDetail.customer_type === 'wholesale' ? 'Grosir' : 'Eceran'}</div>
              <div><span className="text-gray-500">Total Belanja:</span> {formatCurrency(showDetail.total_purchases)}</div>
              <div className="col-span-2"><span className="text-gray-500">Kendaraan:</span> {showDetail.vehicle_info || '-'}</div>
            </div>
            {showDetail.recent_transactions?.length > 0 && (<div className="mb-4"><h4 className="font-medium mb-2">Transaksi Terakhir</h4><div className="space-y-1">{showDetail.recent_transactions.map(t => (<div key={t.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded"><span>{t.invoice_number} - {formatDate(t.created_at)}</span><span className="font-medium">{formatCurrency(t.total_amount)}</span></div>))}</div></div>)}
            <button onClick={() => setShowDetail(null)} className="btn-secondary">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
