import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';
import {
  HiOutlineHome, HiOutlineShoppingCart, HiOutlineCube, HiOutlineWrenchScrewdriver,
  HiOutlineUsers, HiOutlineChartBar, HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle,
  HiOutlineBars3, HiOutlineXMark, HiOutlineBanknotes, HiOutlineUserGroup,
  HiOutlineBuildingStorefront, HiOutlineTag
} from 'react-icons/hi2';

const menuItems = [
  { path: '/', icon: HiOutlineHome, label: 'Dashboard', roles: ['admin', 'owner', 'kasir', 'mekanik'] },
  { path: '/pos', icon: HiOutlineShoppingCart, label: 'Kasir (POS)', roles: ['admin', 'owner', 'kasir'] },
  { path: '/products', icon: HiOutlineCube, label: 'Produk & Stok', roles: ['admin', 'owner', 'kasir'] },
  { path: '/categories', icon: HiOutlineTag, label: 'Kategori', roles: ['admin', 'owner'] },
  { path: '/work-orders', icon: HiOutlineWrenchScrewdriver, label: 'Work Order', roles: ['admin', 'owner', 'kasir', 'mekanik'] },
  { path: '/customers', icon: HiOutlineUserGroup, label: 'Pelanggan', roles: ['admin', 'owner', 'kasir'] },
  { path: '/transactions', icon: HiOutlineBanknotes, label: 'Transaksi', roles: ['admin', 'owner', 'kasir'] },
  { path: '/reports', icon: HiOutlineChartBar, label: 'Laporan', roles: ['admin', 'owner'] },
  { path: '/users', icon: HiOutlineUsers, label: 'User', roles: ['admin', 'owner'] },
  { path: '/branches', icon: HiOutlineBuildingStorefront, label: 'Cabang', roles: ['admin', 'owner'] },
  { path: '/settings', icon: HiOutlineCog6Tooth, label: 'Pengaturan', roles: ['admin', 'owner'] },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeName, setStoreName] = useState('Bung Oil');
  const [storeLogo, setStoreLogo] = useState(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  useEffect(() => {
    settingsAPI.getAll()
      .then(({ data }) => {
        if (data.store_name) setStoreName(data.store_name);
        if (data.store_logo) setStoreLogo(`/uploads/${data.store_logo}`);
      })
      .catch(() => { /* ignore */ });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = { admin: 'Admin', kasir: 'Kasir', mekanik: 'Mekanik', owner: 'Owner' };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 min-w-0">
              {storeLogo ? (
                <img src={storeLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlineWrenchScrewdriver className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900 truncate">{storeName}</h1>
                <p className="text-xs text-gray-500">POS System</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100 flex-shrink-0">
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {filteredMenu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-700">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{roleLabel[user?.role] || user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 flex-shrink-0" title="Logout">
                <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <HiOutlineBars3 className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {filteredMenu.find(m => m.path === location.pathname)?.label || 'POS System'}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
