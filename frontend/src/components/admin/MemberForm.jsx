import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { memberAPI, slotAPI, seatAPI } from '../../api/services';
import { formatTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Spinner from '../ui/Spinner';

const MemberForm = ({ member, onSuccess, onCancel }) => {
  const [slots, setSlots] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: member ? {
      fullName: member.fullName,
      phone: member.phone,
      guardianPhone: member.guardianPhone || '',
      address: member.address || '',
      notes: member.notes || '',
      status: member.status || 'active',
      joiningDate: member.joiningDate ? new Date(member.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    } : {
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
    }
  });

  const watchedSeatId = watch('seatId');
  const watchedSlotId = watch('slotId');

  useEffect(() => {
    slotAPI.getAll().then(res => {
      const activeSlots = res.data.slots.filter(s => s.isActive);
      setSlots(activeSlots);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (watchedSlotId) {
      const slot = slots.find(s => s._id === watchedSlotId);
      setSelectedSlot(slot || null);
      setValue('seatId', '');
      setAvailabilityStatus(null);

      seatAPI.getAvailable(watchedSlotId)
        .then(res => setAvailableSeats(res.data.seats))
        .catch(() => setAvailableSeats([]));
    } else {
      setSelectedSlot(null);
      setAvailableSeats([]);
      setAvailabilityStatus(null);
    }
  }, [watchedSlotId, slots, setValue]);

  useEffect(() => {
    if (watchedSeatId && watchedSlotId && !member) {
      checkAvailability(watchedSeatId, watchedSlotId);
    }
  }, [watchedSeatId, watchedSlotId]);

  const checkAvailability = async (seatId, slotId) => {
    if (!seatId || !slotId) return;
    setCheckingAvailability(true);
    try {
      const res = await seatAPI.checkAvailability(seatId, slotId);
      setAvailabilityStatus(res.data);
    } catch (err) {
      setAvailabilityStatus(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const onSubmit = async (data) => {
    if (!member && availabilityStatus && !availabilityStatus.available) {
      toast.error('Seat is not available for this slot.');
      return;
    }

    setLoading(true);
    try {
      if (member) {
        await memberAPI.update(member._id, data);
        toast.success('Member updated.');
      } else {
        await memberAPI.create(data);
        toast.success('Member added successfully.');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input className={`input ${errors.fullName ? 'border-red-400' : ''}`} placeholder="Student name"
            {...register('fullName', { required: 'Name is required' })} />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="label">Phone Number *</label>
          <input className={`input ${errors.phone ? 'border-red-400' : ''}`} placeholder="10-digit number"
            {...register('phone', { required: 'Phone is required' })} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="label">Guardian Phone</label>
          <input className="input" placeholder="Parent/guardian number" {...register('guardianPhone')} />
        </div>
        <div>
          <label className="label">Joining Date</label>
          <input type="date" className="input" {...register('joiningDate')} />
        </div>
      </div>

      <div>
        <label className="label">Address</label>
        <input className="input" placeholder="Full address" {...register('address')} />
      </div>

      {!member && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
          <div>
            <label className="label">Select Slot *</label>
            <select className={`input ${errors.slotId ? 'border-red-400' : ''}`}
              {...register('slotId', { required: 'Slot is required' })}>
              <option value="">Choose a slot</option>
              {slots.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({formatTime(s.startTime)} – {formatTime(s.endTime)}) — ₹{s.monthlyFee}/mo
                </option>
              ))}
            </select>
            {errors.slotId && <p className="text-red-500 text-xs mt-1">{errors.slotId.message}</p>}
          </div>
          <div>
            <label className="label">Select Seat *</label>
            <select className={`input ${errors.seatId ? 'border-red-400' : ''}`}
              {...register('seatId', { required: 'Seat is required' })}
              disabled={!watchedSlotId || availableSeats.length === 0}>
              <option value="">
                {watchedSlotId ? 'Choose a seat' : 'Select slot first'}
              </option>
              {availableSeats.map(s => (
                <option key={s._id} value={s._id}>{s.seatNumber}</option>
              ))}
            </select>
            {errors.seatId && <p className="text-red-500 text-xs mt-1">{errors.seatId.message}</p>}
            {watchedSlotId && availableSeats.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">No seats are currently available for this slot.</p>
            )}
          </div>

          {checkingAvailability && (
            <div className="col-span-full flex items-center gap-2 text-sm text-slate-500">
              <Spinner size="sm" /> Checking availability…
            </div>
          )}
          {availabilityStatus && !checkingAvailability && (
            <div className={`col-span-full text-sm px-3 py-2 rounded-lg ${availabilityStatus.available
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
              {availabilityStatus.message}
            </div>
          )}
          {selectedSlot && (
            <div className="col-span-full text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
              Monthly fee for this slot: <strong className="text-blue-700 dark:text-blue-400">₹{selectedSlot.monthlyFee}</strong>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="label">Status</label>
        <select className="input" {...register('status')}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-[80px] resize-none" placeholder="Any additional notes…" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><Spinner size="sm" /> Saving…</> : member ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;
