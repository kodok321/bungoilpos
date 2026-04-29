import { useState, useEffect } from 'react';
import { userAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineKey } from 'react-icons/hi2';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'kasir', branch_id: '' });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => { try { const { data } = await userAPI.getAll(); setUsers(data); } catch (err) { console.error(err); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await userAPI.update(editing.id, { full_name: form.full_name, role: form.role }); toast.success('User diperbarui'); }
      else { await authAPI.register(form); toast.success('User ditambahkan'); }
      setShowModal(false); setEditing(null); setForm({ username: '', password: '', full_name: '', role: 'kasir', branch_id: '' }); loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try { await userAPI.resetPassword(showResetModal.id, { new_password: newPassword }); toast.success('Password direset'); setShowResetModal(null); setNewPassword(''); }
    catch (err) { toast.error('Gagal'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menonaktifkan user ini?')) return;
    try { await userAPI.delete(id); toast.success('User dinonaktifkan'); loadData(); } catch (err) { toast.error('Gagal'); }
  };

  const roleLabel = { admin: 'Admin', kasir: 'Kasir', mekanik: 'Mekanik', owner: 'Owner' };
  const roleColor = { admin: 'bg-blue-100 text-blue-700', kasir: 'bg-green-100 text-green-700', mekanik: 'bg-orange-100 text-orange-700', owner: 'bg-purple-100 text-purple-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manajemen User</h3>
        <button onClick={() => { setEditing(null); setForm({ username: '', password: '', full_name: '', role: 'kasir', branch_id: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-1"><HiOutlinePlus className="w-4 h-4" /> Tambah User</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-lg font-semibold text-blue-700">{u.full_name?.charAt(0)?.toUpperCase()}</span></div>
              <div className="flex-1">
                <p className="font-medium">{u.full_name}</p>
                <p className="text-sm text-gray-500">@{u.username}</p>
              </div>
              <span className={`badge ${roleColor[u.role] || 'bg-gray-100 text-gray-700'}`}>{roleLabel[u.role] || u.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${u.is_active ? 'text-green-600' : 'text-red-600'}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
              <div className="flex gap-1">
                <button onClick={() => setShowResetModal(u)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Reset Password"><HiOutlineKey className="w-4 h-4" /></button>
                <button onClick={() => { setEditing(u); setForm({ ...form, full_name: u.full_name, role: u.role }); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><HiOutlinePencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit' : 'Tambah'} User</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && <div><label className="block text-sm font-medium mb-1">Username *</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field" required /></div>}
              {!editing && <div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required /></div>}
              <div><label className="block text-sm font-medium mb-1">Nama Lengkap *</label><input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field"><option value="kasir">Kasir</option><option value="mekanik">Mekanik</option><option value="admin">Admin</option><option value="owner">Owner</option></select></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Reset Password - {showResetModal.full_name}</h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Password Baru *</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required minLength={4} /></div>
              <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowResetModal(null)} className="btn-secondary">Batal</button><button type="submit" className="btn-primary">Reset</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
