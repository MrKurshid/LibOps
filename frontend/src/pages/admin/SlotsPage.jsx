import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { slotAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatTime, formatCurrency } from '../../utils/helpers';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const SlotForm = ({ slot, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: slot || { isActive: true, monthlyFee: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (slot) {
        await slotAPI.update(slot._id, { ...data, monthlyFee: Number(data.monthlyFee) });
        toast.success('Slot updated.');
      } else {
        await slotAPI.create({ ...data, monthlyFee: Number(data.monthlyFee) });
        toast.success('Slot created.');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Slot Name *</label>
        <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Morning, Evening, Full Day"
          {...register('name', { required: 'Slot name is required' })} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Time *</label>
          <input type="time" className={`input ${errors.startTime ? 'border-red-400' : ''}`}
            {...register('startTime', { required: 'Start time is required' })} />
          {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
        </div>
        <div>
          <label className="label">End Time *</label>
          <input type="time" className={`input ${errors.endTime ? 'border-red-400' : ''}`}
            {...register('endTime', { required: 'End time is required' })} />
          {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Monthly Fee (₹) *</label>
        <input type="number" min="1" className={`input ${errors.monthlyFee ? 'border-red-400' : ''}`}
          placeholder="e.g. 500"
          {...register('monthlyFee', { required: 'Fee is required', min: { value: 1, message: 'Fee must be positive' } })} />
        {errors.monthlyFee && <p className="text-red-500 text-xs mt-1">{errors.monthlyFee.message}</p>}
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="isActive" className="w-4 h-4 accent-primary-600" {...register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">Active (visible to members)</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : slot ? 'Update Slot' : 'Create Slot'}
        </button>
      </div>
    </form>
  );
};

const SlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSlots = async () => {
    try {
      const res = await slotAPI.getAll();
      setSlots(res.data.slots);
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await slotAPI.delete(deletingSlot._id);
      toast.success('Slot deleted.');
      setDeletingSlot(null);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete slot.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (slot) => {
    try {
      await slotAPI.update(slot._id, { isActive: !slot.isActive });
      toast.success(`Slot ${slot.isActive ? 'deactivated' : 'activated'}.`);
      fetchSlots();
    } catch (err) {
      toast.error('Failed to update slot.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSlot(null);
    fetchSlots();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Slots</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage library time slots and pricing</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingSlot(null); setShowForm(true); }}>
          <Plus size={16} /> Add Slot
        </button>
      </div>

      {slots.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No slots yet"
          description="Create time slots like Morning, Evening, or Full Day."
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Slot</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {slots.map(slot => (
            <div key={slot._id} className={`card p-5 ${!slot.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{slot.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <Clock size={13} />
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(slot.monthlyFee)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">per month</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggle(slot)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${slot.isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}
                >
                  {slot.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {slot.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingSlot(slot); setShowForm(true); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => setDeletingSlot(slot)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingSlot(null); }} title={editingSlot ? 'Edit Slot' : 'Add Slot'}>
        <SlotForm slot={editingSlot} onSuccess={handleFormSuccess} onCancel={() => { setShowForm(false); setEditingSlot(null); }} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingSlot}
        onClose={() => setDeletingSlot(null)}
        onConfirm={handleDelete}
        title="Delete Slot"
        message={`Delete "${deletingSlot?.name}"? This cannot be undone.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default SlotsPage;
