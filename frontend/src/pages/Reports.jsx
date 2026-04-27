import { useState, useEffect } from 'react';
import { reportAPI, expenseAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (tab === 'sales') loadSales();
    else if (tab === 'profit') loadProfit();
    else if (tab === 'stock') loadStock();
    else if (tab === 'expenses') loadExpenses();
  }, [tab, dateFrom, dateTo]);

  const loadSales = async () => { try { const { data } = await reportAPI.sales({ date_from: dateFrom, date_to: dateTo }); setSalesData(data); } catch (err) { console.error(err); } };
  const loadProfit = async () => { try { const { data } = await reportAPI.profit({ date_from: dateFrom, date_to: dateTo }); setProfitData(data); } catch (err) { console.error(err); } };
  const loadStock = async () => { try { const { data } = await reportAPI.stock(); setStockData(data); } catch (err) { console.error(err); } };
  const loadExpenses = async () => { try { const { data } = await expenseAPI.getAll({ date_from: dateFrom, date_to: dateTo }); setExpenses(data); } catch (err) { console.error(err); } };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try { await expenseAPI.create({ ...expenseForm, amount: parseFloat(expenseForm.amount) }); toast.success('Ditambahkan'); setShowExpenseModal(false); setExpenseForm({ category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] }); loadExpenses(); if (tab === 'profit') loadProfit(); } catch (err) { toast.error('Gagal'); }
  };

  const tabs = [
    { id: 'sales', label: 'Penjualan' },
    { id: 'profit', label: 'Laba Rugi' },
    { id: 'stock', label: 'Stok' },
    { id: 'expenses', label: 'Pengeluaran' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
          ))}
        </div>
        {tab !== 'stock' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto text-sm" />
            <span className="text-gray-400">-</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto text-sm" />
          </div>
        )}
      </div>

      {/* Sales Report */}
      {tab === 'sales' && salesData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card"><p className="text-sm text-gray-500">Total Transaksi</p><p className="text-2xl font-bold">{salesData.summary.total_transactions}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Total Penjualan</p><p className="text-2xl font-bold text-green-600">{formatCurrency(salesData.summary.total_sales)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Total Diskon</p><p className="text-2xl font-bold text-red-600">{formatCurrency(salesData.summary.total_discount)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Rata-rata Transaksi</p><p className="text-2xl font-bold">{formatCurrency(salesData.summary.avg_transaction)}</p></div>
          </div>

          {salesData.data.length > 0 && (
            <div className="card">
              <h4 className="font-medium mb-4">Grafik Penjualan</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData.data.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} /><Bar dataKey="total_sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {salesData.by_payment_method.length > 0 && (
            <div className="card">
              <h4 className="font-medium mb-4">Per Metode Pembayaran</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {salesData.by_payment_method.map(pm => (
                  <div key={pm.payment_method} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 capitalize">{pm.payment_method}</p>
                    <p className="text-lg font-bold">{pm.count}x</p>
                    <p className="text-sm text-green-600">{formatCurrency(pm.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profit Report */}
      {tab === 'profit' && profitData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-green-50 border-green-200"><p className="text-sm text-green-600">Pendapatan</p><p className="text-2xl font-bold text-green-700">{formatCurrency(profitData.sales_profit.total_revenue + profitData.service_revenue)}</p><p className="text-xs text-green-600">Penjualan: {formatCurrency(profitData.sales_profit.total_revenue)} | Jasa: {formatCurrency(profitData.service_revenue)}</p></div>
            <div className="card bg-red-50 border-red-200"><p className="text-sm text-red-600">Pengeluaran</p><p className="text-2xl font-bold text-red-700">{formatCurrency(profitData.sales_profit.total_cost + profitData.total_expenses)}</p><p className="text-xs text-red-600">HPP: {formatCurrency(profitData.sales_profit.total_cost)} | Lainnya: {formatCurrency(profitData.total_expenses)}</p></div>
            <div className={`card ${profitData.net_profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}><p className="text-sm text-gray-600">Laba Bersih</p><p className={`text-2xl font-bold ${profitData.net_profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(profitData.net_profit)}</p></div>
          </div>

          {profitData.expense_by_category.length > 0 && (
            <div className="card">
              <h4 className="font-medium mb-4">Pengeluaran per Kategori</h4>
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={profitData.expense_by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}>
                    {profitData.expense_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v) => formatCurrency(v)} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Report */}
      {tab === 'stock' && stockData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card"><p className="text-sm text-gray-500">Total Produk</p><p className="text-2xl font-bold">{stockData.stock_value.total_products}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Total Unit</p><p className="text-2xl font-bold">{stockData.stock_value.total_units}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Nilai Modal</p><p className="text-2xl font-bold">{formatCurrency(stockData.stock_value.total_cost_value)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Nilai Jual</p><p className="text-2xl font-bold text-green-600">{formatCurrency(stockData.stock_value.total_retail_value)}</p></div>
          </div>

          {stockData.low_stock.length > 0 && (
            <div className="card">
              <h4 className="font-medium mb-4 text-red-600">Stok Menipis ({stockData.low_stock.length} produk)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2 px-3">Produk</th><th className="text-left py-2 px-3">Kategori</th><th className="text-center py-2 px-3">Stok</th><th className="text-center py-2 px-3">Min</th></tr></thead>
                  <tbody>{stockData.low_stock.map(p => (
                    <tr key={p.id} className="border-b border-gray-50"><td className="py-2 px-3">{p.name}</td><td className="py-2 px-3 text-xs">{p.category_name || '-'}</td><td className="py-2 px-3 text-center"><span className="badge bg-red-100 text-red-700">{p.stock}</span></td><td className="py-2 px-3 text-center text-gray-500">{p.min_stock}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {stockData.by_category.length > 0 && (
            <div className="card">
              <h4 className="font-medium mb-4">Stok per Kategori</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockData.by_category}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="total_stock" fill="#8B5CF6" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Daftar Pengeluaran</h4>
            <button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Tambah</button>
          </div>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4 font-medium text-gray-500">Tanggal</th><th className="text-left py-3 px-4 font-medium text-gray-500">Kategori</th><th className="text-left py-3 px-4 font-medium text-gray-500">Deskripsi</th><th className="text-right py-3 px-4 font-medium text-gray-500">Jumlah</th></tr></thead>
              <tbody>{expenses.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tidak ada data</td></tr> :
                expenses.map(e => (<tr key={e.id} className="border-b border-gray-50"><td className="py-3 px-4">{e.date}</td><td className="py-3 px-4"><span className="badge bg-gray-100 text-gray-700">{e.category}</span></td><td className="py-3 px-4">{e.description || '-'}</td><td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td></tr>))
              }</tbody>
            </table>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Tambah Pengeluaran</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Kategori *</label><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="input-field" required><option value="">Pilih</option><option value="Operasional">Operasional</option><option value="Gaji">Gaji</option><option value="Sewa">Sewa</option><option value="Listrik & Air">Listrik & Air</option><option value="Transportasi">Transportasi</option><option value="Perlengkapan">Perlengkapan</option><option value="Lainnya">Lainnya</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Deskripsi</label><input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Jumlah *</label><input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium mb-1">Tanggal</label><input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className="input-field" /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
