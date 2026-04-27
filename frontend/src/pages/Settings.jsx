import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineCog6Tooth } from 'react-icons/hi2';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('store');
  const { user } = useAuth();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try { const { data } = await settingsAPI.getAll(); setSettings(data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    try { await settingsAPI.update(settings); toast.success('Pengaturan disimpan'); } catch (err) { toast.error('Gagal'); }
  };

  const updateSetting = (key, value) => setSettings({ ...settings, [key]: value });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex gap-1 mb-4">
        <button onClick={() => setTab('store')} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === 'store' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Toko</button>
        <button onClick={() => setTab('receipt')} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === 'receipt' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Struk</button>
        <button onClick={() => setTab('system')} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Sistem</button>
      </div>

      {tab === 'store' && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineCog6Tooth className="w-5 h-5" /> Pengaturan Toko</h3>
          <div><label className="block text-sm font-medium mb-1">Nama Toko</label><input type="text" value={settings.store_name || ''} onChange={(e) => updateSetting('store_name', e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Alamat</label><input type="text" value={settings.store_address || ''} onChange={(e) => updateSetting('store_address', e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Telepon</label><input type="text" value={settings.store_phone || ''} onChange={(e) => updateSetting('store_phone', e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Pajak (%)</label><input type="number" value={settings.tax_rate || '0'} onChange={(e) => updateSetting('tax_rate', e.target.value)} className="input-field" /></div>
        </div>
      )}

      {tab === 'receipt' && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold">Pengaturan Struk</h3>
          <div><label className="block text-sm font-medium mb-1">Footer Struk</label><textarea value={settings.receipt_footer || ''} onChange={(e) => updateSetting('receipt_footer', e.target.value)} className="input-field" rows={3} /></div>
          <div><label className="block text-sm font-medium mb-1">Lebar Printer (mm)</label>
            <select value={settings.printer_width || '80'} onChange={(e) => updateSetting('printer_width', e.target.value)} className="input-field">
              <option value="58">58mm</option><option value="80">80mm</option>
            </select>
          </div>
        </div>
      )}

      {tab === 'system' && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold">Informasi Sistem</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Versi</p><p className="font-medium">1.0.0</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Database</p><p className="font-medium">SQLite (Offline)</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">User Login</p><p className="font-medium">{user?.full_name}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Role</p><p className="font-medium capitalize">{user?.role}</p></div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary px-8">Simpan Pengaturan</button>
      </div>
    </div>
  );
}
