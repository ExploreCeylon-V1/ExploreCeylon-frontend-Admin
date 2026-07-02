import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, Search, Plus, List, Calendar, MapPin, X, UploadCloud, Loader2
} from "lucide-react";
import * as eventService from "../services/eventService";
import { uploadService } from "../services/uploadService"; // ⚠️ path එක oyaage folder structure එකට ගැලපෙන්න check කරන්න

const DEFAULT_FORM = {
  name: "", category: "FESTIVAL", district: "", location: "",
  startDate: "", endDate: "", status: "DRAFT", featured: false, description: "",
  imageUrls: [], // ✅ FIX: backend field name එක "imageUrls" (List<String>) — singular "imageUrl" නෙවෙයි
};

const CATEGORIES = [
  { value: "FESTIVAL", label: "Festival", color: "text-yellow-700", bg: "bg-yellow-100" },
  { value: "RELIGIOUS", label: "Religious", color: "text-orange-700", bg: "bg-orange-100" },
  { value: "FOOD", label: "Food", color: "text-red-700", bg: "bg-red-100" },
  { value: "WILDLIFE", label: "Wildlife", color: "text-emerald-700", bg: "bg-emerald-100" },
  { value: "SURF", label: "Surf", color: "text-cyan-700", bg: "bg-cyan-100" },
  { value: "MONSOON", label: "Monsoon", color: "text-blue-700", bg: "bg-blue-100" },
  { value: "ENTERTAINMENT", label: "Entertainment", color: "text-purple-700", bg: "bg-purple-100" }
];

const DISTRICTS = [
  "Island-wide", "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya",
  "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", "Kurunegala", "Puttalam",
  "Anuradhapura", "Polonnaruwa", "Badulla", "Monaragala", "Ratnapura", "Kegalle",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getCategoryMeta(cat) {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatDateRange(start, end) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (start === end) return `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()}`;
  if (s.getMonth() === e.getMonth()) return `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()}-${e.getDate()}`;
  return `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getDate()}`;
}

function CategoryBadge({ category }) {
  const m = getCategoryMeta(category);
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  );
}

