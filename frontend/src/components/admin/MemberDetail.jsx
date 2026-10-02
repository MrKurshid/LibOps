import { useEffect, useState } from 'react';
import { memberAPI, feeAPI } from '../../api/services';
import { PageLoader } from '../ui/Spinner';
import { formatDate, formatCurrency, getPaymentBadge, getPaymentLabel, formatTime } from '../../utils/helpers';
import { Phone, MapPin, Calendar, Armchair, Clock, IndianRupee, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const FeeStatusBadge = ({ mode }) => (
  <span className={getPaymentBadge(mode)}>{getPaymentLabel(mode)}</span>
);

const MemberDetail = ({ memberId, onRefresh }) => {
  const [member, setMember] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingFee, setUpdatingFee] = useState(null);

  const fetchData = async () => {
    try {
      const res = await memberAPI.getOne(memberId);
      setMember(res.data.member);
      setFeeHistory(res.data.feeHistory);
    } catch (err) {
      toast.error('Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [memberId]);

  const handleFeeUpdate = async (feeId, paymentMode) => {
    setUpdatingFee(feeId);
    try {
      await feeAPI.updateStatus(feeId, { paymentMode, paymentDate: new Date() });
      toast.success('Payment status updated.');
      fetchData();
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to update payment.');
    } finally {
      setUpdatingFee(null);
    }
  };

  if (loading) return <PageLoader />;
  if (!member) return <div className="text-slate-500 text-center py-8">Member not found.</div>;

  const alloc = member.seatAllocation;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
            {member.fullName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">{member.fullName}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={member.status === 'active' ? 'badge-green' : 'badge-gray'}>{member.status}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Joined {formatDate(member.joiningDate)}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow icon={Phone} label="Phone" value={member.phone} />
        {member.guardianPhone && <InfoRow icon={Phone} label="Guardian" value={member.guardianPhone} />}
        {member.address && <InfoRow icon={MapPin} label="Address" value={member.address} className="sm:col-span-2" />}
        <InfoRow icon={Calendar} label="Fee Due Date" value={formatDate(member.feeDueDate)} />
        <InfoRow icon={IndianRupee} label="Monthly Fee" value={formatCurrency(member.monthlyFeeSnapshot)} />
        {alloc && (
          <>
            <InfoRow icon={Armchair} label="Seat" value={alloc.seat?.seatNumber} />
            <InfoRow
              icon={Clock}
              label="Slot"
              value={`${alloc.slot?.name} (${formatTime(alloc.slot?.startTime)} – ${formatTime(alloc.slot?.endTime)})`}
            />
          </>
        )}
        {member.notes && <InfoRow icon={FileText} label="Notes" value={member.notes} className="sm:col-span-2" />}
      </div>

      {/* Fee History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Fee History</h3>
        {feeHistory.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No fee records found.</p>
        ) : (
          <div className="space-y-2">
            {feeHistory.map(fee => (
              <div key={fee._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fee.month}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Due: {formatDate(fee.dueDate)}
                    {fee.paymentDate && ` · Paid: ${formatDate(fee.paymentDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(fee.amount)}</span>
                  {fee.paymentMode === 'pending' ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleFeeUpdate(fee._id, 'upi')}
                        disabled={updatingFee === fee._id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        UPI
                      </button>
                      <button
                        onClick={() => handleFeeUpdate(fee._id, 'cash')}
                        disabled={updatingFee === fee._id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        Cash
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FeeStatusBadge mode={fee.paymentMode} />
                      <button
                        onClick={() => handleFeeUpdate(fee._id, 'pending')}
                        disabled={updatingFee === fee._id}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={13} className="text-slate-500 dark:text-slate-400" />
    </div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
    </div>
  </div>
);

export default MemberDetail;
