import { useState, useEffect } from 'react';
import { workOrderAPI, customerAPI, userAPI, productAPI } from '../services/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineEye, HiOutlineWrenchScrewdriver } from 'react-icons/hi2';

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [products, setProducts] = useState([]);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    customer_id: '', mechanic_id: '', vehicle_type: '', vehicle_plate: '', vehicle_year: '',
    complaint: '', diagnosis: '', notes: '', estimated_completion: '',
    services: [{ service_name: '', price: '', description: '' }],
    items: []
  });

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const [woRes, custRes] = await Promise.all([
        workOrderAPI.getAll({ status: statusFilter }),
        customerAPI.getAll()
      ]);
      setWorkOrders(woRes.data.work_orders);
      setCustomers(custRes.data);
      try {
        const mechRes = await userAPI.getAll({ role: 'mekanik' });
        setMechanics(mechRes.data);
      } catch { setMechanics([]); }
      try {
        const prodRes = await productAPI.getAll({ limit: 200 });
        setProducts(prodRes.data.products || []);
      } catch { setProducts([]); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        services: form.services.filter(s => s.service_name).map(s => ({ ...s, price: parseFloat(s.price) || 0 })),
        items: form.items.filter(i => i.product_id).map(i => ({ ...i, quantity: parseInt(i.quantity) || 1 }))
      };
      await workOrderAPI.create(payload);
      toast.success('Work order berhasil dibuat');
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await workOrderAPI.updateStatus(id, { status });
      toast.success('Status diperbarui');
      loadData();
      if (showDetail) loadDetail(id);
    } catch (err) { toast.error('Gagal mengubah status'); }
  };

  const handleCompleteAndPay = async (id) => {
    try {
      await workOrderAPI.completeAndPay(id, { payment_method: 'cash' });
      toast.success('Work order selesai & lunas');
      loadData();
      setShowDetail(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const loadDetail = async (id) => {
    try {
      const { data } = await workOrderAPI.getById(id);
      setShowDetail(data);
    } catch (err) { toast.error('Gagal memuat detail'); }
  };

  const resetForm = () => {
    setForm({ customer_id: '', mechanic_id: '', vehicle_type: '', vehicle_plate: '', vehicle_year: '', complaint: '', diagnosis: '', notes: '', estimated_completion: '', services: [{ service_name: '', price: '', description: '' }], items: [] });
  };

  const addService = () => setForm({ ...form, services: [...form.services, { service_name: '', price: '', description: '' }] });
  const removeService = (i) => setForm({ ...form, services: form.services.filter((_, idx) => idx !== i) });
  const updateService = (i, field, value) => { const svcs = [...form.services]; svcs[i][field] = value; setForm({ ...form, services: svcs }); };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => { const its = [...form.items]; its[i][field] = value; setForm({ ...form, items: its }); };

  const statuses = ['', 'pending', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s ? getStatusLabel(s) : 'Semua'}
            </button>
          ))}
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1">
          <HiOutlinePlus className="w-4 h-4" /> Work Order Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? <p className="text-gray-400 col-span-full text-center py-8">Memuat...</p> :
        workOrders.length === 0 ? <p className="text-gray-400 col-span-full text-center py-8">Tidak ada work order</p> :
        workOrders.map(wo => (
          <div key={wo.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadDetail(wo.id)}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-blue-600">{wo.order_number}</p>
                <p className="text-sm text-gray-500">{formatDate(wo.created_at)}</p>
              </div>
              <span className={`badge ${getStatusColor(wo.status)}`}>{getStatusLabel(wo.status)}</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Pelanggan:</span> {wo.customer_name || '-'}</p>
              <p><span className="text-gray-500">Kendaraan:</span> {wo.vehicle_plate || '-'}</p>
              <p><span className="text-gray-500">Mekanik:</span> {wo.mechanic_name || 'Belum ditugaskan'}</p>
              <p className="font-bold text-lg mt-2">{formatCurrency(wo.total_amount)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><HiOutlineWrenchScrewdriver className="w-5 h-5" /> Work Order Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Pelanggan</label><select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="input-field"><option value="">Pilih Pelanggan</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Mekanik</label><select value={form.mechanic_id} onChange={(e) => setForm({ ...form, mechanic_id: e.target.value })} className="input-field"><option value="">Pilih Mekanik</option>{mechanics.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Tipe Kendaraan</label><input type="text" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="input-field" placeholder="Honda Beat" /></div>
                <div><label className="block text-sm font-medium mb-1">No. Polisi</label><input type="text" value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} className="input-field" placeholder="B 1234 XYZ" /></div>
                <div><label className="block text-sm font-medium mb-1">Tahun</label><input type="text" value={form.vehicle_year} onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })} className="input-field" placeholder="2022" /></div>
                <div><label className="block text-sm font-medium mb-1">Estimasi Selesai</label><input type="datetime-local" value={form.estimated_completion} onChange={(e) => setForm({ ...form, estimated_completion: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Keluhan</label><textarea value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} className="input-field" rows={2} /></div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Jasa Servis</label><button type="button" onClick={addService} className="text-sm text-blue-600 hover:underline">+ Tambah</button></div>
                {form.services.map((svc, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" value={svc.service_name} onChange={(e) => updateService(i, 'service_name', e.target.value)} className="input-field flex-1" placeholder="Nama jasa" />
                    <input type="number" value={svc.price} onChange={(e) => updateService(i, 'price', e.target.value)} className="input-field w-32" placeholder="Harga" />
                    {form.services.length > 1 && <button type="button" onClick={() => removeService(i)} className="text-red-500 px-2">x</button>}
                  </div>
                ))}
              </div>

              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Sparepart</label><button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Tambah</button></div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)} className="input-field flex-1"><option value="">Pilih produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}</select>
                    <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="input-field w-20" min="1" />
                    <button type="button" onClick={() => removeItem(i)} className="text-red-500 px-2">x</button>
                  </div>
                ))}
              </div>

              <div><label className="block text-sm font-medium mb-1">Catatan</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Buat Work Order</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{showDetail.order_number}</h3>
                <p className="text-sm text-gray-500">{formatDate(showDetail.created_at)}</p>
              </div>
              <span className={`badge text-sm ${getStatusColor(showDetail.status)}`}>{getStatusLabel(showDetail.status)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">Pelanggan:</span> <span className="font-medium">{showDetail.customer_name || '-'}</span></div>
              <div><span className="text-gray-500">Mekanik:</span> <span className="font-medium">{showDetail.mechanic_name || '-'}</span></div>
              <div><span className="text-gray-500">Kendaraan:</span> <span className="font-medium">{showDetail.vehicle_type || '-'} {showDetail.vehicle_plate || ''}</span></div>
              <div><span className="text-gray-500">Keluhan:</span> <span className="font-medium">{showDetail.complaint || '-'}</span></div>
            </div>

            {showDetail.services?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Jasa Servis</h4>
                <div className="space-y-1">{showDetail.services.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded"><span>{s.service_name}</span><span className="font-medium">{formatCurrency(s.price)}</span></div>
                ))}</div>
              </div>
            )}

            {showDetail.items?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Sparepart</h4>
                <div className="space-y-1">{showDetail.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded"><span>{it.product_name} x{it.quantity}</span><span className="font-medium">{formatCurrency(it.subtotal)}</span></div>
                ))}</div>
              </div>
            )}

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Jasa</span><span>{formatCurrency(showDetail.service_fee)}</span></div>
              <div className="flex justify-between"><span>Sparepart</span><span>{formatCurrency(showDetail.parts_total)}</span></div>
              {showDetail.discount_amount > 0 && <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatCurrency(showDetail.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatCurrency(showDetail.total_amount)}</span></div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {showDetail.status === 'pending' && <button onClick={() => handleStatusChange(showDetail.id, 'in_progress')} className="btn-primary">Mulai Kerjakan</button>}
              {showDetail.status === 'in_progress' && <button onClick={() => handleStatusChange(showDetail.id, 'waiting_parts')} className="btn-warning">Tunggu Part</button>}
              {(showDetail.status === 'in_progress' || showDetail.status === 'waiting_parts') && (
                <button onClick={() => handleCompleteAndPay(showDetail.id)} className="btn-success">Selesai & Bayar</button>
              )}
              {showDetail.status === 'completed' && <button onClick={() => handleStatusChange(showDetail.id, 'delivered')} className="btn-primary">Diserahkan</button>}
              <button onClick={() => setShowDetail(null)} className="btn-secondary">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
