import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Heart } from "lucide-react";

function AdminFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">ExploreCeylon</span>
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            © {new Date().getFullYear()} ExploreCeylon. Built with <Heart size={11} className="text-pink-500 fill-pink-500" /> for Sri Lanka tourism
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <AdminSidebar />
      {/* lg:ml-64 reserves space for the fixed left-side sidebar on desktop (>=1024px); mobile & tablet (<1024px) use full width with drawer */}
      <div className="flex flex-col min-h-screen lg:ml-64">
        <main className="flex-1">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
