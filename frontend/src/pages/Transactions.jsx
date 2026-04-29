import { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineXCircle, HiOutlinePrinter } from 'react-icons/hi2';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showDetail, setShowDetail] = useState(null);
  const { hasRole } = useAuth();

  useEffect(() => { loadData(); }, [typeFilter, dateFrom, dateTo, page]);

  const loadData = async () => {
    try {
      const { data } = await transactionAPI.getAll({ transaction_type: typeFilter, date_from: dateFrom, date_to: dateTo, page });
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadDetail = async (id) => {
    try { const { data } = await transactionAPI.getById(id); setShowDetail(data); } catch (err) { toast.error('Gagal'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.')) return;
    try { await transactionAPI.cancel(id); toast.success('Transaksi dibatalkan'); loadData(); setShowDetail(null); } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">Semua Tipe</option><option value="retail">Eceran</option><option value="wholesale">Grosir</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input-field w-auto" />
        <span className="text-gray-400">s/d</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input-field w-auto" />
      </div>

      <div className="table-container">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Tanggal</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Pelanggan</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Kasir</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Tipe</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Bayar</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="text-center py-8 text-gray-400">Memuat...</td></tr> :
            transactions.length === 0 ? <tr><td colSpan={9} className="text-center py-8 text-gray-400">Tidak ada transaksi</td></tr> :
            transactions.map(t => (
              <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 ${t.payment_status === 'cancelled' ? 'opacity-50' : ''}`}>
                <td className="py-3 px-4 font-mono text-xs">{t.invoice_number}</td>
                <td className="py-3 px-4 text-xs">{formatDate(t.created_at)}</td>
                <td className="py-3 px-4">{t.customer_name || 'Umum'}</td>
                <td className="py-3 px-4 text-xs">{t.cashier_name}</td>
                <td className="py-3 px-4 text-center"><span className={`badge ${t.transaction_type === 'wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t.transaction_type === 'wholesale' ? 'Grosir' : 'Eceran'}</span></td>
                <td className="py-3 px-4 text-center text-xs capitalize">{t.payment_method}</td>
                <td className="py-3 px-4 text-center"><span className={`badge ${t.payment_status === 'paid' ? 'bg-green-100 text-green-700' : t.payment_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.payment_status === 'paid' ? 'Lunas' : t.payment_status === 'cancelled' ? 'Batal' : 'Pending'}</span></td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(t.total_amount)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => loadDetail(t.id)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"><HiOutlineEye className="w-4 h-4" /></button>
                    {hasRole('admin', 'owner') && t.payment_status !== 'cancelled' && (
                      <button onClick={() => handleCancel(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Batalkan"><HiOutlineXCircle className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{pagination.total} transaksi</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm px-3 py-1">&laquo;</button>
            <span className="px-3 py-1 text-sm">{page}/{pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm px-3 py-1">&raquo;</button>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold">{showDetail.invoice_number}</h3>
              <p className="text-sm text-gray-500">{formatDate(showDetail.created_at)}</p>
              <p className="text-sm text-gray-500">Kasir: {showDetail.cashier_name}</p>
              {showDetail.customer_name && <p className="text-sm text-gray-500">Pelanggan: {showDetail.customer_name}</p>}
            </div>
            <div className="space-y-2 mb-4">
              {showDetail.items?.map((it, i) => (
                <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                  <div><p className="font-medium">{it.product_name}</p><p className="text-xs text-gray-500">{it.quantity} x {formatCurrency(it.unit_price)}</p></div>
                  <span className="font-medium">{formatCurrency(it.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(showDetail.subtotal)}</span></div>
              {showDetail.discount_amount > 0 && <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatCurrency(showDetail.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-1 border-t"><span>Total</span><span>{formatCurrency(showDetail.total_amount)}</span></div>
              <div className="flex justify-between"><span>Bayar</span><span>{formatCurrency(showDetail.paid_amount)}</span></div>
              {showDetail.change_amount > 0 && <div className="flex justify-between"><span>Kembalian</span><span>{formatCurrency(showDetail.change_amount)}</span></div>}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => window.print()} className="btn-primary flex-1 flex items-center justify-center gap-2"><HiOutlinePrinter className="w-4 h-4" /> Cetak</button>
              <button onClick={() => setShowDetail(null)} className="btn-secondary flex-1">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
