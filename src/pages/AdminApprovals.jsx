import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  RefreshCw,
  Search,
  X,
  FileText,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
} from "lucide-react";
import * as adminVerificationService from "../services/adminVerificationService";
import DataTable from "../components/admin/DataTable";
import SearchBar from "../components/admin/SearchBar";
import Pagination from "../components/admin/Pagination";
import StatusBadge from "../components/admin/StatusBadge";
import ConfirmDialog from "../components/admin/ConfirmDialog";

const PAGE_SIZE = 15;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KycStatusBadge({ status }) {
  const map = {
    APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
    PENDING: { label: "Pending Review", className: "bg-amber-100 text-amber-800 border border-amber-200" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border border-red-200" },
  };

  const current = map[status] || { label: status, className: "bg-slate-100 text-slate-700" };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {status === "APPROVED" && <CheckCircle2 size={12} />}
      {status === "PENDING" && <Clock size={12} />}
      {status === "REJECTED" && <XCircle size={12} />}
      {current.label}
    </span>
  );
}

export default function AdminApprovals() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");

  // Review Modal State
  const [activeVerification, setActiveVerification] = useState(null);
  const [frontImageUrl, setFrontImageUrl] = useState(null);
  const [backImageUrl, setBackImageUrl] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Reject dialog state inside modal
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Approve Confirm Dialog
  const [confirmApprove, setConfirmApprove] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminVerificationService.getVerifications({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
        page,
        size: PAGE_SIZE,
        sortBy,
        sortDir,
      });
      setPageData(data);
    } catch (err) {
      console.error("Failed to load KYC verifications:", err);
      setError(err?.message || "Failed to load verification requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, sortBy, sortDir]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 250);
    return () => clearTimeout(timeout);
  }, [loadData]);

  // Load signed S3 image URLs when opening a verification in modal
  const handleOpenReview = async (verification) => {
    setActiveVerification(verification);
    setFrontImageUrl(null);
    setBackImageUrl(null);
    setImageError(null);
    setShowRejectBox(false);
    setRejectionReason("");
    setRejectError(null);
    setLoadingImages(true);

    try {
      // 1. Fetch front image signed URL
      const frontRes = await adminVerificationService.getImageSignedUrl(verification.id, "front");
      setFrontImageUrl(frontRes.url);

      // 2. Fetch back image signed URL if applicable
      if (verification.hasBackImage) {
        const backRes = await adminVerificationService.getImageSignedUrl(verification.id, "back");
        setBackImageUrl(backRes.url);
      }
    } catch (err) {
      console.error("Error loading signed images:", err);
      setImageError("Could not retrieve secure document images. Check S3 credentials.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleApprove = async () => {
    if (!activeVerification) return;
    try {
      setProcessingAction(true);
      await adminVerificationService.approveVerification(activeVerification.id);
      setActiveVerification(null);
      setConfirmApprove(false);
      await loadData();
    } catch (err) {
      console.error("Failed to approve verification:", err);
      alert(err?.message || "Failed to approve verification");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!activeVerification) return;
    if (!rejectionReason.trim()) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }

    try {
      setProcessingAction(true);
      setRejectError(null);
      await adminVerificationService.rejectVerification(activeVerification.id, rejectionReason.trim());
      setActiveVerification(null);
      setShowRejectBox(false);
      await loadData();
    } catch (err) {
      console.error("Failed to reject verification:", err);
      setRejectError(err?.message || "Failed to reject verification");
    } finally {
      setProcessingAction(false);
    }
  };

  const columns = [
    {
      key: "user",
      label: "Traveler",
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
            {v.userName?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{v.userName}</p>
            <p className="text-[11px] text-slate-400 truncate">{v.userEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "nationality",
      label: "Nationality",
      render: (v) => (
        <span className="text-xs font-medium text-slate-700">{v.nationality || "—"}</span>
      ),
    },
    {
      key: "documentType",
      label: "Document",
      render: (v) => (
        <div>
          <span className="text-xs font-semibold text-slate-900 block">
            {v.documentType?.replace("_", " ")}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {v.hasBackImage ? "Front + Back" : "Front Only"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <KycStatusBadge status={v.status} />,
    },
    {
      key: "submittedAt",
      label: "Submitted",
      sortable: true,
      render: (v) => <span className="text-xs text-slate-500">{formatDate(v.submittedAt)}</span>,
    },
    {
      key: "reviewedBy",
      label: "Reviewed By",
      hideOnMobile: true,
      render: (v) =>
        v.reviewedByName ? (
          <div>
            <span className="text-xs font-medium text-slate-700 block">{v.reviewedByName}</span>
            <span className="text-[10px] text-slate-400 block">{formatDate(v.reviewedAt)}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (v) => (
        <div className="flex items-center gap-2">
          {v.status === "PENDING" ? (
            <button
              onClick={() => handleOpenReview(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} /> Review ID
            </button>
          ) : (
            <button
              onClick={() => handleOpenReview(v)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye size={13} /> View
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 mb-2">
                <ShieldCheck size={13} /> Identity Verification Gate
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">KYC & Document Approvals</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Review government-issued IDs for traveler bookings (Vehicles & Tour Guides)
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone, nationality..." />

              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
                {[
                  { key: "ALL", label: "All Submissions" },
                  { key: "PENDING", label: "Pending" },
                  { key: "APPROVED", label: "Approved" },
                  { key: "REJECTED", label: "Rejected" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPage(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === tab.key
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="cursor-pointer"><X size={16} /></button>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={pageData.content}
            loading={loading}
            emptyMessage="No verification submissions found matching criteria."
          />

          {/* Pagination */}
          {pageData.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={pageData.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </main>
      </div>

      {/* Review / Lightbox Modal */}
      {activeVerification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Review ID Submission</h3>
                  <p className="text-xs text-slate-400">Submission ID: {activeVerification.id}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveVerification(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* Traveler Info Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <User size={12} /> Traveler Name
                  </span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {activeVerification.userName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <Mail size={12} /> Email
                  </span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {activeVerification.userEmail}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <Globe size={12} /> Nationality
                  </span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {activeVerification.nationality}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <FileText size={12} /> Document Type
                  </span>
                  <span className="font-bold text-orange-600 mt-0.5 block">
                    {activeVerification.documentType?.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Rejection notice if previously rejected */}
              {activeVerification.status === "REJECTED" && activeVerification.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-red-700">
                    <AlertTriangle size={14} /> Rejection Reason:
                  </p>
                  <p className="bg-white/80 p-2.5 rounded-xl border border-red-200/60 font-medium">
                    {activeVerification.rejectionReason}
                  </p>
                </div>
              )}

              {/* Document Images Viewer */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Document Photos (Short-Lived Signed URLs)
                </h4>

                {loadingImages ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <RefreshCw className="animate-spin text-orange-500 h-6 w-6" />
                    <p className="text-xs text-slate-500">Generating secure presigned image URLs...</p>
                  </div>
                ) : imageError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                    {imageError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Image */}
                    <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          {activeVerification.documentType === "PASSPORT" ? "Passport Photo Page" : "Front Side"}
                        </span>
                        {frontImageUrl && (
                          <a
                            href={frontImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Open Full Size
                          </a>
                        )}
                      </div>
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                        {frontImageUrl ? (
                          <img
                            src={frontImageUrl}
                            alt="Front Document"
                            className="w-full h-full object-contain hover:scale-105 transition-transform"
                          />
                        ) : (
                          <p className="text-xs text-slate-400">No front image</p>
                        )}
                      </div>
                    </div>

                    {/* Back Image (if required) */}
                    {activeVerification.hasBackImage && (
                      <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">Back Side</span>
                          {backImageUrl && (
                            <a
                              href={backImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Open Full Size
                            </a>
                          )}
                        </div>
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                          {backImageUrl ? (
                            <img
                              src={backImageUrl}
                              alt="Back Document"
                              className="w-full h-full object-contain hover:scale-105 transition-transform"
                            />
                          ) : (
                            <p className="text-xs text-slate-400">No back image</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rejection input box */}
              {showRejectBox && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-red-900 uppercase tracking-wide">
                      Reason for Rejection <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. The document photo is blurred and unreadable. Please provide a clear, glare-free picture."
                    className="w-full rounded-xl border border-red-200 bg-white p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  {rejectError && <p className="text-xs text-red-600">{rejectError}</p>}
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={processingAction}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {processingAction ? "Submitting Rejection..." : "Confirm Rejection & Notify Traveler"}
                  </button>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-slate-400">
                Submitted on: {formatDate(activeVerification.submittedAt)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVerification(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
                >
                  Close
                </button>

                {activeVerification.status === "PENDING" && !showRejectBox && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(true)}
                      className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject Submission
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmApprove(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Approve Verification
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Dialog for Approval */}
      <ConfirmDialog
        open={confirmApprove}
        title="Approve Government ID?"
        message={`Are you sure you want to approve ${activeVerification?.userName}'s identity? This will immediately unlock booking privileges for vehicles and tour guides.`}
        confirmLabel={processingAction ? "Approving..." : "Yes, Approve"}
        tone="green"
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />
    </div>
  );
}