function CalendarView({ events, year, month }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDay = (day) => {
    const d = new Date(year, month, day);
    return events.filter((ev) => {
      if (!ev.startDate || !ev.endDate) return false;
      const [sy, sm, sd] = ev.startDate.split("-").map(Number);
      const [ey, em, ed] = ev.endDate.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      return d >= start && d <= end;
    });
  };

  const isToday = (day) => todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() === day;

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", borderRight: "1px solid #e2e8f0" }}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f1f5f9" }}>
          {week.map((day, di) => {
            const dayEvs = day ? eventsOnDay(day) : [];
            const isT = day ? isToday(day) : false;
            return (
              <div key={di} style={{ minHeight: "110px", borderRight: "1px solid #f1f5f9", padding: "6px", backgroundColor: day ? (isT ? "#f0fdf4" : "#ffffff") : "#f8fafc", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {day && (
                  <>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: isT ? 700 : 500, marginBottom: "4px", flexShrink: 0, backgroundColor: isT ? "#059669" : "transparent", color: isT ? "#ffffff" : "#64748b" }}>
                      {day}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                      {dayEvs.slice(0, 2).map((ev) => {
                        const m = getCategoryMeta(ev.category);
                        return (
                          <div key={ev.id} title={ev.title} style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "3px", borderLeft: `2px solid ${m.color.split("-")[1]}`, backgroundColor: m.bg.replace("100", "50"), color: m.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvs.length > 2 && <div style={{ fontSize: "10px", color: "#94a3b8", paddingLeft: "4px" }}>+{dayEvs.length - 2} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("LIST");
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [distFilter, setDistFilter] = useState("ALL");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ✅ FIX: gallery (multi) image upload state
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [all, up] = await Promise.all([eventService.getAllEvents(), eventService.getUpcomingEvents()]);
      setEvents(all);
      setUpcoming(up);
    } catch (err) {
      setError(err?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const today = useMemo(() => new Date(), []);
  const festivalsThisMonth = useMemo(() => events.filter((e) => {
    if (!e.startDate) return false;
    const [year, month, day] = e.startDate.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && (e.category === "FESTIVAL" || e.category === "RELIGIOUS");
  }), [events, today]);

  const nextEvent = useMemo(() => [...upcoming].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0], [upcoming]);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch = (ev.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) || (ev.region ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = catFilter === "ALL" || ev.category === catFilter;
      const matchDist = distFilter === "ALL" || ev.region === distFilter;
      return matchSearch && matchCat && matchDist;
    });
  }, [events, searchTerm, catFilter, distFilter]);

  const sidebarUpcoming = useMemo(() => [...upcoming].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 5), [upcoming]);

  // ✅ FIX: multi image upload handler (backend supports imageUrls list)
  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    try {
      setError(null);
      setUploadingImages(true);
      const results = await uploadService.uploadMultiple(files, "events");
      const newUrls = results.map((r) => r.imageUrl);
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    } catch (err) {
      setError(err?.message || "Image upload failed");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (urlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== urlToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.name, description: formData.description, category: formData.category,
        region: formData.district, location: formData.location, startDate: formData.startDate,
        endDate: formData.endDate, status: formData.status, featured: formData.featured,
        imageUrls: formData.imageUrls, // ✅ FIX: backend expects "imageUrls" (List<String>)
      };
      if (editingId) await eventService.updateEvent(editingId, payload);
      else await eventService.createEvent(payload);
      
      closeModal();
      await loadAll();
    } catch (err) {
      setError(err?.message ?? "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ev) => {
    setFormData({
      name: ev.title || "", description: ev.description || "", category: ev.category || "CULTURAL",
      district: ev.region || "", location: ev.location || "", startDate: ev.startDate || "",
      endDate: ev.endDate || "", status: ev.status || "DRAFT", featured: ev.featured || false,
      imageUrls: ev.imageUrls || [], // ✅ FIX
    });
    setEditingId(ev.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await eventService.deleteEvent(id);
      setDeletingId(null);
      await loadAll();
    } catch (err) {
      setError(err?.message ?? "Failed to delete event");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1);
  };
  
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1);
  };

  const renderField = (label, key, opts = {}) => {
    const { placeholder = "", required = false, type = "text", rows } = opts;
    const value = formData[key] || "";
    const onChange = (e) => setFormData({ ...formData, [key]: e.target.value });
    const cls = "w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm";
    
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        {rows ? <textarea required={required} value={value} onChange={onChange} className={cls} rows={rows} placeholder={placeholder} /> : <input type={type} required={required} value={value} onChange={onChange} className={cls} placeholder={placeholder} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          <div className="mb-6"><h1 className="text-3xl font-bold text-slate-900">Events & Calendar</h1></div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input type="text" placeholder="Search by name or district..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            <div className="relative">
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-9 text-sm">
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
              <button onClick={() => setView("CALENDAR")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "CALENDAR" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"}`}><Calendar size={15} /> Calendar</button>
              <button onClick={() => setView("LIST")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "LIST" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"}`}><List size={15} /> List</button>
            </div>
            <div className="relative">
              <select value={distFilter} onChange={(e) => setDistFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-9 text-sm">
                <option value="ALL">All Districts</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="flex-1" />
            <button onClick={() => { setEditingId(null); setFormData(DEFAULT_FORM); setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> Add New Event</button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between">
              <span>{error}</span><button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-3"><span className="text-emerald-600 text-lg">📅</span></div><p className="text-2xl font-bold">{events.length}</p><p className="text-sm text-slate-500 mt-0.5">Total Events</p></div>
            <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-3"><span className="text-amber-500 text-lg">⭐</span></div><p className="text-2xl font-bold">{upcoming.length}</p><p className="text-sm text-slate-500 mt-0.5">Upcoming Events</p>{nextEvent && <p className="text-xs text-amber-600 mt-2 font-medium truncate">Next: {nextEvent.title}, {MONTHS[new Date(nextEvent.startDate).getMonth()].slice(0, 3)} {new Date(nextEvent.startDate).getDate()}</p>}</div>
            <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center mb-3"><span className="text-purple-600 text-lg">🎉</span></div><p className="text-2xl font-bold">{festivalsThisMonth.length}</p><p className="text-sm text-slate-500 mt-0.5">Festivals This Month</p><p className="text-xs text-purple-600 mt-2 font-medium">{MONTHS[today.getMonth()]} {today.getFullYear()}</p></div>
          </div>

          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="bg-white rounded-3xl p-12 flex items-center justify-center shadow-sm"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
              ) : view === "CALENDAR" ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition"><ChevronLeft size={16} className="text-slate-600" /></button>
                      <h2 className="text-base font-semibold text-slate-900">{MONTHS[calMonth]} {calYear}</h2>
                      <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg border border-slate-200 transition"><ChevronRight size={16} className="text-slate-600" /></button>
                      <button onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); }} className="px-3 py-1 text-sm border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition text-slate-600 font-medium">Today</button>
                    </div>
                  </div>
                  <CalendarView events={filtered} year={calYear} month={calMonth} />
                </>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  {filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400"><p className="text-3xl mb-2">📅</p><p className="font-medium">No events found</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>{["Image", "Event Name", "Category", "District", "Dates", "Location", "Actions"].map((h) => (<th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map((ev) => (
                            <tr key={ev.id} className="hover:bg-slate-50 transition">
                              <td className="px-5 py-4">
                                {ev.imageUrls && ev.imageUrls.length > 0 ? (
                                  <img src={ev.imageUrls[0]} alt={ev.title} className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm">🖼️</div>
                                )}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-900 text-sm whitespace-nowrap">{ev.title}</td>
                              <td className="px-5 py-4"><CategoryBadge category={ev.category} /></td>
                              <td className="px-5 py-4 text-sm text-slate-600">{ev.region}</td>
                              <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{formatDateRange(ev.startDate, ev.endDate)}</td>
                              <td className="px-5 py-4 text-sm text-slate-600">{ev.location}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleEdit(ev)} className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                  <button onClick={() => setDeletingId(ev.id)} className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-medium">Del</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4"><p className="text-sm font-semibold text-slate-900">Upcoming Events</p><button className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">View all</button></div>
                <div className="space-y-3">
                  {sidebarUpcoming.map((ev) => {
                    if(!ev.startDate) return null;
                    const s = new Date(ev.startDate); const e = new Date(ev.endDate);
                    const multi = ev.startDate !== ev.endDate; const m = getCategoryMeta(ev.category);
                    return (
                      <div key={ev.id} className="flex gap-3">
                        <div className={`rounded-xl px-2 py-1 text-center flex-shrink-0 min-w-[44px] ${m.bg}`}>
                          {multi ? <><p className={`text-xs font-bold leading-tight ${m.color}`}>{s.getDate()}-{e.getDate()}</p><p className={`text-[10px] ${m.color}`}>{MONTHS[s.getMonth()].slice(0, 3)}</p></> : <><p className={`text-sm font-bold leading-tight ${m.color}`}>{s.getDate()}</p><p className={`text-[10px] ${m.color}`}>{MONTHS[s.getMonth()].slice(0, 3)}</p></>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 leading-tight truncate">{ev.title}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 truncate"><MapPin size={9} /> {ev.location}</p>
                          <div className="mt-1"><CategoryBadge category={ev.category} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit Event" : "Add New Event"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {renderField("Event Name", "name", { required: true, placeholder: "e.g., Galle Food Festival" })}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">District <span className="text-red-500">*</span></label>
                  <select required value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                    <option value="">Select district</option>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              {renderField("Location / Venue", "location", { required: true, placeholder: "e.g., Galle Fort" })}
              <div className="grid grid-cols-2 gap-4">
                {renderField("Start Date", "startDate", { required: true, type: "date" })}
                {renderField("End Date", "endDate", { required: true, type: "date" })}
              </div>
              {renderField("Description", "description", { placeholder: "Brief description of the event", rows: 3 })}

              {/* ✅ FIX: Event Images — multi upload, backend stores as imageUrls list */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Images</label>

                <label className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition text-sm ${uploadingImages ? "pointer-events-none opacity-70" : ""}`}>
                  {uploadingImages ? (
                    <>
                      <Loader2 size={20} className="text-emerald-600 animate-spin" />
                      <span className="text-slate-500">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-slate-400" />
                      <span className="text-slate-500">Click to upload images (multiple allowed — JPG, PNG, WEBP, max 5MB each)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImagesUpload}
                    className="hidden"
                  />
                </label>

                {formData.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {formData.imageUrls.map((url) => (
                      <div key={url} className="relative group">
                        <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 transition"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-slate-700">Mark as Featured Event</span>
              </label>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting || uploadingImages} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-60">{submitting ? "Saving…" : editingId ? "Update Event" : "Create Event"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Delete Event?</h3>
            <p className="text-slate-500 text-sm mb-6">This event will be permanently removed. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}