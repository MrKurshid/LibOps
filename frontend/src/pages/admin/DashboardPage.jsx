import { useEffect, useState } from 'react';
import {
  Users, Armchair, IndianRupee, AlertCircle, Clock,
  TrendingUp, UserPlus, ChevronRight, CheckCircle
} from 'lucide-react';
import { dashboardAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotDetails, setSlotDetails] = useState(null);
  const [slotDetailLoading, setSlotDetailLoading] = useState(false);
  const [slotSearch, setSlotSearch] = useState('');
  const [slotSortField, setSlotSortField] = useState('seatNumber');
  const [slotSortOrder, setSlotSortOrder] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const compareSeatNumbers = (a, b) => {
    const aNum = Number(a.replace(/\D/g, '')) || 0;
    const bNum = Number(b.replace(/\D/g, '')) || 0;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
  };

  const openSlotDetails = async (slotId) => {
    setSlotDetailLoading(true);
    setSlotDetails(null);
    setSlotSearch('');
    setSlotSortField('seatNumber');
    setSlotSortOrder('asc');
    try {
      const res = await dashboardAPI.getSlotDetails(slotId);
      setSlotDetails(res.data.slotDetails);
    } catch (err) {
      toast.error('Failed to load slot details.');
    } finally {
      setSlotDetailLoading(false);
    }
  };

  const closeSlotDetails = () => {
    setSlotDetails(null);
  };

  if (loading) return <PageLoader />;
  if (!data) return <div className="text-center text-slate-500 py-20">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Today's overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={data.totalMembers} icon={Users} color="blue" subtitle={`${data.activeMembers} active`} />
        <StatCard label="Total Seats" value={data.totalSeats} icon={Armchair} color="slate" subtitle={`${data.availableSeats} available`} />
        <StatCard label="Collected Today" value={formatCurrency(data.feeCollectedToday)} icon={IndianRupee} color="green" />
        <StatCard label="New Today" value={data.newAdmissionsToday} icon={UserPlus} color="purple" />
      </div>

      {/* Fee Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="card p-4 border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/fees?filter=overdue')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Overdue Fees</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-display mt-1">{data.overdueFeesCount}</p>
            </div>
            <AlertCircle size={24} className="text-red-500 opacity-60" />
          </div>
        </div>
        <div
          className="card p-4 border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/fees?filter=duetoday')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Today</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 font-display mt-1">{data.dueTodayCount}</p>
            </div>
            <Clock size={24} className="text-yellow-500 opacity-60" />
          </div>
        </div>
        <div
          className="card p-4 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/fees?filter=duetomorrow')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Tomorrow</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-display mt-1">{data.dueTomorrowCount}</p>
            </div>
            <Clock size={24} className="text-blue-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* Slot Occupancy */}
      <div>
        <h2 className="section-title mb-4">Slot Occupancy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.slotStats.map((s) => (
            <button
              key={s.slot._id}
              type="button"
              onClick={() => openSlotDetails(s.slot._id)}
              className="card p-5 text-left hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{s.slot.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatTime(s.slot.startTime)} – {formatTime(s.slot.endTime)}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.occupancyPercent}%</span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${s.occupancyPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{s.occupied}</span> / {s.total} Occupied
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium">{s.available} free</span>
              </div>

              {s.availableSeatNumbers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Available seats:</p>
                  <div className="flex flex-wrap gap-1">
                    {s.availableSeatNumbers.slice(0, 8).map(n => (
                      <span
                        key={n}
                        className="text-xs px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                      >
                        {n}
                      </span>
                    ))}
                    {s.availableSeatNumbers.length > 8 && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">
                        +{s.availableSeatNumbers.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
          {data.slotStats.length === 0 && (
            <div className="card p-8 col-span-full text-center text-slate-500 dark:text-slate-400">
              No active slots found. <button className="text-primary-600 ml-1 hover:underline" onClick={() => navigate('/admin/slots')}>Create slots</button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={Boolean(slotDetails)} onClose={closeSlotDetails} title={slotDetails ? `${slotDetails.slot.name} Details` : 'Slot Details'}>
        {slotDetailLoading ? (
          <div className="p-8 text-center">
            <PageLoader />
          </div>
        ) : slotDetails ? (
          <div className="space-y-6">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
            <div className="flex flex-col gap-4">
              <div className="card p-4 bg-slate-50 dark:bg-slate-800">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Slot Summary</h3>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 mx-auto flex-wrap">
                  <p><span className="font-medium text-slate-900 dark:text-slate-100">Total Seats:</span> {slotDetails.summary.totalSeats}</p>
                  <p><span className="font-medium text-slate-900 dark:text-slate-100">Occupied:</span> {slotDetails.summary.occupiedSeats}</p>
                  <p><span className="font-medium text-slate-900 dark:text-slate-100">Available:</span> {slotDetails.summary.availableSeats}</p>
                  <p><span className="font-medium text-slate-900 dark:text-slate-100">Occupancy:</span> {slotDetails.summary.occupancyPercent}%</p>
                </div>
              </div>
              <div className="card p-4 bg-slate-50 dark:bg-slate-800">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Available Seats</h3>
                <div className="mt-3 max-h-40 overflow-y-auto overflow-x-hidden flex flex-wrap gap-2 pr-1">
                  {slotDetails.summary.availableSeatNumbers.length > 0 ? slotDetails.summary.availableSeatNumbers.map((seat) => (
                    <span key={seat} className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {seat}
                    </span>
                  )) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No seats available for this slot.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="relative flex-1">
                  <input
                    type="search"
                    value={slotSearch}
                    onChange={(e) => setSlotSearch(e.target.value)}
                    placeholder="Search assigned members, phone, or seat"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="font-medium text-slate-600 dark:text-slate-300">Sort:</label>
                  <select
                    value={slotSortField}
                    onChange={(e) => setSlotSortField(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="seatNumber">Seat</option>
                    <option value="fullName">Name</option>
                    <option value="feeStatus">Fee status</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSlotSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {slotSortOrder === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-sm text-left text-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Seat</th>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Fee status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotDetails.assignedMembers
                      .filter((member) => {
                        const query = slotSearch.toLowerCase();
                        return (
                          member.fullName.toLowerCase().includes(query) ||
                          member.phone.toLowerCase().includes(query) ||
                          member.seatNumber.toLowerCase().includes(query)
                        );
                      })
                      .sort((a, b) => {
                        if (slotSortField === 'seatNumber') {
                          return compareSeatNumbers(a.seatNumber, b.seatNumber) * (slotSortOrder === 'asc' ? 1 : -1);
                        }
                        if (slotSortField === 'fullName') {
                          return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }) * (slotSortOrder === 'asc' ? 1 : -1);
                        }
                        return a.feeStatus.localeCompare(b.feeStatus, undefined, { sensitivity: 'base' }) * (slotSortOrder === 'asc' ? 1 : -1);
                      })
                      .map((member) => (
                        <tr key={member.memberId} className="border-t border-slate-200 dark:border-slate-700 last:border-b-0">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{member.seatNumber}</td>
                          <td className="px-4 py-3">{member.fullName}</td>
                          <td className="px-4 py-3">{member.phone}</td>
                          <td className="px-4 py-3 capitalize">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${member.feeStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : member.feeStatus === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {member.feeStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {slotDetails.assignedMembers.filter((member) => {
                  const query = slotSearch.toLowerCase();
                  return (
                    member.fullName.toLowerCase().includes(query) ||
                    member.phone.toLowerCase().includes(query) ||
                    member.seatNumber.toLowerCase().includes(query)
                  );
                }).length === 0 && (
                  <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No assigned members match your search.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">Slot details are unavailable.</div>
        )}
      </Modal>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Member', path: '/admin/members?action=add', color: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Manage Seats', path: '/admin/seats', color: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700' },
          { label: 'View Fees', path: '/admin/fees', color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
          { label: 'Post Notice', path: '/admin/notices?action=add', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
        ].map(({ label, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`card px-4 py-3 text-sm font-medium flex items-center justify-between ${color} hover:shadow-md transition-all`}
          >
            {label}
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
