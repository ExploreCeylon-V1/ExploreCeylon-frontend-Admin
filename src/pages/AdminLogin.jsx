import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginUser, isAdmin } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  //const { login: contextLogin, logout: contextLogout, user } = useAuth();
  const { login: contextLogin, logout: contextLogout, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      setIsChecking(false);
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      if (data.role !== "ADMIN") {
        contextLogout();
        throw new Error("Access denied. Admin accounts only.");
      }

      contextLogin(data.accessToken, {
        id: data.userId,
        name: data.name || "",
        email: data.email || "",
        role: data.role || "ADMIN",
        avatarUrl: data.avatarUrl,
      });

      navigate("/");
    } catch (err) {
      setError(err?.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 font-sans md:grid-cols-2 bg-[#f8f7f4]">
      {/* ── LEFT PANEL ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0d3320] p-12 md:flex">
        {/* Background Gradients & Grid Lines */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(52,211,153,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_90%,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#34d399] to-[#059669] text-lg font-bold text-white shadow-[0_0_24px_rgba(52,211,153,0.35)]">
            E
          </div>
          <div>
            <div className="font-serif text-[22px] font-semibold tracking-wide text-white">ExploreCeylon</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.15em] text-white/40">Admin Portal</div>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8">
          <div>
            <h1 className="font-serif text-[clamp(36px,4vw,52px)] font-medium leading-[1.15] tracking-tight text-white">
              Managing<br />Sri Lanka's<br /><em className="not-italic text-[#6ee7b7]">Premier</em> Tourism<br />Platform
            </h1>
            <p className="mt-5 max-w-[320px] text-sm leading-[1.7] text-white/50">
              Oversee vehicles, bookings, tour guides, and destinations — all from one powerful dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { val: "12K+", label: "Travelers" },
              { val: "4.9★", label: "Rating" },
              { val: "500+", label: "Destinations" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <div className="font-serif text-2xl font-semibold text-[#6ee7b7]">{stat.val}</div>
                <div className="mt-1 text-[11px] tracking-wider text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[320px] w-[320px] rounded-full border border-[#34d399]/10" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-[200px] w-[200px] rounded-full border border-[#34d399]/10" />

        <div className="relative z-10 text-xs tracking-wider text-white/25">
          ExploreCeylon © {new Date().getFullYear()} · Admin Access Only
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col items-center justify-center p-12 bg-[#f8f7f4]">
        <div className="w-full max-w-[400px]">
          <div className="mb-9">
            <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#059669]">Admin Portal</div>
            <h2 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-[#0d1a12]">Welcome Back</h2>
            <p className="mt-2 text-sm text-[#6b7c71]">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-5">
              <label className="mb-2 block text-[13px] font-medium tracking-wide text-[#2d4a38]" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[#9cb5a4]">✉</span>
                <input
                  id="email" type="email" required placeholder="admin@exploreceylon.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-[#dde8e0] bg-white py-[13px] pl-[42px] pr-4 text-sm text-[#0d1a12] outline-none transition-all placeholder:text-[#b5c8bc] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.1)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="mb-2 block text-[13px] font-medium tracking-wide text-[#2d4a38]" htmlFor="password">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[#9cb5a4]">🔒</span>
                <input
                  id="password" type={showPassword ? "text" : "password"} required placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-[#dde8e0] bg-white py-[13px] pl-[42px] pr-[60px] text-sm text-[#0d1a12] outline-none transition-all placeholder:text-[#b5c8bc] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.1)]"
                />
                <button
                  type="button" tabIndex="-1" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[13px] text-[#9cb5a4] transition-colors hover:text-[#059669]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4.5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] leading-relaxed text-red-700">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#065f46] to-[#059669] p-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(5,150,105,0.3)] transition-all hover:not(:disabled):-translate-y-px hover:not(:disabled):opacity-90 hover:not(:disabled):shadow-[0_6px_24px_rgba(5,150,105,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white align-middle" />Signing in...</>
              ) : ("Sign In")}
            </button>
          </form>

          {/* Admin notice */}
          <div className="mt-4.5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-xs text-green-800">
            <span>🔐</span><span>Admin access only. Unauthorized access is prohibited.</span>
          </div>

          <p className="mt-3.5 text-[13px] text-green-900">
            Need an admin account?{" "}
            <Link to="/register" className="font-semibold text-[#059669] hover:text-[#047857]">Register here</Link>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-[#9cafa3]">
          ExploreCeylon © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}