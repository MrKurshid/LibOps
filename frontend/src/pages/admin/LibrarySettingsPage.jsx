import { useEffect, useState, useRef } from 'react';
import { libraryAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import { Upload, X, Plus, Trash2, Library, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ImageUpload = ({ label, value, onUpload, accept = 'image/*', uploading }) => (
  <div>
    <label className="label">{label}</label>
    {value ? (
      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <img src={value} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <label className="cursor-pointer bg-white text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100">
            Change
            <input type="file" accept={accept} className="sr-only" onChange={onUpload} disabled={uploading} />
          </label>
        </div>
      </div>
    ) : (
      <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors bg-slate-50 dark:bg-slate-800/50 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <Upload size={20} className="text-slate-400 mb-2" />
        <span className="text-xs text-slate-500 dark:text-slate-400">{uploading ? 'Uploading…' : 'Click to upload'}</span>
        <input type="file" accept={accept} className="sr-only" onChange={onUpload} disabled={uploading} />
      </label>
    )}
  </div>
);

const LibrarySettingsPage = () => {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [rules, setRules] = useState([]);
  const [newFacility, setNewFacility] = useState('');
  const [newRule, setNewRule] = useState('');

  const { register, handleSubmit, reset, watch } = useForm();
  const is24Hours = watch('is24Hours');

  const fetchLibrary = async () => {
    try {
      const res = await libraryAPI.get();
      const lib = res.data.library;
      setLibrary(lib);
      setFacilities(lib.facilities || []);
      setRules(lib.rules || []);
      reset({
        name: lib.name, about: lib.about, address: lib.address,
        googleMapsLink: lib.googleMapsLink, contactNumber: lib.contactNumber,
        whatsappNumber: lib.whatsappNumber, openingTime: lib.openingTime,
        closingTime: lib.closingTime, is24Hours: lib.is24Hours, upiId: lib.upiId,
      });
    } catch (err) {
      toast.error('Failed to load library settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLibrary(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await libraryAPI.update({ ...data, facilities, rules });
      toast.success('Settings saved.');
      fetchLibrary();
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = (type) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(u => ({ ...u, [type]: true }));
    try {
      const formData = new FormData();
      const apiCall = {
        logo: () => { formData.append('logo', file); return libraryAPI.uploadLogo(formData); },
        banner: () => { formData.append('banner', file); return libraryAPI.uploadBanner(formData); },
        upiQr: () => { formData.append('upiQr', file); return libraryAPI.uploadUpiQr(formData); },
        gallery: () => { formData.append('image', file); return libraryAPI.uploadGallery(formData); },
      };
      await apiCall[type]();
      toast.success('Image uploaded.');
      fetchLibrary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(u => ({ ...u, [type]: false }));
    }
  };

  const handleDeleteGallery = async (url) => {
    try {
      await libraryAPI.deleteGalleryImage(url);
      toast.success('Image removed.');
      fetchLibrary();
    } catch (err) {
      toast.error('Failed to remove image.');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="page-title">Library Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your library's public profile and information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Basic Information</h2>
          <div>
            <label className="label">Library Name *</label>
            <input className="input" placeholder="My Library" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="label">About</label>
            <textarea rows={4} className="input resize-none" placeholder="Tell visitors about your library…" {...register('about')} />
          </div>
        </div>

        {/* Images */}
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ImageUpload label="Logo" value={library?.logo} onUpload={handleUpload('logo')} uploading={uploading.logo} />
            <ImageUpload label="Cover Banner" value={library?.coverBanner} onUpload={handleUpload('banner')} uploading={uploading.banner} />
          </div>
          <div>
            <label className="label">Gallery (max 5 images)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {(library?.gallery || []).map((img, idx) => (
                <div key={idx} className="relative h-28 rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteGallery(img)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {(library?.gallery?.length || 0) < 5 && (
                <label className="h-28 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary-400 transition-colors bg-slate-50 dark:bg-slate-800/50">
                  <Plus size={18} className="text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{uploading.gallery ? 'Uploading…' : 'Add photo'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleUpload('gallery')} disabled={uploading.gallery} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Contact & Location</h2>
          <div>
            <label className="label">Address</label>
            <textarea rows={2} className="input resize-none" placeholder="Full address" {...register('address')} />
          </div>
          <div>
            <label className="label">Google Maps Link</label>
            <input className="input" placeholder="https://maps.google.com/…" {...register('googleMapsLink')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Number</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" {...register('contactNumber')} />
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" {...register('whatsappNumber')} />
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Opening Hours</h2>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <input type="checkbox" id="is24Hours" className="w-4 h-4 accent-primary-600" {...register('is24Hours')} />
            <label htmlFor="is24Hours" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Open 24 Hours (allows overnight slots)
            </label>
          </div>
          {!is24Hours && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opening Time</label>
                <input type="time" className="input" {...register('openingTime')} />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input type="time" className="input" {...register('closingTime')} />
              </div>
            </div>
          )}
        </div>

        {/* Facilities */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Facilities</h2>
          <div className="flex flex-wrap gap-2">
            {facilities.map((f, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm border border-blue-200 dark:border-blue-800">
                {f}
                <button type="button" onClick={() => setFacilities(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500 transition-colors"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Add facility (e.g. WiFi, AC, CCTV)" value={newFacility}
              onChange={e => setNewFacility(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newFacility.trim()) { setFacilities(p => [...p, newFacility.trim()]); setNewFacility(''); } } }} />
            <button type="button" className="btn-secondary shrink-0"
              onClick={() => { if (newFacility.trim()) { setFacilities(p => [...p, newFacility.trim()]); setNewFacility(''); } }}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Rules */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Library Rules</h2>
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-700 dark:text-slate-300">{i + 1}. {r}</span>
                <button type="button" onClick={() => setRules(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Add a rule…" value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newRule.trim()) { setRules(p => [...p, newRule.trim()]); setNewRule(''); } } }} />
            <button type="button" className="btn-secondary shrink-0"
              onClick={() => { if (newRule.trim()) { setRules(p => [...p, newRule.trim()]); setNewRule(''); } }}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* UPI */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">UPI Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">UPI ID</label>
              <input className="input" placeholder="yourname@upi" {...register('upiId')} />
            </div>
            <ImageUpload label="UPI QR Code" value={library?.upiQr} onUpload={handleUpload('upiQr')} uploading={uploading.upiQr} />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-6 py-2.5" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LibrarySettingsPage;
