import { useState, useEffect, useRef } from 'react';
import { productAPI, transactionAPI, customerAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';
import {
  HiOutlineMagnifyingGlass, HiOutlineTrash, HiOutlinePlus, HiOutlineMinus,
  HiOutlineShoppingCart, HiOutlineQrCode, HiOutlinePrinter
} from 'react-icons/hi2';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [transactionType, setTransactionType] = useState('retail');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(null);
  const searchRef = useRef(null);
  const barcodeRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await productAPI.getAll({ limit: 200 });
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await customerAPI.getAll();
      setCustomers(data);
    } catch (err) { console.error(err); }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(c => c.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Stok tidak mencukupi');
        return;
      }
      setCart(cart.map(c =>
        c.product_id === product.id
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.unit_price }
          : c
      ));
    } else {
      if (product.stock <= 0) {
        toast.error('Stok habis');
        return;
      }
      const price = transactionType === 'wholesale' ? product.wholesale_price : product.retail_price;
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        barcode: product.barcode,
        unit_price: price,
        quantity: 1,
        stock: product.stock,
        subtotal: price,
        discount: 0
      }]);
    }
  };

  const handleBarcodeScan = async (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const barcode = e.target.value.trim();
      try {
        const { data } = await productAPI.getByBarcode(barcode);
        addToCart(data);
        e.target.value = '';
      } catch {
        toast.error('Produk tidak ditemukan');
      }
    }
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(c => c.product_id !== productId));
      return;
    }
    const item = cart.find(c => c.product_id === productId);
    if (qty > item.stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }
    setCart(cart.map(c =>
      c.product_id === productId
        ? { ...c, quantity: qty, subtotal: qty * c.unit_price - c.discount }
        : c
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(c => c.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = discount + cart.reduce((sum, item) => sum + item.discount, 0);
  const total = subtotal - totalDiscount;
  const paid = parseFloat(paidAmount) || 0;
  const change = paid - total;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Keranjang kosong'); return; }
    if (paymentMethod === 'cash' && paid < total) { toast.error('Pembayaran kurang'); return; }

    try {
      const payload = {
        customer_id: selectedCustomer || null,
        transaction_type: transactionType,
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity, discount: c.discount })),
        discount_amount: discount,
        paid_amount: paymentMethod === 'cash' ? paid : total,
        payment_method: paymentMethod,
      };

      const { data } = await transactionAPI.create(payload);
      toast.success('Transaksi berhasil!');
      setShowReceipt(data.transaction);
      setCart([]);
      setDiscount(0);
      setPaidAmount('');
      setSelectedCustomer('');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transaksi gagal');
    }
  };

  const quickPay = () => {
    setPaidAmount(total.toString());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Product List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              placeholder="Cari produk..."
            />
          </div>
          <div className="relative">
            <HiOutlineQrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={barcodeRef}
              type="text"
              onKeyDown={handleBarcodeScan}
              className="input-field pl-9 w-48"
              placeholder="Scan barcode..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className={`text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                p.stock <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' :
                p.stock <= p.min_stock ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400' :
                'bg-white border-gray-200 hover:border-blue-400'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.brand || '-'}</p>
              <p className="text-sm font-bold text-blue-600 mt-1">
                {formatCurrency(transactionType === 'wholesale' ? p.wholesale_price : p.retail_price)}
              </p>
              <p className={`text-xs mt-0.5 ${p.stock <= p.min_stock ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                Stok: {p.stock}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiOutlineShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Keranjang ({cart.length})</h3>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setTransactionType('retail')} className={`px-3 py-1 text-xs rounded-full font-medium ${transactionType === 'retail' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Eceran
              </button>
              <button onClick={() => setTransactionType('wholesale')} className={`px-3 py-1 text-xs rounded-full font-medium ${transactionType === 'wholesale' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                Grosir
              </button>
            </div>
          </div>

          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">Pelanggan Umum</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.customer_type === 'wholesale' ? 'Grosir' : 'Eceran'})</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keranjang kosong</p>
              <p className="text-xs">Klik produk atau scan barcode</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.product_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-1 rounded bg-gray-200 hover:bg-gray-300">
                  <HiOutlineMinus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                  className="w-12 text-center text-sm border rounded px-1 py-0.5"
                  min="0"
                />
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-1 rounded bg-gray-200 hover:bg-gray-300">
                  <HiOutlinePlus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-semibold w-20 text-right">{formatCurrency(item.quantity * item.unit_price)}</p>
              <button onClick={() => removeFromCart(item.product_id)} className="p-1 text-red-400 hover:text-red-600">
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 w-16">Diskon</label>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="input-field text-sm flex-1"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>

          <div className="flex gap-1 flex-wrap">
            {['cash', 'debit', 'qris', 'transfer'].map(method => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize ${paymentMethod === method ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {method === 'cash' ? 'Tunai' : method === 'debit' ? 'Debit' : method === 'qris' ? 'QRIS' : 'Transfer'}
              </button>
            ))}
          </div>

          {paymentMethod === 'cash' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="input-field text-sm flex-1"
                placeholder="Jumlah bayar"
              />
              <button onClick={quickPay} className="btn-secondary text-xs px-3">Uang Pas</button>
            </div>
          )}

          {paymentMethod === 'cash' && paid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kembalian</span>
              <span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(change)}</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="btn-success w-full py-3 text-base font-bold"
          >
            Bayar {formatCurrency(total)}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div id="receipt-print" className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">POS Sparepart & Bengkel</h3>
                <p className="text-xs text-gray-500">{showReceipt.invoice_number}</p>
                <p className="text-xs text-gray-500">{new Date(showReceipt.created_at).toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500">Kasir: {showReceipt.cashier_name}</p>
                {showReceipt.customer_name && <p className="text-xs text-gray-500">Pelanggan: {showReceipt.customer_name}</p>}
                <div className="border-t border-dashed border-gray-300 mt-2" />
              </div>

              <div className="space-y-1 mb-3">
                {showReceipt.items?.map((item, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-medium">{item.product_name}</p>
                    <div className="flex justify-between text-gray-600">
                      <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(showReceipt.subtotal)}</span></div>
                {showReceipt.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatCurrency(showReceipt.discount_amount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total</span><span>{formatCurrency(showReceipt.total_amount)}</span>
                </div>
                <div className="flex justify-between"><span>Bayar ({showReceipt.payment_method})</span><span>{formatCurrency(showReceipt.paid_amount)}</span></div>
                {showReceipt.change_amount > 0 && (
                  <div className="flex justify-between"><span>Kembalian</span><span>{formatCurrency(showReceipt.change_amount)}</span></div>
                )}
              </div>

              <div className="text-center mt-4 text-xs text-gray-400">
                <div className="border-t border-dashed border-gray-300 pt-2" />
                <p>Terima kasih atas kunjungan Anda!</p>
                <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t">
              <button onClick={() => window.print()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <HiOutlinePrinter className="w-4 h-4" /> Cetak
              </button>
              <button onClick={() => setShowReceipt(null)} className="btn-secondary flex-1">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
