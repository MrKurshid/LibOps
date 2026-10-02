import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Bell, Calendar } from 'lucide-react';
import { noticeAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/helpers';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const NoticeForm = ({ notice, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: notice ? {
      title: notice.title,
      description: notice.description,
      visibleFrom: notice.visibleFrom?.split('T')[0],
      visibleUntil: notice.visibleUntil?.split('T')[0],
    } : { visibleFrom: today, visibleUntil: nextMonth }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (notice) {
        await noticeAPI.update(notice._id, data);
        toast.success('Notice updated.');
      } else {
        await noticeAPI.create(data);
        toast.success('Notice created.');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className={`input ${errors.title ? 'border-red-400' : ''}`} placeholder="Notice title"
          {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">Description *</label>
        <textarea rows={4} className={`input resize-none ${errors.description ? 'border-red-400' : ''}`}
          placeholder="Notice details…"
          {...register('description', { required: 'Description is required' })} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Visible From *</label>
          <input type="date" className={`input ${errors.visibleFrom ? 'border-red-400' : ''}`}
            {...register('visibleFrom', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Visible Until *</label>
          <input type="date" className={`input ${errors.visibleUntil ? 'border-red-400' : ''}`}
            {...register('visibleUntil', { required: 'Required' })} />
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/40 px-3 py-2 rounded-lg">
        The notice will automatically appear and disappear based on these dates.
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : notice ? 'Update Notice' : 'Create Notice'}
        </button>
      </div>
    </form>
  );
};

const NoticesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [deletingNotice, setDeletingNotice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'add') { setShowForm(true); setSearchParams({}); }
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await noticeAPI.getAll();
      setNotices(res.data.notices);
    } catch (err) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await noticeAPI.delete(deletingNotice._id);
      toast.success('Notice deleted.');
      setDeletingNotice(null);
      fetchNotices();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isActive = (notice) => {
    const now = new Date();
    return new Date(notice.visibleFrom) <= now && new Date(notice.visibleUntil) >= now;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Post announcements for library visitors</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingNotice(null); setShowForm(true); }}>
          <Plus size={16} /> Add Notice
        </button>
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices yet"
          description="Post announcements, reminders, or updates for library visitors."
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Notice</button>}
        />
      ) : (
        <div className="space-y-3">
          {notices.map(notice => {
            const active = isActive(notice);
            return (
              <div key={notice._id} className={`card p-5 ${!active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{notice.title}</h3>
                      <span className={active ? 'badge-green' : 'badge-gray'}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{notice.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> From: {formatDate(notice.visibleFrom)}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> Until: {formatDate(notice.visibleUntil)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingNotice(notice); setShowForm(true); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    ><Edit size={15} /></button>
                    <button
                      onClick={() => setDeletingNotice(notice)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    ><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingNotice(null); }} title={editingNotice ? 'Edit Notice' : 'Add Notice'}>
        <NoticeForm notice={editingNotice} onSuccess={() => { setShowForm(false); setEditingNotice(null); fetchNotices(); }} onCancel={() => { setShowForm(false); setEditingNotice(null); }} />
      </Modal>

      <ConfirmDialog isOpen={!!deletingNotice} onClose={() => setDeletingNotice(null)} onConfirm={handleDelete}
        title="Delete Notice" message={`Delete "${deletingNotice?.title}"?`} isLoading={deleteLoading} />
    </div>
  );
};

export default NoticesPage;
