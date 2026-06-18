import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, Menu, X, LogOut } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Vehicles", href: "/vehicles" },
  { label: "Tour Guides", href: "/guides" },
  { label: "Destinations", href: "/destinations" },
  { label: "Hidden Gems", href: "/hidden-gems" },
  { label: "Event & Calendar", href: "/events" },
  { label: "Settings", href: "/settings" },
];

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate(); 
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "Admin";
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "A";

  // Dropdown එකෙන් එළියෙ click කරහම auto close වෙන්න
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Logout Function එක 
  const handleLogout = () => {
    logout("/login"); 
  };

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-700 shadow-lg font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                ExploreCeylon
              </div>
              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">ADMIN</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href) ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <span className="hidden sm:inline">{firstName}</span>
                <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-slate-800 border border-slate-700 py-2 z-50">
                  <div className="px-4 py-3 text-sm text-gray-300 border-b border-slate-700">
                    <p className="font-semibold text-white text-base">{user?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                    <p className="text-xs text-orange-500 mt-2 font-medium">👑 Administrator</p>
                  </div>
                  {/* Logout Button */}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center space-x-2">
                    <LogOut size={16} /><span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 transition-colors">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-slate-700">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive(item.href) ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-slate-800 hover:text-white"}`}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}