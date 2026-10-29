import { Link } from "react-router-dom";
import { useTheme } from "@/features/theme";

const linkClass =
  "text-slate-600 hover:text-emerald-600 transition-colors text-sm dark:text-neutral-400 dark:hover:text-emerald-400";
const headingClass = "font-semibold text-slate-900 mb-4 dark:text-white";
const statClass =
  "text-3xl md:text-4xl font-bold text-emerald-600 dark:text-white";
const mutedClass = "text-sm text-slate-600 dark:text-neutral-400";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { resolved } = useTheme();

  return (
    // Theme-aware on every page, like SiteNav: it scopes its own `dark`
    // class because <html> only gets one on converted pages.
    <div className={resolved === "dark" ? "dark mt-auto" : "mt-auto"}>
      <footer className="bg-slate-50 border-t border-slate-200 dark:bg-neutral-950 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Stats Section */}
          <div className="max-w-5xl mx-auto mb-12 pb-8 border-b border-slate-200 dark:border-neutral-800">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className={statClass}>Always Free</div>
                <div className={`${mutedClass} mt-1`}>Core Tools Included</div>
              </div>
              <div>
                <div className={statClass}>No Ads</div>
                <div className={`${mutedClass} mt-1`}>Clean Experience</div>
              </div>
              <div>
                <div className={statClass}>Open Source</div>
                <div className={`${mutedClass} mt-1`}>Built for Runners</div>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product Column */}
            <div>
              <h3 className={headingClass}>Free Tools</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/calculator" className={linkClass}>
                    Pace Calculator
                  </Link>
                </li>
                <li>
                  <Link to="/fuel" className={linkClass}>
                    Fuel Planner
                  </Link>
                </li>
                <li>
                  <Link to="/elevation-finder" className={linkClass}>
                    Elevation Finder
                  </Link>
                </li>
                <li>
                  <Link to="/vdot" className={linkClass}>
                    VDOT Calculator
                  </Link>
                </li>
                <li>
                  <Link to="/plan" className={linkClass}>
                    Training Plan Generator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className={headingClass}>Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/blog" className={linkClass}>
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/race" className={linkClass}>
                    Races
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className={linkClass}>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/about" className={linkClass}>
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link to="/mcp" className={linkClass}>
                    MCP Server for AI Agents
                  </Link>
                </li>
                <li>
                  <a href="mailto:alex@trainpace.com" className={linkClass}>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className={headingClass}>Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className={linkClass}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={linkClass}>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className={headingClass}>Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className={linkClass}>
                    About
                  </Link>
                </li>
                <li>
                  <a href="mailto:alex@trainpace.com" className={linkClass}>
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:alex@trainpace.com?subject=Feedback"
                    className={linkClass}
                  >
                    Feedback
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-200 dark:border-neutral-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className={`${mutedClass} text-center md:text-left`}>
                Built by a{" "}
                <Link
                  to="/about"
                  className="text-slate-900 hover:text-emerald-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded dark:text-white dark:hover:text-emerald-400 dark:focus:ring-offset-neutral-950"
                  aria-label="Read about the TrainPace story"
                >
                  runner
                </Link>{" "}
                for runners. © {currentYear} TrainPace. All rights reserved.
              </p>

              <div className="flex items-center gap-6">
                <p className={mutedClass}>
                  Questions?{" "}
                  <a
                    href="mailto:alex@trainpace.com"
                    className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Get in touch
                  </a>
                </p>
                <a
                  href="https://www.tinylaunch.com/launch/8134"
                  target="_blank"
                  rel="noopener"
                >
                  <img
                    src="https://tinylaunch.com/tinylaunch_badge_featured_on.svg"
                    alt="TinyLaunch Badge"
                    style={{
                      width: 202,
                      height: "auto",
                    }}
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Optional: Tagline/Mission */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Science-backed training tools. No ads. Free to start.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
