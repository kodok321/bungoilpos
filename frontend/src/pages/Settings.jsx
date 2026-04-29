import { useState, useEffect, useRef } from 'react';
import { settingsAPI, backupAPI } from '../services/api';
import { downloadBlob } from '../utils/download';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineCog6Tooth, HiOutlinePhoto, HiOutlineTrash, HiOutlineArrowDownTray,
  HiOutlineServerStack, HiOutlineShieldCheck, HiOutlineClock
} from 'react-icons/hi2';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('store');
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [backingUp, setBackingUp] = useState(false);
  const logoRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { if (tab === 'backup') loadBackups(); }, [tab]);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.getAll();
      setSettings(data);
      if (data.store_logo) setLogoPreview(`/uploads/${data.store_logo}`);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try { await settingsAPI.update(settings); toast.success('Pengaturan disimpan'); } catch (err) { toast.error('Gagal'); }
  };

  const updateSetting = (key, value) => setSettings({ ...settings, [key]: value });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);
    setUploading(true);
    try {
      const { data } = await settingsAPI.uploadLogo(formData);
      setLogoPreview(data.logo_url);
      toast.success('Logo berhasil diupload');
      loadSettings();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal upload logo'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Yakin ingin menghapus logo?')) return;
    try {
      await settingsAPI.deleteLogo();
      setLogoPreview(null);
      const updated = { ...settings };
      delete updated.store_logo;
      setSettings(updated);
      toast.success('Logo berhasil dihapus');
    } catch { toast.error('Gagal menghapus logo'); }
  };

  const loadBackups = async () => {
    try { const { data } = await backupAPI.list(); setBackups(data); } catch { setBackups([]); }
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    try {
      const { data } = await backupAPI.create();
      toast.success(data.message);
      loadBackups();
    } catch (err) { toast.error('Gagal membuat backup'); }
    finally { setBackingUp(false); }
  };

  const handleDownloadBackup = async () => {
    try {
      toast.loading('Menyiapkan backup...', { id: 'backup' });
      const { data } = await backupAPI.download();
      downloadBlob(data, `pos-backup-${new Date().toISOString().slice(0, 10)}.db`);
      toast.success('Backup berhasil didownload', { id: 'backup' });
    } catch { toast.error('Gagal download backup', { id: 'backup' }); }
  };

  const handleDeleteBackup = async (filename) => {
    if (!confirm('Yakin ingin menghapus backup ini?')) return;
    try {
      await backupAPI.delete(filename);
      toast.success('Backup dihapus');
      loadBackups();
    } catch { toast.error('Gagal menghapus backup'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex gap-1 mb-4 flex-wrap">
        {['store', 'receipt', 'backup', 'system'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t === 'store' ? 'Toko' : t === 'receipt' ? 'Struk' : t === 'backup' ? 'Backup' : 'Sistem'}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <div className="space-y-4">
          {/* Logo Section */}
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlinePhoto className="w-5 h-5" /> Logo Toko</h3>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <HiOutlinePhoto className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Upload logo toko untuk ditampilkan di sidebar, struk, dan laporan PDF. Format: PNG, JPG, SVG, WEBP. Maks 5MB.</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => logoRef.current?.click()} disabled={uploading} className="btn-primary text-sm">
                    {uploading ? 'Mengupload...' : logoPreview ? 'Ganti Logo' : 'Upload Logo'}
                  </button>
                  {logoPreview && (
                    <button onClick={handleDeleteLogo} className="btn-danger text-sm flex items-center gap-1">
                      <HiOutlineTrash className="w-4 h-4" /> Hapus
                    </button>
                  )}
                </div>
                <input ref={logoRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>
          </div>

          {/* Store Info */}
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineCog6Tooth className="w-5 h-5" /> Pengaturan Toko</h3>
            <div><label className="block text-sm font-medium mb-1">Nama Toko</label><input type="text" value={settings.store_name || ''} onChange={(e) => updateSetting('store_name', e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Alamat</label><input type="text" value={settings.store_address || ''} onChange={(e) => updateSetting('store_address', e.target.value)} className="input-field" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Telepon</label><input type="text" value={settings.store_phone || ''} onChange={(e) => updateSetting('store_phone', e.target.value)} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Pajak (%)</label><input type="number" value={settings.tax_rate || '0'} onChange={(e) => updateSetting('tax_rate', e.target.value)} className="input-field" /></div>
            </div>
          </div>
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

      {tab === 'backup' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineServerStack className="w-5 h-5" /> Backup Database</h3>
            <p className="text-sm text-gray-500">Backup database untuk menyimpan semua data transaksi, produk, pelanggan, dan pengaturan. Disarankan backup secara berkala.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleCreateBackup} disabled={backingUp} className="btn-primary flex items-center gap-2">
                <HiOutlineShieldCheck className="w-4 h-4" /> {backingUp ? 'Membuat backup...' : 'Buat Backup Baru'}
              </button>
              <button onClick={handleDownloadBackup} className="btn-success flex items-center gap-2">
                <HiOutlineArrowDownTray className="w-4 h-4" /> Download Backup
              </button>
            </div>
          </div>

          {backups.length > 0 && (
            <div className="card">
              <h4 className="font-medium mb-3 flex items-center gap-2"><HiOutlineClock className="w-4 h-4" /> Riwayat Backup</h4>
              <div className="space-y-2">
                {backups.map((b) => (
                  <div key={b.filename} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.filename}</p>
                      <p className="text-xs text-gray-500">{b.size} &bull; {new Date(b.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => handleDeleteBackup(b.filename)} className="p-2 text-red-600 hover:bg-red-50 rounded flex-shrink-0">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'system' && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold">Informasi Sistem</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Versi</p><p className="font-medium">2.0.0</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Database</p><p className="font-medium">SQLite (Offline)</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">User Login</p><p className="font-medium">{user?.full_name}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Role</p><p className="font-medium capitalize">{user?.role}</p></div>
          </div>
        </div>
      )}

      {(tab === 'store' || tab === 'receipt') && (
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary px-8">Simpan Pengaturan</button>
        </div>
      )}
    </div>
  );
}
