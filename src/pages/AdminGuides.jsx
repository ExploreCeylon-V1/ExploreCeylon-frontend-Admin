import React, { useEffect, useMemo, useState } from "react";
import * as guideService from "../services/guideService";
import { uploadService } from "../services/uploadService"; // ⚠️ path එක oyaage folder structure එකට ගැලපෙන්න check කරන්න
import ConfirmDialog from "../components/admin/ConfirmDialog";

const specialties = [
  "All Specialties", "Wildlife", "Cultural", "Food", "Photography", "Surfing", "Ayurveda", "Birdwatching", "Trekking",
];

const EMPTY_FORM = {
  fullName: "", bio: "", photoUrl: "", languages: "", specialties: "",
  district: "", pricePerDay: "", phone: "", whatsappNumber: "", email: "", imageUrls: [], // ✅ FIX: imageUrls array
};

export default function AdminGuides() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0]);
  const [guides, setGuides] = useState([]);
  const [guideDetailsMap, setGuideDetailsMap] = useState(new Map());
  const [guideBookingsMap, setGuideBookingsMap] = useState(new Map());
  
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [guideListError, setGuideListError] = useState(null);
  
  const [allGuideBookings, setAllGuideBookings] = useState([]);
  const [paymentSummaries, setPaymentSummaries] = useState([]);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [selectedGuideDetails, setSelectedGuideDetails] = useState(null);
  const [selectedGuideBookings, setSelectedGuideBookings] = useState([]);
  const [calendarGuideName, setCalendarGuideName] = useState("");

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ✅ NEW: image upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const mapGuideToCardData = (guide) => ({
    id: guide.id,
    name: guide.fullName,
    specialties: guide.specialties ? guide.specialties.split(",").map((spec) => spec.trim()) : [],
    languages: guide.languages,
    district: guide.district,
    rating: guide.rating ?? 0,
    reviews: guide.reviewCount ?? 0,
    price: guide.pricePerDay,
    available: guide.available ?? true,
    photoUrl: guide.photoUrl || "", // ✅ NEW
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadGuides = async () => {
      setLoadingGuides(true);
      setGuideListError(null);
      setLoadingPayments(true);
      setPaymentError(null);

      try {
        const guideData = await guideService.getAllGuides();
        setGuides(guideData.map(mapGuideToCardData));
      } catch (error) {
        setGuideListError(error.message || "Failed to load live guide data.");
      }

      try {
        const [bookings, summaries] = await Promise.all([
          guideService.getAllGuideBookings(),
          guideService.getCompletedBookingsWithPaymentStatus(),
        ]);
        setAllGuideBookings(bookings);
        setPaymentSummaries(summaries);
      } catch (error) {
        setPaymentError(error.message || "Failed to load booking or payment data.");
      } finally {
        setLoadingGuides(false);
        setLoadingPayments(false);
      }
    };

    loadGuides();
  }, []);

  const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormError(null);
    setFormSuccess(null);
  };

  // ✅ NEW: profile photo upload (single)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setFormError(null);
      setUploadingPhoto(true);
      const res = await uploadService.uploadSingle(file, "guides");
      setFormData((prev) => ({ ...prev, photoUrl: res.imageUrl }));
    } catch (err) {
      setFormError(err?.message || "Photo upload failed");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => setFormData((prev) => ({ ...prev, photoUrl: "" }));

  // ✅ NEW: gallery images upload (multiple)
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    try {
      setFormError(null);
      setUploadingGallery(true);
      const results = await uploadService.uploadMultiple(files, "guides");
      const newUrls = results.map((r) => r.imageUrl);
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    } catch (err) {
      setFormError(err?.message || "Gallery image upload failed");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryImage = (urlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== urlToRemove),
    }));
  };

  const handleViewGuideDetails = async (guideId) => {
    setSelectedGuideId(guideId);
    setLoading(true);
    try {
      if (guideDetailsMap.has(guideId)) {
        setSelectedGuideDetails(guideDetailsMap.get(guideId));
      } else {
        const guideData = await guideService.getGuideById(guideId);
        setSelectedGuideDetails(guideData);
        setGuideDetailsMap((prev) => new Map([...prev, [guideId, guideData]]));
      }
      setShowDetailModal(true);
    } catch (error) {
      setFormError(error.message || "Failed to load guide details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditGuide = async (guideId) => {
    setSelectedGuideId(guideId);
    setLoading(true);
    try {
      const guideData = guideDetailsMap.get(guideId) || (await guideService.getGuideById(guideId));
      setFormData({
        fullName: guideData.fullName, bio: guideData.bio || "", photoUrl: guideData.photoUrl || "",
        languages: guideData.languages, specialties: guideData.specialties, district: guideData.district,
        pricePerDay: guideData.pricePerDay.toString(), phone: guideData.phone || "", whatsappNumber: guideData.whatsappNumber || "", email: guideData.email || "",
        imageUrls: guideData.imageUrls || [], // ✅ FIX: array
      });
      setShowEditModal(true);
    } catch (error) {
      setFormError(error.message || "Failed to load guide for editing");
    } finally {
      setLoading(false);
    }
  };

  const handleShowBookingsCalendar = async (guideId, guideName) => {
    setSelectedGuideId(guideId);
    setCalendarGuideName(guideName);
    setLoading(true);
    try {
      if (guideBookingsMap.has(guideId)) {
        setSelectedGuideBookings(guideBookingsMap.get(guideId));
      } else {
        const bookings = await guideService.getGuideBookings(guideId);
        setSelectedGuideBookings(bookings);
        setGuideBookingsMap((prev) => new Map([...prev, [guideId, bookings]]));
      }
      setShowCalendarModal(true);
    } catch (error) {
      setFormError(error.message || "Failed to load bookings calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (guideId, currentStatus) => {
    setLoading(true);
    try {
      const newStatus = !currentStatus;
      await guideService.toggleGuideAvailability(guideId, newStatus);
      setGuides((prev) => prev.map((g) => (g.id === guideId ? { ...g, available: newStatus } : g)));
      if (selectedGuideDetails?.id === guideId) {
        setSelectedGuideDetails({ ...selectedGuideDetails, available: newStatus });
      }
      setFormSuccess(`Guide availability updated to ${newStatus ? "Available" : "Unavailable"}`);
      setTimeout(() => setFormSuccess(null), 2000);
    } catch (error) {
      setFormError(error.message || "Failed to toggle availability");
    } finally {
      setLoading(false);
    }
  };

  const bookedToday = useMemo(() => allGuideBookings.filter((b) => b.status === "CONFIRMED" && b.startDate <= today && b.endDate >= today).length, [allGuideBookings, today]);
  const totalRevenue = useMemo(() => allGuideBookings.filter((b) => (b.status === "CONFIRMED" || b.status === "COMPLETED") && b.endDate < today).reduce((sum, b) => sum + b.totalCost * 0.15, 0), [allGuideBookings, today]);

  const handleOpenPaymentsModal = async () => {
    setShowPaymentsModal(true);
    if (paymentSummaries.length === 0) await refreshPaymentSummaries();
  };

  const refreshPaymentSummaries = async () => {
    setLoadingPayments(true);
    setPaymentError(null);
    try {
      const summaries = await guideService.getCompletedBookingsWithPaymentStatus();
      setPaymentSummaries(summaries);
    } catch (error) {
      setPaymentError(error.message || "Unable to refresh payment summaries.");
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleMarkGuidePaid = async (guideId) => {
    const summary = paymentSummaries.find((item) => item.guideId === guideId);
    if (!summary || summary.paymentStatus === "PAID") return;
    setPaymentActionLoading(true);
    setPaymentError(null);
    try {
      const payload = {
        guideId: summary.guideId, bookingIds: summary.bookingIds, totalEarned: summary.totalEarned,
        commissionDeducted: summary.commissionDeducted, amountPaid: summary.amountPaid, paymentDate: today,
      };
      const createdPayment = await guideService.markGuideAsPaid(summary.guideId, payload);
      setPaymentSummaries((prev) => prev.map((item) => item.guideId === summary.guideId ? { ...item, paymentStatus: "PAID", paymentDate: createdPayment.paymentDate, paymentRecordId: createdPayment.id } : item));
      setFormSuccess("Guide payment recorded successfully.");
      setTimeout(() => setFormSuccess(null), 2000);
    } catch (error) {
      setPaymentError(error.message || "Unable to mark guide as paid.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleAddGuideSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    const price = parseFloat(formData.pricePerDay);
    if (Number.isNaN(price) || price <= 0) return setFormError("Price per day must be a valid positive number.");
    
    const payload = {
      ...formData,
      pricePerDay: price,
      imageUrls: formData.imageUrls, // ✅ FIX: array එකම යවනවා
    };

    setSubmitting(true);
    try {
      const createdGuide = await guideService.createGuide(payload);
      setGuides((prev) => [...prev, mapGuideToCardData(createdGuide)]);
      setFormSuccess("Guide added successfully.");
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      setFormError(error.message || "Unable to save guide.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditGuideSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!selectedGuideId) return;
    const price = parseFloat(formData.pricePerDay);
    if (Number.isNaN(price) || price <= 0) return setFormError("Price per day must be a valid positive number.");

    const payload = {
      ...formData,
      pricePerDay: price,
      imageUrls: formData.imageUrls, // ✅ FIX: array එකම යවනවා
    };

    setSubmitting(true);
    try {
      const updatedGuide = await guideService.updateGuide(selectedGuideId, payload);
      setGuides((prev) => prev.map((guide) => guide.id === selectedGuideId ? mapGuideToCardData(updatedGuide) : guide));
      setGuideDetailsMap((prev) => new Map([...prev, [selectedGuideId, updatedGuide]]));
      setSelectedGuideDetails(updatedGuide);
      setFormSuccess("Guide updated successfully.");
      resetForm();
      setShowEditModal(false);
    } catch (error) {
      setFormError(error.message || "Unable to update guide.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGuide = async () => {
    if (!selectedGuideId) return;
    setSubmitting(true);
    try {
      await guideService.deleteGuide(selectedGuideId);
      setGuides((prev) => prev.filter((guide) => guide.id !== selectedGuideId));
      setGuideDetailsMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(selectedGuideId);
        return newMap;
      });
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedGuideId(null);
    } catch (error) {
      setFormError(error.message || "Unable to delete guide.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesSearch = guide.name.toLowerCase().includes(searchTerm.toLowerCase()) || guide.specialties.some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSpecialty = selectedSpecialty === "All Specialties" || guide.specialties.includes(selectedSpecialty);
      return matchesSearch && matchesSpecialty;
    });
  }, [guides, searchTerm, selectedSpecialty]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main className="space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">Tour Guide Management</h1>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[320px]">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
                  <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search guides..." className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  {specialties.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                </select>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Guides", value: guides.length, icon: "👤", bgColor: "bg-blue-50" },
              { label: "Available", value: guides.filter(g => g.available).length, accent: "text-emerald-600", icon: "✅", bgColor: "bg-emerald-50" },
              { label: "Booked Today", value: bookedToday, accent: "text-rose-600", icon: "📅", bgColor: "bg-rose-50" },
              { label: "Total Revenue", value: `$${Math.round(totalRevenue * 100) / 100}`, accent: "text-amber-600", icon: "💰", bgColor: "bg-amber-50", onClick: handleOpenPaymentsModal },
            ].map((item) => (
              <div key={item.label} onClick={item.onClick} className={`rounded-3xl border border-slate-200 ${item.bgColor} p-5 shadow-sm transition hover:shadow-md ${item.onClick ? "cursor-pointer" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className={`mt-4 text-3xl font-bold ${item.accent ?? "text-slate-950"}`}>{item.value}</p>
                  </div>
                  <div className="text-3xl">{item.icon}</div>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <p className="text-lg font-semibold text-slate-950">Guide list</p>
                <p className="mt-1 text-sm text-slate-500">Manage availability, pricing, and specialties.</p>
              </div>
              <button onClick={() => { resetForm(); setShowAddModal(true); }} className="inline-flex h-12 items-center justify-center rounded-3xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                + Add New Guide
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
              {loadingGuides ? (
                <div className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">Loading live guides...</div>
              ) : guideListError ? (
                <div className="col-span-full rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">{guideListError}</div>
              ) : filteredGuides.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">No guides found.</div>
              ) : (
                filteredGuides.map((guide) => (
                  <article key={guide.id} onClick={() => handleViewGuideDetails(guide.id)} className="cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-emerald-300">
                    <div className="flex flex-col items-center gap-5 text-center">
                      {/* ✅ FIX: show uploaded profile photo instead of emoji placeholder when available */}
                      {guide.photoUrl ? (
                        <img src={guide.photoUrl} alt={guide.name} className="h-24 w-24 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-4xl">👤</div>
                      )}
                      <div>
                        <h2 className="text-xl font-semibold text-slate-950">{guide.name}</h2>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          {guide.specialties.map((spec) => (
                            <span key={spec} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{spec}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3"><span className="font-semibold text-slate-800">Languages:</span><span>{guide.languages}</span></div>
                      <div className="flex justify-between gap-3"><span className="font-semibold text-slate-800">District:</span><span>{guide.district}</span></div>
                      <div className="flex justify-between gap-3"><span className="font-semibold text-slate-800">Rating:</span><span>⭐ {guide.rating.toFixed(1)} ({guide.reviews})</span></div>
                      <div className="flex justify-between gap-3"><span className="font-semibold text-slate-800">Price:</span><span>${guide.price}/day</span></div>
                    </div>
                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${guide.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {guide.available ? "Available" : "Unavailable"}
                      </span>
                      <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); handleEditGuide(guide.id); }} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200">✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleShowBookingsCalendar(guide.id, guide.name); }} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200">📅</button>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleAvailability(guide.id, guide.available); }} className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${guide.available ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                          {guide.available ? "⏻" : "✓"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Guide Payments Modal */}
      {showPaymentsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Guide Payments</h2>
                <p className="mt-1 text-sm text-slate-500">Review completed bookings and mark payments as paid.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => refreshPaymentSummaries()} className="rounded-2xl border bg-slate-50 px-4 py-2 text-sm font-medium hover:bg-slate-100">Refresh</button>
                <button onClick={() => { setShowPaymentsModal(false); setPaymentError(null); }} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Close</button>
              </div>
            </div>
            <div className="overflow-y-auto p-6">
              {loadingPayments ? (
                <div className="flex min-h-[240px] items-center justify-center">Loading payment summaries...</div>
              ) : paymentSummaries.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center text-slate-500">No guide payment summaries available.</div>
              ) : (
                <div className="space-y-4">
                  {paymentError && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{paymentError}</div>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {paymentSummaries.map((summary) => (
                      <div key={summary.guideId} className="rounded-3xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">{summary.guideName}</h3>
                            <p className="text-sm text-slate-500">{summary.bookingIds.length} completed booking(s)</p>
                          </div>
                          <span className={`rounded-2xl px-3 py-1 text-xs font-semibold ${summary.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{summary.paymentStatus}</span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Earned</p><p className="mt-2 text-lg font-semibold text-slate-950">${summary.totalEarned.toLocaleString()}</p></div>
                          <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Amount Paid</p><p className="mt-2 text-lg font-semibold text-slate-950">${summary.amountPaid.toLocaleString()}</p></div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm text-slate-500">Commission: ${summary.commissionDeducted.toLocaleString()}</div>
                          <button onClick={() => handleMarkGuidePaid(summary.guideId)} disabled={summary.paymentStatus === "PAID" || paymentActionLoading} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                            {summary.paymentStatus === "PAID" ? "Paid" : "Mark Paid"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guide Details Modal */}
      {showDetailModal && selectedGuideDetails && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-semibold text-slate-950">Guide Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-2xl font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex flex-col items-center gap-4 rounded-3xl bg-emerald-50 p-6 sm:flex-row">
                {/* ✅ FIX: show uploaded profile photo instead of emoji placeholder when available */}
                {selectedGuideDetails.photoUrl ? (
                  <img src={selectedGuideDetails.photoUrl} alt={selectedGuideDetails.fullName} className="h-32 w-32 rounded-full object-cover border border-emerald-200" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-200 text-5xl">👤</div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-slate-950">{selectedGuideDetails.fullName}</h3>
                  <p className="mt-2 text-sm text-slate-600">{selectedGuideDetails.bio}</p>
                </div>
              </div>

              {/* ✅ NEW: Gallery images in detail view */}
              {selectedGuideDetails.imageUrls && selectedGuideDetails.imageUrls.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Gallery</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedGuideDetails.imageUrls.map((url) => (
                      <img key={url} src={url} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Status</p>
                  <p className={`mt-2 text-lg font-bold ${selectedGuideDetails.available ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedGuideDetails.available ? "✓ Available" : "✕ Unavailable"}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Rating</p>
                  <p className="mt-2 text-lg font-bold text-amber-600">⭐ {selectedGuideDetails.rating?.toFixed(1) || "N/A"} ({selectedGuideDetails.reviewCount || 0} reviews)</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Specialties</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedGuideDetails.specialties.split(",").map((spec) => (
                    <span key={spec} className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">{spec.trim()}</span>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-sm font-semibold text-slate-700">Languages</p><p className="mt-2 text-slate-600">{selectedGuideDetails.languages}</p></div>
                <div><p className="text-sm font-semibold text-slate-700">District</p><p className="mt-2 text-slate-600">{selectedGuideDetails.district}</p></div>
                <div><p className="text-sm font-semibold text-slate-700">Price</p><p className="mt-2 text-lg font-bold text-slate-950">${selectedGuideDetails.pricePerDay}/day</p></div>
                <div><p className="text-sm font-semibold text-slate-700">Verified</p><p className="mt-2">{selectedGuideDetails.verified ? <span className="text-emerald-600">✓ Verified</span> : <span className="text-slate-500">Not Verified</span>}</p></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => { setShowDetailModal(false); setTimeout(() => handleEditGuide(selectedGuideId), 100); }} className="flex-1 inline-flex h-12 items-center justify-center rounded-3xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">✏️ Edit Guide</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 inline-flex h-12 items-center justify-center rounded-3xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700">🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col w-full max-w-2xl bg-white shadow-2xl overflow-hidden rounded-3xl max-h-[88vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{showEditModal ? "Edit Tour Guide" : "Add New Tour Guide"}</h2>
              <button onClick={() => showEditModal ? setShowEditModal(false) : setShowAddModal(false)} className="flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-base font-bold w-9 h-9 rounded-full">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="guide-form" onSubmit={showEditModal ? handleEditGuideSubmit : handleAddGuideSubmit}>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Full Name<input type="text" value={formData.fullName} onChange={(e) => handleInputChange("fullName", e.target.value)} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">District<input type="text" value={formData.district} onChange={(e) => handleInputChange("district", e.target.value)} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 md:col-span-2">Bio<textarea value={formData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white resize-none" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Languages<input type="text" value={formData.languages} onChange={(e) => handleInputChange("languages", e.target.value)} placeholder="English, Sinhala, Tamil" required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Specialties<input type="text" value={formData.specialties} onChange={(e) => handleInputChange("specialties", e.target.value)} placeholder="WILDLIFE,PHOTOGRAPHY" required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Price per day<input type="number" value={formData.pricePerDay} onChange={(e) => handleInputChange("pricePerDay", e.target.value)} min="0" step="0.01" required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Phone<input type="tel" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">WhatsApp Number<input type="tel" value={formData.whatsappNumber} onChange={(e) => handleInputChange("whatsappNumber", e.target.value)} placeholder="94771234567 (no + or spaces)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Email<input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white" /></label>

                  {/* ✅ FIX: Profile Photo — single upload */}
                  <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
                    <span>Profile Photo</span>
                    {formData.photoUrl ? (
                      <div className="flex items-center gap-3">
                        <img src={formData.photoUrl} alt="Profile preview" className="h-14 w-14 rounded-full object-cover border border-slate-200" />
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium normal-case">
                            Replace photo
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
                          </label>
                          <button type="button" onClick={handleRemovePhoto} className="text-xs text-red-600 hover:text-red-700 font-medium text-left normal-case">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-xl py-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition font-normal normal-case ${uploadingPhoto ? "pointer-events-none opacity-70" : ""}`}>
                        {uploadingPhoto ? <span className="text-slate-500">Uploading...</span> : <span className="text-slate-500">Click to upload profile photo (JPG, PNG, WEBP — max 5MB)</span>}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* ✅ FIX: Guide Image URLs textarea → real gallery upload */}
                  <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 md:col-span-2">
                    <span>Gallery Images</span>
                    <label className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-xl py-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition font-normal normal-case ${uploadingGallery ? "pointer-events-none opacity-70" : ""}`}>
                      {uploadingGallery ? <span className="text-slate-500">Uploading...</span> : <span className="text-slate-500">Click to upload gallery images (multiple allowed)</span>}
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryUpload} className="hidden" />
                    </label>
                    {formData.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.imageUrls.map((url) => (
                          <div key={url} className="relative group">
                            <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover border border-slate-200" />
                            <button type="button" onClick={() => handleRemoveGalleryImage(url)} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-700 transition">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {formError && <p className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 rounded-xl">{formError}</p>}
              </form>
            </div>
            <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-200 flex-shrink-0">
              <button type="button" onClick={() => showEditModal ? setShowEditModal(false) : setShowAddModal(false)} className="px-5 h-10 border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" form="guide-form" disabled={submitting || uploadingPhoto || uploadingGallery} className="px-5 h-10 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 rounded-xl">
                {submitting ? "Saving..." : showEditModal ? "Save Changes" : "Create Guide"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        loading={submitting}
        title="Delete Guide"
        message={`Are you sure you want to delete ${selectedGuideDetails?.fullName ?? "this guide"}? This action cannot be undone.`}
        confirmLabel="Delete Guide"
        tone="red"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteGuide}
      />

      {/* Bookings Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-semibold text-slate-950">{calendarGuideName} — Bookings</h2>
              <button onClick={() => setShowCalendarModal(false)} className="text-2xl font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-4 p-6">
              {selectedGuideBookings.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">No bookings found for this guide.</div>
              ) : (
                selectedGuideBookings.map((booking) => (
                  <div key={booking.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold">Booking #{booking.id}</p>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">{booking.status}</span>
                    </div>
                    <p className="text-sm text-slate-600">{booking.startDate} → {booking.endDate}</p>
                    <p className="text-sm text-slate-600 font-semibold mt-1">Total: ${booking.totalCost.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}