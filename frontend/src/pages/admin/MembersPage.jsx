import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, User, Phone, Armchair, Edit, Trash2, Eye, X } from 'lucide-react';
import { memberAPI, slotAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate, formatCurrency, getPaymentBadge, getPaymentLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';
import MemberForm from '../../components/admin/MemberForm';
import MemberDetail from '../../components/admin/MemberDetail';

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [filterFee, setFilterFee] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
      setSearchParams({});
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterSlot) params.slot = filterSlot;
      if (filterFee) params.feeStatus = filterFee;
      const res = await memberAPI.getAll(params);
      const uniqueMembers = Array.from(new Map(res.data.members.map(member => [member._id, member])).values());
      setMembers(uniqueMembers);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterSlot, filterFee]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    slotAPI.getAll().then(res => setSlots(res.data.slots)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await memberAPI.delete(deletingMember._id);
      toast.success('Member deleted.');
      setDeletingMember(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMember(null);
    fetchMembers();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{members.length} member{members.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingMember(null); setShowForm(true); }}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search name, phone, seat…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="input" value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
            <option value="">All Slots</option>
            {slots.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select className="input" value={filterFee} onChange={e => setFilterFee(e.target.value)}>
            <option value="">All Fee Status</option>
            <option value="pending">Pending</option>
            <option value="upi">Paid (UPI)</option>
            <option value="cash">Paid (Cash)</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {loading ? <PageLoader /> : members.length === 0 ? (
        <EmptyState
          icon={User}
          title="No members found"
          description="Add your first member or adjust your search filters."
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Member</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Seat / Slot</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Fee Due</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fee Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {members.map(member => (
                  <tr key={member._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                            {member.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{member.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Joined {formatDate(member.joiningDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{member.phone}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {member.seatAllocation ? (
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{member.seatAllocation.seat?.seatNumber}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-slate-600 dark:text-slate-400">{member.seatAllocation.slot?.name}</span>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                      {formatDate(member.feeDueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getPaymentBadge(member.currentFeeStatus)}>
                        {getPaymentLabel(member.currentFeeStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={member.status === 'active' ? 'badge-green' : 'badge-gray'}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingMember(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => { setEditingMember(member); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingMember(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingMember(null); }}
        title={editingMember ? 'Edit Member' : 'Add New Member'}
        size="lg"
      >
        <MemberForm
          member={editingMember}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingMember(null); }}
        />
      </Modal>

      {/* Detail Modal */}
      {viewingMember && (
        <Modal isOpen={!!viewingMember} onClose={() => setViewingMember(null)} title="Member Details" size="lg">
          <MemberDetail memberId={viewingMember._id} onRefresh={fetchMembers} />
        </Modal>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Are you sure you want to delete "${deletingMember?.fullName}"? This will permanently remove the member and release their seat.`}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default MembersPage;
