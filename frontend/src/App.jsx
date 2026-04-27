import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import WorkOrders from './pages/WorkOrders';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Settings from './pages/Settings';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute roles={['admin', 'owner', 'kasir']}><POS /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute roles={['admin', 'owner', 'kasir']}><Products /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute roles={['admin', 'owner']}><Categories /></ProtectedRoute>} />
      <Route path="/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute roles={['admin', 'owner', 'kasir']}><Customers /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute roles={['admin', 'owner', 'kasir']}><Transactions /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin', 'owner']}><Reports /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['admin', 'owner']}><Users /></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute roles={['admin', 'owner']}><Branches /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['admin', 'owner']}><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
