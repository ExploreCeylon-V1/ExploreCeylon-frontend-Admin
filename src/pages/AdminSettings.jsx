import React, { useState, useRef, useEffect } from "react";
import {
  Lock, User, Camera, Eye, EyeOff, Save, Shield, Mail, Phone,
  CheckCircle, AlertCircle, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as profileService from "../services/profileService";

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastBanner({ toast, onClose }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
      toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {toast.message}
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, required, icon, suffix, readOnly, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && !readOnly && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          placeholder={placeholder}
          required={required && !readOnly}
          readOnly={readOnly}
          className={`w-full py-2.5 border rounded-xl text-sm transition ${
            icon ? "pl-10" : "pl-4"
          } ${suffix ? "pr-10" : "pr-4"} ${
            readOnly
              ? "border-slate-100 bg-slate-100 text-slate-500 cursor-not-allowed select-none"
              : "border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          }`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Password Field ───────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      icon={<Lock size={15} />}
      suffix={
        <button type="button" onClick={() => setShow((s) => !s)} className="text-slate-400 hover:text-slate-600 transition">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score];
  const colors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-amber-400", "bg-emerald-500"];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Strength: <span className="font-medium text-slate-600">{label}</span>
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await profileService.getProfile();
        setProfile((p) => ({
          ...p,
          name: data?.name ?? p.name,
          email: data?.email ?? p.email,
          phone: data?.phone ?? p.phone,
        }));
        const avatar = data?.profilePhoto ?? user?.avatarUrl ?? null;
        if (avatar) setAvatarPreview(avatar);
      } catch {
        // ignore errors on load
      }
    })();
  }, [user]);

  const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showToast("error", "Only JPG, PNG or WebP images are allowed (e.g. not HEIC from an iPhone)");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image must be smaller than 5 MB");
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const res = await profileService.uploadAvatar(avatarFile);
      const avatarUrl = res?.profilePhoto ?? res?.avatarUrl ?? res?.url ?? null;
      if (avatarUrl) {
        setAvatarPreview(avatarUrl);
        updateLocalUser({ avatarUrl });
      }
      showToast("success", "Profile picture updated successfully");
      setAvatarFile(null);
    } catch (err) {
      showToast("error", err?.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await profileService.removeAvatar();
      setAvatarPreview(null);
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      const s = localStorage.getItem("ec_admin_user") || localStorage.getItem("exploreCeylonUser");
      if (s) {
        const u = JSON.parse(s);
        delete u.avatarUrl;
        localStorage.setItem("ec_admin_user", JSON.stringify(u));
      }
      showToast("success", "Profile picture removed");
    } catch (err) {
      showToast("error", err?.message || "Failed to remove profile picture");
    }
  };

  const updateLocalUser = (newData) => {
    try {
      const keys = ["ec_admin_user", "exploreCeylonUser", "user"];
      keys.forEach(key => {
        const s = localStorage.getItem(key);
        if (s) {
          const u = JSON.parse(s);
          Object.assign(u, newData);
          localStorage.setItem(key, JSON.stringify(u));
        }
      });
    } catch {}
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await profileService.updateProfile({
        name: profile.name,
        phone: profile.phone,
      });
      updateLocalUser({ name: res?.name ?? profile.name, phone: res?.phone ?? profile.phone });
      showToast("success", "Profile updated successfully");
    } catch {
      showToast("error", "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      showToast("error", "New passwords do not match");
      return;
    }
    if (passwords.next.length < 8) {
      showToast("error", "Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await profileService.changePassword(passwords.current, passwords.next);
      showToast("success", "Password updated successfully");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err) {
      showToast("error", err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.name ?? "A").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-100 mb-6">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your admin profile and account security</p>
        </div>

        {/* ── Profile Picture ── */}
        <SectionCard icon={<Camera size={18} />} title="Profile Picture" subtitle="Upload a photo to personalise your admin account">
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-200 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                  Choose Photo
                </button>
                {avatarFile && (
                  <>
                    <button type="button" onClick={handleAvatarUpload} disabled={uploadingAvatar} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
                      {uploadingAvatar ? "Uploading…" : "Save Photo"}
                    </button>
                    <button type="button" onClick={removeAvatar} className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition">
                      Remove
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">PNG, JPG or WebP · Max 5 MB</p>
              {avatarFile && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ {avatarFile.name} selected</p>}
            </div>
          </div>
        </SectionCard>

        {/* ── Profile Info ── */}
        <SectionCard icon={<User size={18} />} title="Profile Information" subtitle="Update your name and contact details">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <Field label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Your full name" required icon={<User size={15} />} />
            <Field label="Email Address" type="email" value={profile.email} onChange={() => {}} icon={<Mail size={15} />} readOnly hint="Email address cannot be changed. Contact a super admin if needed." />
            <Field label="Phone Number" type="tel" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="+94 77 000 0000" icon={<Phone size={15} />} />
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={savingProfile} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-sm">
                <Save size={15} /> {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Security / Password ── */}
        <SectionCard icon={<Shield size={18} />} title="Security Settings" subtitle="Change your admin account password">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <PasswordField label="Current Password" value={passwords.current} onChange={(v) => setPasswords({ ...passwords, current: v })} placeholder="Enter current password" required />
            <div>
              <PasswordField label="New Password" value={passwords.next} onChange={(v) => setPasswords({ ...passwords, next: v })} placeholder="Enter new password" required />
              <PasswordStrength password={passwords.next} />
            </div>
            <PasswordField label="Confirm New Password" value={passwords.confirm} onChange={(v) => setPasswords({ ...passwords, confirm: v })} placeholder="Confirm new password" required />
            {passwords.confirm && passwords.next && (
              <p className={`text-xs font-medium flex items-center gap-1 ${passwords.next === passwords.confirm ? "text-emerald-600" : "text-red-500"}`}>
                {passwords.next === passwords.confirm ? <><CheckCircle size={12} /> Passwords match</> : <><AlertCircle size={12} /> Passwords do not match</>}
              </p>
            )}
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={savingPassword} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-sm">
                <Lock size={15} /> {savingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden ">
          <div className="px-6 py-5 border-b border-red-100">
            <h2 className="text-base font-semibold text-red-600">Danger Zone</h2>
            <p className="text-xs text-slate-400 mt-0.5">Irreversible actions — proceed with caution</p>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Deactivate Admin Account</p>
              <p className="text-xs text-slate-400 mt-0.5">This will revoke all admin access immediately</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const pw = window.prompt("Enter your password to confirm deactivation:");
                if (!pw) return;
                (async () => {
                  try {
                    await profileService.deactivateAccount(pw);
                    showToast("success", "Account deactivated");
                    logout("/login");
                  } catch (err) {
                    showToast("error", "Failed to deactivate account: check your password");
                  }
                })();
              }}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition"
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}