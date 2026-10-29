import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { User } from "firebase/auth";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Settings,
  LayoutDashboard,
  X,
} from "lucide-react";
import { NAV_GROUPS, POPULAR_COURSES } from "./constants/navLinks";

// Watch bezel with a progress arc: the same mark as the race-watch hero.
function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M12 3 A9 9 0 0 1 20.6 14.6"
        fill="none"
        stroke="rgb(52 211 153)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

// index.css still styles bare <button>s (background, purple hover border),
// so every button here sets its own background and border.
const bareButton = "border-0 bg-transparent hover:border-transparent";

interface SiteNavProps {
  user: User | null;
  authLoading: boolean;
  onLogout: () => void;
}

export default function SiteNav({ user, authLoading, onLogout }: SiteNavProps) {
  const location = useLocation();
  const panelId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number>();

  // Close everything on navigation.
  useEffect(() => {
    setOpen(null);
    setAccountOpen(false);
    setSheetOpen(false);
  }, [location.pathname]);

  // Hide while scrolling down, show while scrolling up (kept from the old nav).
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 100 && y > last);
      if (y > last) {
        setOpen(null);
        setAccountOpen(false);
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape and clicks outside close the menus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      setAccountOpen(false);
      setSheetOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setOpen(null);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Lock page scroll behind the phone menu.
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const openGroup = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setAccountOpen(false);
    setOpen(label);
  };
  // A short delay so moving the pointer from a tab into its panel doesn't close it.
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 150);
  };

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);
  const groupActive = (label: string) =>
    NAV_GROUPS.find((g) => g.label === label)!.items.some((it) =>
      isActive(it.to),
    );
  const activeGroup = NAV_GROUPS.find((g) => g.label === open);
  const initial = (user?.displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 text-left text-white transition-[transform,background-color] duration-300 ${
          hidden && !sheetOpen ? "-translate-y-full" : "translate-y-0"
        } ${
          open || scrolled
            ? "border-b border-white/10 bg-black/90 backdrop-blur-xl"
            : "border-b border-white/5 bg-black"
        }`}
        onMouseLeave={closeSoon}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-md font-display text-lg font-bold text-white ${focusRing}`}
          >
            <LogoMark className="h-6 w-6" />
            TrainPace
          </Link>

          <nav
            data-testid="desktop-nav"
            aria-label="Main"
            className="hidden items-center gap-1 md:flex"
          >
            <ul className="flex items-center gap-1">
              {NAV_GROUPS.map((g) => {
                const isOpen = open === g.label;
                return (
                  <li key={g.label}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onMouseEnter={() => openGroup(g.label)}
                      onClick={() =>
                        isOpen ? setOpen(null) : openGroup(g.label)
                      }
                      className={`${bareButton} ${focusRing} flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isOpen
                          ? "bg-white/10 text-white"
                          : groupActive(g.label)
                            ? "text-emerald-300"
                            : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {g.label}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            <span aria-hidden className="mx-3 h-5 w-px bg-white/15" />

            {user ? (
              <div className="relative flex items-center gap-1">
                <Link
                  to="/dashboard"
                  className={`${focusRing} rounded-md px-3 py-2 text-sm font-medium ${
                    isActive("/dashboard")
                      ? "text-emerald-300"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  onClick={() => {
                    setOpen(null);
                    setAccountOpen((v) => !v);
                  }}
                  className={`${focusRing} flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white hover:border-white/30`}
                >
                  {initial}
                </button>
                {accountOpen && (
                  <div className="absolute top-11 right-0 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-950 py-1 shadow-2xl">
                    <p className="truncate px-4 py-2 text-xs text-slate-500">
                      {user.email}
                    </p>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-500" />{" "}
                      Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4 text-slate-500" /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={authLoading}
                      className={`${bareButton} flex w-full items-center gap-2 rounded-none px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/5`}
                    >
                      <LogOut className="h-4 w-4 text-slate-500" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  to="/login"
                  className={`${focusRing} rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:text-white`}
                >
                  Log in
                </Link>
                <Link
                  to="/calculator"
                  className={`${focusRing} ml-1 inline-flex items-center gap-1.5 rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300`}
                >
                  Get my paces
                </Link>
              </div>
            )}
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
            className={`${bareButton} ${focusRing} rounded-md p-2 text-white md:hidden`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop menu panel */}
        {activeGroup && (
          <div
            id={panelId}
            onMouseEnter={() => window.clearTimeout(closeTimer.current)}
            className="hidden border-t border-white/10 md:block"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] gap-10 px-4 py-6 sm:px-6 lg:px-8">
              <ul className="grid grid-cols-3 gap-2">
                {activeGroup.items.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`${focusRing} group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/5`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300 transition-colors group-hover:bg-emerald-400 group-hover:text-slate-950">
                        <it.icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">
                          {it.label}
                        </span>
                        <span className="block text-sm text-slate-400">
                          {it.desc}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {activeGroup.label === "Race" && (
                <div className="w-56 border-l border-white/10 pl-8">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                    Course previews
                  </p>
                  <ul className="space-y-1">
                    {POPULAR_COURSES.map((c) => (
                      <li key={c.slug}>
                        <Link
                          to={`/preview-route/${c.slug}`}
                          className={`${focusRing} block rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-white/5 hover:text-white`}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      {/* Phone menu: a sibling of <header>, because the header's transform
          (hide on scroll) would trap a fixed child inside its 64px box. */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] overflow-y-auto bg-black px-4 pb-10 text-left text-white md:hidden"
        >
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 font-display text-lg font-bold text-white"
            >
              <LogoMark className="h-6 w-6" />
              TrainPace
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setSheetOpen(false)}
              className={`${bareButton} ${focusRing} rounded-md p-2 text-white`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {NAV_GROUPS.map((g) => (
            <section key={g.label} className="mt-6">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {g.label}
              </h2>
              <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                {g.items.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`flex items-center gap-3 px-4 py-3.5 ${isActive(it.to) ? "text-emerald-300" : "text-white"}`}
                    >
                      <it.icon className="h-5 w-5 text-emerald-300" />
                      <span className="flex-1 font-medium">{it.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Course previews
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COURSES.map((c) => (
                <Link
                  key={c.slug}
                  to={`/preview-route/${c.slug}`}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300"
                >
                  {c.name.replace(" Marathon", "")}
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={authLoading}
                  className="col-span-2 rounded-md border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:border-white/30"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/calculator"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
                >
                  Get my paces <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
