import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

export default function SideNav() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  let touchStartX = 0;

  const links = [
    { href: "/", label: "Home" },
    { href: "/calculator", label: "Calculator" },
    { href: "/fuel", label: "Fuel Planner" },
  ];

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchEndX = e.touches[0].clientX;
      if (touchEndX - touchStartX > 50) {
        setOpen(false);
      }
    };

    if (open) {
      drawer.addEventListener("touchstart", handleTouchStart);
      drawer.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      drawer?.removeEventListener("touchstart", handleTouchStart);
      drawer?.removeEventListener("touchmove", handleTouchMove);
    };
  }, [open]);

  return (
    <div>
      {/* Toggle Button - Mobile Only */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed top-10 right-8 z-50 p-2 bg-primary text-white rounded md:hidden"
      >
        {/* Hamburger Icon */}
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

      {/* Overlay - Mobile Only */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side Drawer - Mobile Only */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full bg-background shadow-lg z-50 transition-transform duration-300 ease-in-out w-full max-w-md p-8 flex flex-col space-y-6 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Button
          onClick={() => setOpen(false)}
          className="self-end p-2 text-muted hover:text-primary"
        >
          {/* Close (X) Icon */}
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

        <nav className="flex flex-col space-y-4 text-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-foreground hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
