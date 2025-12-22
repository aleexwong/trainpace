import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mb-12 pb-8 border-b border-slate-200">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-600">
                Always Free
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Core Tools Included
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-600">
                No Ads
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Clean Experience
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-600">
                Open Source
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Built for Runners
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Free Tools</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/calculator"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Pace Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/fuel"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Fuel Planner
                </Link>
              </li>
              <li>
                <Link
                  to="/elevationfinder"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  ElevationFinder
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/faq"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com?subject=Feedback"
                  className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                >
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 text-center md:text-left">
              Built by a{" "}
              <Link
                to="/about"
                className="text-slate-900 hover:text-emerald-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                aria-label="Read about the TrainPace story"
              >
                runner
              </Link>{" "}
              for runners. © {currentYear} TrainPace. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <p className="text-sm text-slate-600">
                Questions?{" "}
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Get in touch
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Optional: Tagline/Mission */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Science-backed training tools. No ads. Free to start.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
