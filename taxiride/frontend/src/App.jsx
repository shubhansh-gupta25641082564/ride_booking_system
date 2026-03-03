import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import RiderDashboard from './pages/RiderDashboard';
import DriverDashboard from './pages/DriverDashboard';

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user } = useStore();

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#16213E', color: '#fff', border: '1px solid #0F3460' }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rider" element={<ProtectedRoute allowedRole="rider"><RiderDashboard /></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />
        <Route path="/" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/rider'} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
