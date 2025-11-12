import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calculator,
  Utensils,
  Mountain,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MapPin,
  Info,
  Home,
} from "lucide-react";

interface SidebarProps {
  user: User | null;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requireAuth?: boolean;
  isPublic?: boolean;
}

export default function Sidebar({
  user,
  isMobileOpen,
  onMobileToggle,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [previewRoutesOpen, setPreviewRoutesOpen] = useState(false);

  const publicNavItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
      isPublic: true,
    },
    {
      href: "/calculator",
      label: "Calculator",
      icon: <Calculator className="w-5 h-5" />,
      isPublic: true,
    },
    {
      href: "/fuel",
      label: "Fuel Planner",
      icon: <Utensils className="w-5 h-5" />,
      isPublic: true,
    },
    {
      href: "/about",
      label: "About",
      icon: <Info className="w-5 h-5" />,
      isPublic: true,
    },
  ];

  const authNavItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      requireAuth: true,
    },
    {
      href: "/elevationfinder",
      label: "Elevation Finder",
      icon: <Mountain className="w-5 h-5" />,
      requireAuth: true,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      requireAuth: true,
    },
  ];

  const previewRoutes = [
    { name: "Boston Marathon", slug: "boston" },
    { name: "NYC Marathon", slug: "nyc" },
    { name: "Chicago Marathon", slug: "chicago" },
    { name: "Berlin Marathon", slug: "berlin" },
    { name: "London Marathon", slug: "london" },
    { name: "Tokyo Marathon", slug: "tokyo" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
      onMobileToggle();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActivePath = (path: string) => location.pathname === path;

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.href}
      onClick={onMobileToggle}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActivePath(item.href)
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            onClick={onMobileToggle}
            className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            TrainPace
          </Link>
          {/* Mobile close button */}
          <button
            onClick={onMobileToggle}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Public Links */}
        <div className="space-y-1">
          {publicNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Preview Routes Dropdown */}
        <div className="pt-2">
          <button
            onClick={() => setPreviewRoutesOpen(!previewRoutesOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span>Preview Routes</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                previewRoutesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {previewRoutesOpen && (
            <div className="mt-1 ml-4 space-y-1">
              {previewRoutes.map((route) => (
                <Link
                  key={route.slug}
                  to={`/preview-route/${route.slug}`}
                  onClick={onMobileToggle}
                  className={`block py-2 px-8 text-sm rounded-lg transition-colors ${
                    isActivePath(`/preview-route/${route.slug}`)
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  {route.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Auth-required Links */}
        {user && (
          <div className="pt-4 border-t border-gray-200 mt-4 space-y-1">
            {authNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        {/* Login Link (when not authenticated) */}
        {!user && (
          <div className="pt-4 border-t border-gray-200 mt-4">
            <Link
              to="/login"
              onClick={onMobileToggle}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Login</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Section (Bottom) */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:border-r md:border-gray-200 md:z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button (Hamburger) */}
      <button
        onClick={onMobileToggle}
        className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 md:hidden hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-900" />
      </button>
    </>
  );
}
