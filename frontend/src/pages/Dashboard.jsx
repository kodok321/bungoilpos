import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/format';
import {
  HiOutlineBanknotes, HiOutlineShoppingCart, HiOutlineWrenchScrewdriver,
  HiOutlineExclamationTriangle, HiOutlineCube, HiOutlineUserGroup
} from 'react-icons/hi2';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: result } = await reportAPI.dashboard();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!data) return <div className="text-center py-10 text-gray-500">Gagal memuat data</div>;

  const stats = [
    { label: 'Penjualan Hari Ini', value: formatCurrency(data.today_sales.total), sub: `${data.today_sales.count} transaksi`, icon: HiOutlineBanknotes, color: 'bg-green-500' },
    { label: 'Penjualan Bulan Ini', value: formatCurrency(data.month_sales.total), sub: `${data.month_sales.count} transaksi`, icon: HiOutlineShoppingCart, color: 'bg-blue-500' },
    { label: 'Work Order Aktif', value: data.active_work_orders.count, sub: `${data.today_work_orders.count} hari ini`, icon: HiOutlineWrenchScrewdriver, color: 'bg-orange-500' },
    { label: 'Stok Menipis', value: data.low_stock_products.count, sub: `dari ${data.total_products.count} produk`, icon: HiOutlineExclamationTriangle, color: 'bg-red-500' },
    { label: 'Total Produk', value: data.total_products.count, sub: 'produk aktif', icon: HiOutlineCube, color: 'bg-purple-500' },
    { label: 'Total Pelanggan', value: data.total_customers.count, sub: 'pelanggan terdaftar', icon: HiOutlineUserGroup, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transaksi Terbaru</h3>
            <Link to="/transactions" className="text-sm text-blue-600 hover:underline">Lihat Semua</Link>
          </div>
          <div className="space-y-3">
            {data.recent_transactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Belum ada transaksi</p>
            ) : data.recent_transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.invoice_number}</p>
                  <p className="text-xs text-gray-500">{t.customer_name || 'Umum'} &bull; {formatDate(t.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(t.total_amount)}</p>
                  <span className={`badge ${t.transaction_type === 'wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {t.transaction_type === 'wholesale' ? 'Grosir' : 'Eceran'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Work Order Terbaru</h3>
            <Link to="/work-orders" className="text-sm text-blue-600 hover:underline">Lihat Semua</Link>
          </div>
          <div className="space-y-3">
            {data.recent_work_orders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Belum ada work order</p>
            ) : data.recent_work_orders.map((wo) => (
              <div key={wo.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{wo.order_number}</p>
                  <p className="text-xs text-gray-500">{wo.customer_name || '-'} &bull; {wo.vehicle_plate || '-'}</p>
                  <p className="text-xs text-gray-400">{wo.mechanic_name || 'Belum ditugaskan'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(wo.total_amount)}</p>
                  <span className={`badge ${getStatusColor(wo.status)}`}>{getStatusLabel(wo.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {data.top_products.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Produk Terlaris Bulan Ini</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">Produk</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Terjual</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3 text-right">{p.total_sold}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(p.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
