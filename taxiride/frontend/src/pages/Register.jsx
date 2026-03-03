import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'rider' });
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/register', form);
      login(data.user, data.token);
      toast.success('Account created! 🎉');
      navigate(data.user.role === 'driver' ? '/driver' : '/rider');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="bg-brand-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-brand-light">
        <div className="text-center mb-8">
          <span className="text-5xl">🚖</span>
          <h1 className="text-3xl font-bold text-brand-yellow mt-2">Create Account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name"
            className="w-full bg-brand-dark border border-brand-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          />
          <input type="email" placeholder="Email"
            className="w-full bg-brand-dark border border-brand-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})}
          />
          <input type="password" placeholder="Password"
            className="w-full bg-brand-dark border border-brand-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})}
          />
          <div className="flex gap-3">
            {['rider', 'driver'].map(role => (
              <button key={role} type="button"
                onClick={() => setForm({...form, role})}
                className={`flex-1 py-3 rounded-xl font-semibold capitalize transition-all ${
                  form.role === role
                    ? 'bg-brand-yellow text-brand-dark'
                    : 'bg-brand-dark border border-brand-light text-white'
                }`}>
                {role === 'rider' ? '🧑 Rider' : '🚗 Driver'}
              </button>
            ))}
          </div>
          <button type="submit"
            className="w-full bg-brand-yellow text-brand-dark font-bold py-3 rounded-xl hover:opacity-90 transition-all">
            Create Account
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Have account? <Link to="/login" className="text-brand-yellow hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
