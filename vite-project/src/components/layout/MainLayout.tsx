import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import PreviewRoutesDropdown from "./PreviewRoutesDropdown";
import Footer from "./Footer";

type NavBehavior = "static" | "sticky" | "fixed" | "auto-hide";
interface NavLink {
  href: string;
  label: string;
  isDropdown?: boolean; // Add this optional property
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  
  // Navigation behavior configuration
  const navBehavior: NavBehavior = "fixed";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle scroll behavior for sticky/auto-hide nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Track if we've scrolled (for styling)
      setScrolled(currentScrollY > 10);

      // Auto-hide behavior
      if (navBehavior === "auto-hide") {
        if (currentScrollY < lastScrollY || currentScrollY < 100) {
          setNavVisible(true);
        } else {
          setNavVisible(false);
          setMobileMenuOpen(false); // Close mobile menu when hiding
        }
      }

      setLastScrollY(currentScrollY);
    };

    if (navBehavior === "sticky" || navBehavior === "auto-hide") {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [lastScrollY, navBehavior]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Reset mobile preview state when menu closes
  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobilePreviewOpen(false);
    }
  }, [mobileMenuOpen]);

  const getNavigationLinks = (): NavLink[] => {
    const publicLinks: NavLink[] = [
      { href: "#", label: "Preview Routes", isDropdown: true },
      { href: "/calculator", label: "Calculator" },
      { href: "/fuel", label: "Fuel Planner" },
    ];

    const authLinks: NavLink[] = user
      ? [
          { href: "/elevationfinder", label: "ElevationFinder" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/settings", label: "Settings" },
        ]
      : [{ href: "/login", label: "Login" }];

    return [...publicLinks, ...authLinks];
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const links = getNavigationLinks();

  // Dynamic header classes based on behavior
  const getHeaderClasses = () => {
    const baseClasses =
      "flex justify-between items-center px-4 py-4 border-b border-gray-200 transition-all duration-300";

    switch (navBehavior) {
      case "static":
        return `${baseClasses} bg-white relative z-50`;

      case "sticky":
        return `${baseClasses} sticky top-0 z-50 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-white"
        }`;

      case "fixed":
        return `${baseClasses} fixed top-0 left-0 right-0 z-50 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-white"
        }`;

      case "auto-hide":
        return `${baseClasses} fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ${
          navVisible ? "translate-y-0" : "-translate-y-full"
        } ${scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-white"}`;

      default:
        return `${baseClasses} bg-white relative z-50`;
    }
  };

  // Add padding to body when using fixed/auto-hide nav
  const getMainClasses = () => {
    if (navBehavior === "fixed" || navBehavior === "auto-hide") {
      return "pt-[73px]"; // Adjust based on your header height
    }
    return "";
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col">


      <header className={getHeaderClasses()}>
        <Link
          to="/"
          className="text-xl font-bold text-gray-900 z-30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Go to homepage"
        >
          TrainPace
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {location.pathname === "/" && (
            <a href="#features" className="text-gray-700 hover:text-blue-600">
              Features
            </a>
          )}
          
          <Link
            to="/about"
            className={`text-gray-700 hover:text-blue-600 transition-colors ${
              location.pathname === "/about"
                ? "text-blue-600 font-medium"
                : ""
            }`}
          >
            About
          </Link>

          {links.map((link) => {
            // Handle dropdown case
            if (link.isDropdown && link.label === "Preview Routes") {
              return <PreviewRoutesDropdown key={link.label} />;
            }

            // Handle regular links
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`text-gray-700 hover:text-blue-600 transition-colors ${
                  location.pathname === link.href
                    ? "text-blue-600 font-medium"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-700 hover:text-blue-600"
              disabled={loading}
            >
              Logout
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out w-80 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <span className="font-bold text-xl text-gray-900">Menu</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          <nav className="space-y-4">
            {location.pathname !== "/" && (
              <Link
                to="/"
                className="block py-3 px-4 text-lg font-medium rounded-lg text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            )}

            {location.pathname === "/" && (
              <a
                href="#features"
                className="block py-3 px-4 text-lg font-medium rounded-lg text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
            )}
            
            <Link
              to="/about"
              className={`block py-3 px-4 text-lg font-medium rounded-lg transition-colors ${
                location.pathname === "/about"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-900 hover:bg-gray-100 hover:text-blue-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>

            {/* Regular navigation links */}
            {links.map((link) => {
              // Skip the dropdown item in mobile - we'll handle it separately
              if (link.isDropdown) return null;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block py-3 px-4 text-lg font-medium rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-900 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Collapsible Preview Routes Section for Mobile */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-lg font-medium bg-white text-gray-900 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
              >
                <span>Preview Routes</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobilePreviewOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {mobilePreviewOpen && (
                <div className="mt-2 space-y-1 bg-white p-2 rounded-lg">
                  {[
                    { name: "Boston Marathon", slug: "boston" },
                    { name: "NYC Marathon", slug: "nyc" },
                    { name: "Chicago Marathon", slug: "chicago" },
                    { name: "Berlin Marathon", slug: "berlin" },
                    { name: "London Marathon", slug: "london" },
                    { name: "Tokyo Marathon", slug: "tokyo" },
                  ].map((route) => (
                    <Link
                      key={route.slug}
                      to={`/preview-route/${route.slug}`}
                      className={`block py-2 px-6 text-base text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors ${
                        location.pathname === `/preview-route/${route.slug}`
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "bg-white"
                      }`}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobilePreviewOpen(false);
                      }}
                    >
                      {route.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {user && (
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={handleLogout}
                disabled={loading}
              >
                Logout
              </Button>
            )}
          </nav>
        </div>
      </div>

      <main className={`${getMainClasses()} flex-grow`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
