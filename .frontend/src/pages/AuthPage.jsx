import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Lock, LogIn, Mail, Shield, UserPlus, Users } from 'lucide-react';
import { useApp } from '../context/useApp';

export const AuthPage = ({ mode = 'login' }) => {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, showToast } = useApp();
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        await login({ ...formData, role });
      } else {
        await signup(formData);
      }

      showToast(isLogin ? 'Signed in successfully' : 'Account created successfully', 'success');
      navigate('/', { replace: true });
    } catch (error) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-10 pb-16 animate-fade-in">
      <div className="grid min-h-[68vh] grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <section className="space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 font-display">
              {isLogin ? 'Sign in to Vocademy' : 'Join the word vault'}
            </h1>
            <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
              Sign in to browse, search, and add words. Each new word is saved with the contributor email.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-premium space-y-5">
          {isLogin && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all ${role === 'user' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500'}`}
              >
                <Users className="w-4 h-4" />
                User
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all ${role === 'admin' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500'}`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                name="password"
                required
                minLength="6"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/10 transition-all hover:bg-indigo-600 disabled:opacity-50"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <p className="text-center text-xs text-zinc-500">
            {isLogin ? 'Need a user account?' : 'Already have an account?'}{' '}
            <Link
              className="font-bold text-indigo-600 hover:text-indigo-700"
              to={isLogin ? '/signup' : '/login'}
              state={location.state}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
