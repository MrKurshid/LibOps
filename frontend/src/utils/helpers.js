export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

export const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date();
};

export const getDaysUntilDue = (dueDate) => {
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getPaymentBadge = (mode) => {
  switch (mode) {
    case 'paid': case 'upi': return 'badge-green';
    case 'cash': return 'badge-blue';
    case 'pending': return 'badge-red';
    default: return 'badge-gray';
  }
};

export const getPaymentLabel = (mode) => {
  switch (mode) {
    case 'upi': return 'Paid (UPI)';
    case 'cash': return 'Paid (Cash)';
    case 'pending': return 'Pending';
    default: return mode;
  }
};

export const classNames = (...classes) => classes.filter(Boolean).join(' ');
