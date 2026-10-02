import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, User, ExternalLink } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account settings</p>
      </div>

      {/* Admin Profile */}
      <div className="card p-6">
        <h2 className="section-title mb-4 flex items-center gap-2"><User size={18} /> Admin Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
              {admin?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{admin?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{admin?.email}</p>
            <span className="badge-green mt-1">Library Admin</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="section-title mb-4 flex items-center gap-2"><KeyRound size={18} /> Change Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className={`input ${errors.currentPassword ? 'border-red-400' : ''}`}
              placeholder="••••••••"
              {...register('currentPassword', { required: 'Current password is required' })} />
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className={`input ${errors.newPassword ? 'border-red-400' : ''}`}
              placeholder="Min 6 characters"
              {...register('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })} />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className={`input ${errors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder="Repeat new password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === newPassword || 'Passwords do not match',
              })} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Changing…</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Public Site Link */}
      <div className="card p-6">
        <h2 className="section-title mb-3">Public Website</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Your library's public page is visible to everyone without login.</p>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary inline-flex"
        >
          <ExternalLink size={15} /> View Public Page
        </a>
      </div>
    </div>
  );
};

export default SettingsPage;
