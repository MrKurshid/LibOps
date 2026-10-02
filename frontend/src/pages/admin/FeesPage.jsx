import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IndianRupee, AlertCircle, Clock, CheckCircle, Filter } from 'lucide-react';
import { feeAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import { formatDate, formatCurrency, getPaymentBadge, getPaymentLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';

const FeesPage = () => {
  const [searchParams] = useSearchParams();
  const [pendingData, setPendingData] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('filter') || 'overdue');
  const [updatingFee, setUpdatingFee] = useState(null);

  const fetchData = async () => {
    try {
      const [pending, today] = await Promise.all([
        feeAPI.getPendingSummary(),
        feeAPI.getTodaySummary(),
      ]);
      setPendingData(pending.data.summary);
      setTodayData(today.data.summary);
    } catch (err) {
      toast.error('Failed to load fee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFeeUpdate = async (feeId, paymentMode) => {
    setUpdatingFee(feeId);
    try {
      await feeAPI.updateStatus(feeId, { paymentMode, paymentDate: new Date() });
      toast.success('Payment updated.');
      fetchData();
    } catch (err) {
      toast.error('Failed to update payment.');
    } finally {
      setUpdatingFee(null);
    }
  };

  if (loading) return <PageLoader />;

  const tabs = [
    { id: 'overdue', label: 'Overdue', count: pendingData?.totalOverdue, color: 'text-red-600 dark:text-red-400' },
    { id: 'duetoday', label: 'Due Today', count: pendingData?.dueToday, color: 'text-yellow-600 dark:text-yellow-400' },
    { id: 'duetomorrow', label: 'Due Tomorrow', count: pendingData?.dueTomorrow, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'today', label: "Today's Collections", count: todayData?.count, color: 'text-green-600 dark:text-green-400' },
  ];

  const currentFees = () => {
    switch (activeTab) {
      case 'overdue': return pendingData?.overdueFees || [];
      case 'duetoday': return pendingData?.dueTodayFees || [];
      case 'duetomorrow': return pendingData?.dueTomorrowFees || [];
      case 'today': return todayData?.fees || [];
      default: return [];
    }
  };

  const fees = currentFees();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="page-title">Fee Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View due members, collect payments, and manage recurring fee cycles.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-display mt-1">{pendingData?.totalOverdue}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatCurrency(pendingData?.overdueAmount || 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Today</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 font-display mt-1">{pendingData?.dueToday}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Tomorrow</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-display mt-1">{pendingData?.dueTomorrow}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Collected Today</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-display mt-1">{formatCurrency(todayData?.totalCollected || 0)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{todayData?.count} payment(s)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {fees.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-500 dark:text-slate-400">
              <CheckCircle size={32} className="text-green-500 mb-3 opacity-60" />
              <p className="text-sm font-medium">All clear!</p>
              <p className="text-xs mt-1">No fees in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Member</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Seat</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden xl:table-cell">Slot</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Payment</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Next Due</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {fees.map(fee => (
                    <tr key={fee._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{fee.member?.fullName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{fee.member?.phone}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                        {fee.member?.seatAllocation?.seat?.seatNumber || '—'}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-slate-600 dark:text-slate-400">
                        {fee.member?.seatAllocation?.slot?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {fee.lastPaymentDate ? formatDate(fee.lastPaymentDate) : 'No payment yet'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(fee.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span className={getPaymentBadge(fee.paymentMode)}>{getPaymentLabel(fee.paymentMode)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{formatCurrency(fee.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        {activeTab !== 'today' ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleFeeUpdate(fee._id, 'upi')}
                              disabled={updatingFee === fee._id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >Receive UPI</button>
                            <button
                              onClick={() => handleFeeUpdate(fee._id, 'cash')}
                              disabled={updatingFee === fee._id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >Receive Cash</button>
                          </div>
                        ) : (
                          <span className={getPaymentBadge(fee.paymentMode)}>{getPaymentLabel(fee.paymentMode)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeesPage;
