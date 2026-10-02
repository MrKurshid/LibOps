import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const { signup } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        library: {
          name: data.libraryName,
          address: data.address,
          contactNumber: data.contactNumber,
          whatsappNumber: data.whatsappNumber,
          openingTime: data.openingTime,
          closingTime: data.closingTime,
          is24Hours: data.is24Hours || false,
        },
      });
      toast.success('Account created successfully');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
        {[{ v: 'light', Icon: Sun }, { v: 'dark', Icon: Moon }, { v: 'system', Icon: Monitor }].map(({ v, Icon }) => (
          <button
            key={v}
            onClick={() => setTheme(v)}
            className={`p-2 rounded-md transition-all ${theme === v ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary-600 items-center justify-center mb-4 shadow-lg shadow-primary-600/30">
            <BookOpen size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">Library Owner Signup</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create your admin account and register your library.</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Your Name</label>
                <input
                  type="text"
                  className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Jane Doe"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="admin@library.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Library Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Library Name</label>
                  <input
                    type="text"
                    className={`input ${errors.libraryName ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="City Central Library"
                    {...register('libraryName', { required: 'Library name is required' })}
                  />
                  {errors.libraryName && <p className="text-red-500 text-xs mt-1">{errors.libraryName.message}</p>}
                </div>

                <div>
                  <label className="label">Contact Number</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="123-456-7890"
                    {...register('contactNumber')}
                  />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123 Library Lane, City"
                  {...register('address')}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">WhatsApp Number</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="123-456-7890"
                    {...register('whatsappNumber')}
                  />
                </div>

                <div className="flex items-end gap-3">
                  <label className="label !mb-0">24/7 Library</label>
                  <input type="checkbox" className="checkbox" {...register('is24Hours')} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Opening Time</label>
                  <input type="time" className="input" {...register('openingTime')} />
                </div>
                <div>
                  <label className="label">Closing Time</label>
                  <input type="time" className="input" {...register('closingTime')} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-sm"
            >
              <UserPlus size={16} />
              {loading ? 'Creating account...' : 'Create Library Owner Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account? <button type="button" onClick={() => navigate('/admin/login')} className="text-primary-600 dark:text-primary-400 font-semibold">Sign in</button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
