import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'driver' ? '/driver' : '/rider');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="bg-brand-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-brand-light">
        <div className="text-center mb-8">
          <span className="text-5xl">🚖</span>
          <h1 className="text-3xl font-bold text-brand-yellow mt-2">Uber Lite</h1>
          <p className="text-gray-400 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email"
            className="w-full bg-brand-dark border border-brand-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})}
          />
          <input
            type="password" placeholder="Password"
            className="w-full bg-brand-dark border border-brand-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})}
          />
          <button type="submit"
            className="w-full bg-brand-yellow text-brand-dark font-bold py-3 rounded-xl hover:opacity-90 transition-all">
            Sign In
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          No account? <Link to="/register" className="text-brand-yellow hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
