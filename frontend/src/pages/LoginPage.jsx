import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      await login({
        email: formData.email,
        password: formData.password,
      });
      toast.success('Welcome back');
      navigate(location.state?.from?.pathname || '/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="comparex-card p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-500">Welcome back</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">Login to CompareX</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="comparex-label">
              Email
            </label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="comparex-input mt-2" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="comparex-label">
              Password
            </label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="comparex-input mt-2" placeholder="Enter your password" />
          </div>
          <button type="submit" className="comparex-button-primary w-full" disabled={loading}>
            {loading ? <LoadingSpinner className="h-5 w-5" /> : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:underline dark:text-sky-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
