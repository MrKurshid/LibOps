import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, Armchair, CheckCircle, XCircle } from 'lucide-react';
import { seatAPI, slotAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatTime, getPaymentBadge, getPaymentLabel } from '../../utils/helpers';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const AddSeatForm = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState('single');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { prefix: 'Seat ', from: 1 } });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (mode === 'single') {
        await seatAPI.create({ seatNumber: data.seatNumber });
        toast.success('Seat created.');
      } else {
        await seatAPI.createBulk({ from: Number(data.from), to: Number(data.to), prefix: data.prefix });
        toast.success('Seats created.');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create seat(s).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'single' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          onClick={() => setMode('single')}
        >Single Seat</button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'bulk' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          onClick={() => setMode('bulk')}
        >Bulk Create</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mode === 'single' ? (
          <div>
            <label className="label">Seat Number / Name *</label>
            <input className={`input ${errors.seatNumber ? 'border-red-400' : ''}`} placeholder="e.g. Seat 1 or A-01"
              {...register('seatNumber', { required: 'Seat number is required' })} />
            {errors.seatNumber && <p className="text-red-500 text-xs mt-1">{errors.seatNumber.message}</p>}
          </div>
        ) : (
          <>
            <div>
              <label className="label">Prefix</label>
              <input className="input" placeholder="Seat " {...register('prefix')} />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">e.g. "Seat " will create "Seat 1", "Seat 2"…</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From *</label>
                <input type="number" min="1" className={`input ${errors.from ? 'border-red-400' : ''}`}
                  {...register('from', { required: true, min: 1 })} />
              </div>
              <div>
                <label className="label">To *</label>
                <input type="number" min="1" className={`input ${errors.to ? 'border-red-400' : ''}`}
                  {...register('to', { required: true, min: 1 })} />
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
              Maximum 200 seats per bulk operation.
            </p>
          </>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : mode === 'single' ? 'Add Seat' : 'Create Seats'}
          </button>
        </div>
      </form>
    </div>
  );
};

const SeatDetailModal = ({ seatId, onClose }) => {
  const [seat, setSeat] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([seatAPI.getOne(seatId), slotAPI.getAll()])
      .then(([seatRes, slotRes]) => {
        setSeat(seatRes.data.seat);
        setAllSlots(slotRes.data.slots);
      })
      .catch(() => toast.error('Failed to load seat details'))
      .finally(() => setLoading(false));
  }, [seatId]);

  if (loading) return <PageLoader />;
  if (!seat) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Armchair size={22} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">{seat.seatNumber}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{seat.allocations.length} slot(s) occupied</p>
        </div>
      </div>

      <div className="space-y-2">
        {allSlots.map(slot => {
          const status = seat.slotAvailability?.find(item => item.slot._id.toString() === slot._id.toString());
          const available = status?.available ?? true;
          const conflicts = status?.conflicts || [];
          const allocation = seat.allocations.find(a => a.slot._id.toString() === slot._id.toString());

          return (
            <div key={slot._id} className={`flex items-center justify-between p-3 rounded-xl border ${available
              ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30'
              : 'border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10'
              }`}>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{slot.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </p>
              </div>
              {allocation ? (
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{allocation.member?.fullName}</p>
                  <span className={`${getPaymentBadge(allocation.feeStatus || 'pending')} mt-0.5`}>
                    {getPaymentLabel(allocation.feeStatus || 'pending')}
                  </span>
                </div>
              ) : available ? (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle size={14} />
                  <span className="text-xs font-medium">Available</span>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <XCircle size={14} />
                    <span className="text-xs font-medium">Unavailable</span>
                  </div>
                  {conflicts.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Booked for: {conflicts.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {allSlots.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No slots configured yet.</p>
        )}
      </div>
    </div>
  );
};

const SeatsPage = () => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingSeatId, setViewingSeatId] = useState(null);
  const [deletingSeat, setDeletingSeat] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSeats = async () => {
    try {
      const res = await seatAPI.getAll();
      setSeats(res.data.seats);
    } catch (err) {
      toast.error('Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeats(); }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await seatAPI.delete(deletingSeat._id);
      toast.success('Seat deleted.');
      setDeletingSeat(null);
      fetchSeats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete seat.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = seats.filter(s =>
    s.seatNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalOccupied = seats.filter(s => s.allocations?.length > 0).length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Seats</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {seats.length} total · {totalOccupied} occupied · {seats.length - totalOccupied} available
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Seats
        </button>
      </div>

      {seats.length > 0 && (
        <div className="card p-4">
          <input
            className="input"
            placeholder="Search seat number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {seats.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No seats yet"
          description="Add physical seats to your library. You can add them one at a time or in bulk."
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Seats</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Armchair} title="No seats match your search" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(seat => {
            const hasAlloc = seat.allocations?.length > 0;
            return (
              <div
                key={seat._id}
                className={`card p-3 text-center cursor-pointer hover:shadow-md transition-all group ${hasAlloc
                  ? 'border-blue-200 dark:border-blue-800'
                  : 'border-green-200 dark:border-green-800'
                  }`}
                onClick={() => setViewingSeatId(seat._id)}
              >
                <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${hasAlloc
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                  <Armchair size={18} className={hasAlloc ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'} />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{seat.seatNumber}</p>
                <p className={`text-xs mt-0.5 ${hasAlloc ? 'text-blue-500 dark:text-blue-400' : 'text-green-500 dark:text-green-400'}`}>
                  {hasAlloc ? `${seat.allocations.length} slot(s)` : 'Free'}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingSeat(seat); }}
                  className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Seats">
        <AddSeatForm onSuccess={() => { setShowForm(false); fetchSeats(); }} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!viewingSeatId} onClose={() => setViewingSeatId(null)} title="Seat Details" size="md">
        {viewingSeatId && <SeatDetailModal seatId={viewingSeatId} onClose={() => setViewingSeatId(null)} />}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingSeat}
        onClose={() => setDeletingSeat(null)}
        onConfirm={handleDelete}
        title="Delete Seat"
        message={`Delete "${deletingSeat?.seatNumber}"? This cannot be undone.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default SeatsPage;
