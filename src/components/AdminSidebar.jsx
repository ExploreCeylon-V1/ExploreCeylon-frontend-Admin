import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChevronDown, Menu, X, LogOut,
  LayoutDashboard, BarChart3, Users, CalendarCheck, Car, Compass,
  MapPin, Gem, CalendarDays, Star, Settings, Mail,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Users", href: "/users", icon: Users },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Tour Guides", href: "/guides", icon: Compass },
  { label: "Destinations", href: "/destinations", icon: MapPin },
  { label: "Hidden Gems", href: "/hidden-gems", icon: Gem },
  { label: "Event & Calendar", href: "/events", icon: CalendarDays },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Contact Messages", href: "/contact", icon: Mail },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-5 py-5">
      <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
        ExploreCeylon
      </div>
      <span className="text-[10px] bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">ADMIN</span>
    </Link>
  );
}

function NavLinks({ isActive, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "Admin";
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "A";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="relative border-t border-slate-700 p-3" ref={dropdownRef}>
      {dropdownOpen && (
        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg shadow-lg bg-slate-800 border border-slate-700 py-2 z-50">
          <div className="px-4 py-3 text-sm text-gray-300 border-b border-slate-700">
            <p className="font-semibold text-white text-base truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
            <p className="text-xs text-orange-500 mt-2 font-medium">👑 Administrator</p>
          </div>
          <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
            <LogOut size={16} /><span>Logout</span>
          </button>
        </div>
      )}
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <span className="flex-1 text-left truncate">{firstName}</span>
        <ChevronDown size={16} className={`transition-transform flex-shrink-0 ${dropdownOpen ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}

// Left-side vertical navigation — replaces the old top horizontal navbar.
// Fixed to the left edge on desktop; on small screens it becomes a
// slide-in drawer from the left, toggled by a floating menu button.
export default function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => logout("/login");

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar — fixed to the left edge */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-slate-900 border-r border-slate-700 shadow-lg z-40">
        <Brand />
        <NavLinks isActive={isActive} />
        <UserMenu user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar with menu toggle */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-900 border-b border-slate-700 px-4 h-14">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">ExploreCeylon</span>
          <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer — slides in from the left */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-start">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-700 shadow-lg flex flex-col">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <NavLinks isActive={isActive} onNavigate={() => setMobileOpen(false)} />
            <UserMenu user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}
    </>
  );
}
