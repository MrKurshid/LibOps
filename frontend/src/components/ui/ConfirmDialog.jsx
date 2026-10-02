import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
    <div className="flex justify-end gap-3 mt-6">
      <button className="btn-secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
      <button
        className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? 'Deleting...' : confirmText}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
