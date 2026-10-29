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
import { ThemeToggle, useTheme } from "@/features/theme";
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
        className="stroke-emerald-500 dark:stroke-emerald-400"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-black";

// Quiet nav text: tabs, "Log in", Dashboard.
const navText =
  "text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white";
const activeText = "text-emerald-700 dark:text-emerald-300";
// Rows in the account menu.
const menuRow =
  "flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-neutral-200 dark:hover:bg-white/5";
// Outlined buttons in the phone menu.
const sheetOutline =
  "inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:border-white/15 dark:text-white";

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
  const { resolved } = useTheme();
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
    // The nav is theme-aware on every page, even ones whose content is not
    // converted yet (where <html> has no `dark`), so it scopes its own class.
    <div className={resolved === "dark" ? "dark contents" : "contents"}>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 text-left text-slate-900 transition-[transform,background-color] duration-300 dark:text-white ${
          hidden && !sheetOpen ? "-translate-y-full" : "translate-y-0"
        } ${
          open || scrolled
            ? "border-b border-slate-200 bg-white dark:border-white/10 dark:bg-black/90 dark:backdrop-blur-xl"
            : "border-b border-slate-200 bg-white dark:border-white/5 dark:bg-black"
        }`}
        onMouseLeave={closeSoon}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-md font-display text-lg font-bold ${focusRing}`}
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
                          ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white"
                          : groupActive(g.label)
                            ? activeText
                            : navText
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

            <span
              aria-hidden
              className="mx-3 h-5 w-px bg-slate-200 dark:bg-white/15"
            />

            <ThemeToggle className="mr-2" />

            {user ? (
              <div className="relative flex items-center gap-1">
                <Link
                  to="/dashboard"
                  className={`${focusRing} rounded-md px-3 py-2 text-sm font-medium ${
                    isActive("/dashboard") ? activeText : navText
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
                  className={`${focusRing} flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 p-0 text-sm font-semibold text-slate-900 hover:border-slate-300 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white/30`}
                >
                  {initial}
                </button>
                {accountOpen && (
                  <div className="absolute top-11 right-0 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl dark:border-white/10 dark:bg-neutral-950">
                    <p className="truncate px-4 py-2 text-xs text-slate-500">
                      {user.email}
                    </p>
                    <Link to="/dashboard" className={menuRow}>
                      <LayoutDashboard className="h-4 w-4 text-slate-400 dark:text-neutral-500" />{" "}
                      Dashboard
                    </Link>
                    <Link to="/settings" className={menuRow}>
                      <Settings className="h-4 w-4 text-slate-400 dark:text-neutral-500" />{" "}
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={authLoading}
                      className={`${bareButton} ${menuRow} w-full rounded-none text-left`}
                    >
                      <LogOut className="h-4 w-4 text-slate-400 dark:text-neutral-500" />{" "}
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  to="/login"
                  className={`${focusRing} ${navText} rounded-md px-3 py-2 text-sm font-medium`}
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
            className={`${bareButton} ${focusRing} rounded-md p-2 md:hidden`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop menu panel */}
        {activeGroup && (
          <div
            id={panelId}
            onMouseEnter={() => window.clearTimeout(closeTimer.current)}
            className="hidden border-t border-slate-200 md:block dark:border-white/10"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] gap-10 px-4 py-6 sm:px-6 lg:px-8">
              <ul className="grid grid-cols-3 gap-2">
                {activeGroup.items.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`${focusRing} group flex gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/5`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-400 group-hover:text-slate-950 dark:bg-emerald-400/10 dark:text-emerald-300">
                        <it.icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                          {it.label}
                        </span>
                        <span className="block text-sm text-slate-500 dark:text-neutral-400">
                          {it.desc}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {activeGroup.label === "Race" && (
                <div className="w-56 border-l border-slate-200 pl-8 dark:border-white/10">
                  <p className="mb-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                    Course previews
                  </p>
                  <ul className="space-y-1">
                    {POPULAR_COURSES.map((c) => (
                      <li key={c.slug}>
                        <Link
                          to={`/preview-route/${c.slug}`}
                          className={`${focusRing} block rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white`}
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
          className="fixed inset-0 z-[60] overflow-y-auto bg-white px-4 pb-10 text-left text-slate-900 md:hidden dark:bg-black dark:text-white"
        >
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 font-display text-lg font-bold"
            >
              <LogoMark className="h-6 w-6" />
              TrainPace
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setSheetOpen(false)}
              className={`${bareButton} ${focusRing} rounded-md p-2`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {NAV_GROUPS.map((g) => (
            <section key={g.label} className="mt-6">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {g.label}
              </h2>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
                {g.items.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`flex items-center gap-3 px-4 py-3.5 ${isActive(it.to) ? activeText : "text-slate-900 dark:text-white"}`}
                    >
                      <it.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                      <span className="flex-1 font-medium">{it.label}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 dark:text-neutral-600" />
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
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 dark:border-white/10 dark:text-neutral-300"
                >
                  {c.name.replace(" Marathon", "")}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Theme
            </h2>
            <ThemeToggle variant="full" />
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
                <Link to="/settings" className={sheetOutline}>
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={authLoading}
                  className={`${sheetOutline} col-span-2 bg-transparent hover:border-slate-400 dark:hover:border-white/30`}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={sheetOutline}>
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
    </div>
  );
}
