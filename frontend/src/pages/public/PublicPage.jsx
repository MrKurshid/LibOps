import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { libraryAPI, noticeAPI, slotAPI, seatAPI } from '../../api/services';
import { PageLoader } from '../../components/ui/Spinner';
import {
  Phone, MapPin, Clock, Wifi, MessageCircle, QrCode, Bell,
  ChevronRight, BookOpen, CheckCircle, Info, Star, Sun
} from 'lucide-react';
import { formatTime, formatCurrency } from '../../utils/helpers';

const PublicPage = () => {
  const { id: libraryId } = useParams();
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState([]);
  const [library, setLibrary] = useState(null);
  const [librarySummaries, setLibrarySummaries] = useState({});
  const [notices, setNotices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [seats, setSeats] = useState([]);
  const [availableSeatsBySlot, setAvailableSeatsBySlot] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  const fetchLibraries = async () => {
    setLoading(true);
    try {
      const res = await libraryAPI.getAll();
      const libs = res.data.libraries || [];
      setLibraries(libs);

      const summaries = await Promise.all(libs.map(async (lib) => {
        try {
          const [seatsRes, slotsRes] = await Promise.all([
            seatAPI.getAll({ libraryId: lib._id }),
            slotAPI.getAll({ libraryId: lib._id }),
          ]);

          const activeSlots = (slotsRes.data.slots || []).filter(s => s.isActive);
          const minSlotFee = activeSlots.length ? Math.min(...activeSlots.map(s => s.monthlyFee || 0)) : null;

          return [lib._id, {
            totalSeats: seatsRes.data.seats?.length || 0,
            activeSlotsCount: activeSlots.length,
            minSlotFee,
          }];
        } catch (error) {
          return [lib._id, { totalSeats: 0, activeSlotsCount: 0, minSlotFee: null }];
        }
      }));

      setLibrarySummaries(Object.fromEntries(summaries));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraryDetail = async (id) => {
    setDetailLoading(true);
    try {
      const [libRes, noticesRes, slotsRes, seatsRes] = await Promise.all([
        libraryAPI.getById(id),
        noticeAPI.getPublic({ libraryId: id }),
        slotAPI.getAll({ libraryId: id }),
        seatAPI.getAll({ libraryId: id }),
      ]);

      setLibrary(libRes.data.library);
      setNotices(noticesRes.data.notices);
      const activeSlots = (slotsRes.data.slots || []).filter(s => s.isActive);
      setSlots(activeSlots);
      setSeats(seatsRes.data.seats || []);
    } catch (error) {
      console.error(error);
      setLibrary(null);
      setNotices([]);
      setSlots([]);
      setSeats([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  useEffect(() => {
    if (libraryId) {
      fetchLibraryDetail(libraryId);
    } else {
      setLibrary(null);
      setNotices([]);
      setSlots([]);
      setSeats([]);
      setAvailableSeatsBySlot({});
    }
  }, [libraryId]);

  useEffect(() => {
    if (!slots.length || !libraryId) return;
    setAvailabilityLoading(true);
    Promise.all(slots.map(slot =>
      seatAPI.getAvailable(slot._id, { libraryId })
        .then(res => ({ slotId: slot._id, seats: res.data.seats }))
        .catch(() => ({ slotId: slot._id, seats: [] }))
    ))
      .then(results => {
        const map = {};
        results.forEach(item => { map[item.slotId] = item.seats; });
        setAvailableSeatsBySlot(map);
      })
      .finally(() => setAvailabilityLoading(false));
  }, [slots, libraryId]);

  if (loading && !libraryId) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <PageLoader />
    </div>
  );

  if (libraryId && detailLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <PageLoader />
    </div>
  );

  if (!libraryId && !libraries.length) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full rounded-[2rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 shadow-2xl shadow-slate-200/40 dark:shadow-black/20 text-center">
        <div className="inline-flex items-center justify-center mb-6 w-16 h-16 rounded-3xl bg-primary-600 text-white mx-auto shadow-lg shadow-primary-600/25">
          <BookOpen size={28} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">Welcome to LibOPS</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">We are building a better library experience. Library owners can sign up or log in to create and manage their library listings.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate('/admin/signup')} className="btn-primary min-w-[160px]">Owner Signup</button>
          <button onClick={() => navigate('/admin/login')} className="btn-secondary min-w-[160px]">Owner Login</button>
        </div>
      </div>
    </div>
  );

  if (libraryId && !library) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-4">
      <p>Library not found.</p>
      <button onClick={() => navigate('/')} className="btn-secondary">Back to All Libraries</button>
    </div>
  );

  const totalSeats = seats.length;
  const getAvailableSeats = (slotId) => {
    const availableNums = availableSeatsBySlot[slotId] || [];
    return {
      available: availableNums.length,
      availableNums: availableNums.map(s => s.seatNumber),
    };
  };

  const renderSummaryCard = (lib) => {
    const summary = librarySummaries[lib._id] || {};

    return (
      <button
        key={lib._id}
        type="button"
        onClick={() => navigate(`/library/${lib._id}`)}
        className="card group text-left p-5 border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{lib.name}</h3>
            {lib.address && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{lib.address}</p>}
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 h-14 w-14">
            {lib.logo ? (
              <img src={lib.logo} alt={lib.name} className="w-12 h-12 object-cover rounded-xl" />
            ) : (
              <BookOpen size={24} className="text-primary-600" />
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mt-5 text-sm text-slate-600 dark:text-slate-400">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] mb-1">Seats</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{summary.totalSeats ?? '-'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] mb-1">Active slots</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{summary.activeSlotsCount ?? '-'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] mb-1">Starting fee</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{summary.minSlotFee !== null ? formatCurrency(summary.minSlotFee) : 'N/A'}</p>
          </div>
        </div>

        {lib.facilities?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {lib.facilities.slice(0, 4).map((facility, index) => (
              <span key={index} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">{facility}</span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-primary-600 dark:text-primary-400">
          <span>View full details</span>
          <ChevronRight size={18} />
        </div>
      </button>
    );
  };

  if (!libraryId) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-display">Libraries</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => navigate('/admin/login')} className="btn-secondary">Owner Login</button>
              <button onClick={() => navigate('/admin/signup')} className="btn-primary">Owner Signup</button>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-primary-600 to-slate-900 p-10 shadow-2xl shadow-slate-900/20 text-white">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-primary-200 mb-4">Discover local libraries</p>
                <h1 className="text-5xl font-bold font-display leading-tight">Find the right library experience for students, readers, and visitors.</h1>
                <p className="mt-5 text-slate-200 max-w-2xl">Browse library details, view fees, check availability, and connect directly with library owners. Library owners can sign up to manage their library listing.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button onClick={() => navigate('/admin/signup')} className="btn-primary">Owner Signup</button>
                  <button onClick={() => navigate('/admin/login')} className="btn-secondary">Owner Login</button>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl bg-white/10 p-6 border border-white/10">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-200">Featured</p>
                  <h2 className="mt-3 text-2xl font-semibold">Smart library browsing</h2>
                  <p className="mt-2 text-slate-200 text-sm">See available seats and fees at a glance before booking or visiting.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-display text-slate-900 dark:text-slate-100">Available Libraries</h1>
            <p className="text-slate-600 dark:text-slate-400">Explore library profiles, seat capacity and fee details. Click any card to view full information.</p>
          </div>

          <div className="grid gap-4">
            {libraries.map(lib => renderSummaryCard(lib))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/')} className="btn-secondary">
              Back to All Libraries
            </button>
            {library.logo ? (
              <img src={library.logo} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
            )}
            <span className="font-bold text-slate-900 dark:text-slate-100 font-display">{library.name}</span>
          </div>
          {library.whatsappNumber && (
            <a
              href={`https://wa.me/${library.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          )}
        </div>
      </nav>

      {/* Hero / Banner */}
      {library.coverBanner ? (
        <div className="relative h-64 sm:h-96 overflow-hidden">
          <img src={library.coverBanner} alt="Library" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0 text-center px-4">
            <h1 className="text-3xl sm:text-5xl font-bold text-white font-display drop-shadow-lg">{library.name}</h1>
            {library.address && (
              <p className="text-white/80 text-sm mt-2 flex items-center justify-center gap-1.5">
                <MapPin size={14} /> {library.address}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 py-20 px-4 text-center">
          <h1 className="text-4xl font-bold text-white font-display mb-2">{library.name}</h1>
          {library.address && <p className="text-white/80 text-sm flex items-center justify-center gap-1.5"><MapPin size={13} /> {library.address}</p>}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">

        {/* Active Notices */}
        {notices.length > 0 && (
          <section>
            <SectionTitle icon={Bell} title="Notice Board" />
            <div className="space-y-3">
              {notices.map(notice => (
                <div key={notice._id} className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-300">{notice.title}</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1 whitespace-pre-wrap">{notice.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {library.about && (
          <section>
            <SectionTitle icon={Info} title="About the Library" />
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{library.about}</p>
          </section>
        )}

        {/* Slot Pricing & Seat Availability */}
        {slots.length > 0 && (
          <section>
            <SectionTitle icon={Clock} title="Slot Pricing & Seat Availability" />
            <div className="grid gap-4 sm:grid-cols-2">
              {slots.map(slot => {
                const { available, availableNums } = getAvailableSeats(slot._id);
                return (
                  <div key={slot._id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{slot.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(slot.monthlyFee)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">/ month</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400">Available seats</span>
                        <span className={`font-semibold ${available > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {available} / {totalSeats}
                        </span>
                      </div>
                      {availableNums.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {availableNums.slice(0, 10).map(n => (
                            <span key={n} className="text-xs px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">{n}</span>
                          ))}
                          {availableNums.length > 10 && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">+{availableNums.length - 10} more</span>
                          )}
                        </div>
                      )}
                      {available === 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">All seats occupied</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Gallery */}
        {library.gallery?.length > 0 && (
          <section>
            <SectionTitle icon={Star} title="Gallery" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {library.gallery.map((img, i) => (
                <img key={i} src={img} alt={`Gallery ${i + 1}`}
                  className="w-full aspect-video object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:scale-[1.02] transition-transform cursor-pointer"
                />
              ))}
            </div>
          </section>
        )}

        {/* Facilities */}
        {library.facilities?.length > 0 && (
          <section>
            <SectionTitle icon={CheckCircle} title="Facilities" />
            <div className="flex flex-wrap gap-2">
              {library.facilities.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm border border-primary-200 dark:border-primary-800">
                  <CheckCircle size={13} /> {f}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Rules */}
        {library.rules?.length > 0 && (
          <section>
            <SectionTitle icon={Info} title="Library Rules" />
            <div className="space-y-2">
              {library.rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{rule}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hours & Contact */}
        <section className="grid sm:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-primary-600" /> Opening Hours
            </h3>
            {library.is24Hours ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Sun size={16} /> <span className="font-medium">Open 24 Hours</span>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300">
                {formatTime(library.openingTime)} – {formatTime(library.closingTime)}
              </p>
            )}
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Phone size={16} className="text-primary-600" /> Contact
            </h3>
            <div className="space-y-2">
              {library.contactNumber && (
                <a href={`tel:${library.contactNumber}`} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors">
                  <Phone size={14} /> {library.contactNumber}
                </a>
              )}
              {library.whatsappNumber && (
                <a href={`https://wa.me/${library.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                  <MessageCircle size={14} /> {library.whatsappNumber}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* UPI Payment */}
        {(library.upiId || library.upiQr) && (
          <section>
            <SectionTitle icon={QrCode} title="UPI Payment" />
            <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
              {library.upiQr && (
                <img src={library.upiQr} alt="UPI QR" className="w-40 h-40 object-contain rounded-xl border border-slate-200 dark:border-slate-700" />
              )}
              <div>
                {library.upiId && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">UPI ID</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{library.upiId}</p>
                  </div>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                  Pay online and send the screenshot to our WhatsApp for confirmation.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Map */}
        {library.googleMapsLink && (
          <section>
            <SectionTitle icon={MapPin} title="Find Us" />
            {library.address && <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{library.address}</p>}
            <a
              href={library.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              <MapPin size={16} /> Open in Google Maps <ChevronRight size={15} />
            </a>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-16 py-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} {library.name}. All rights reserved.
        </p>
        <a href="/admin/login" className="text-xs text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 mt-2 inline-block transition-colors">
          Admin Login
        </a>
      </footer>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
      <Icon size={17} className="text-primary-600 dark:text-primary-400" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h2>
  </div>
);

export default PublicPage;
