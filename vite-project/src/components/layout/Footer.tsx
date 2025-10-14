import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/calculator"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Pace Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/fuel"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Fuel Planner
                </Link>
              </li>
              <li>
                <Link
                  to="/elevationfinder"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  ElevationFinder
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/faq"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/ethos"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Our Ethos
                </Link>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/ethos"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com?subject=Feedback"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 text-center md:text-left">
              Built by a{" "}
              <Link
                to="/ethos"
                className="text-gray-900 hover:text-blue-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Read the TrainPace ethos"
              >
                runner
              </Link>{" "}
              for runners. © {currentYear} TrainPace. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <p className="text-sm text-gray-600">
                Questions?{" "}
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Get in touch
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Optional: Tagline/Mission */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Science-backed training tools. No ads. No paywalls. 100% free forever.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
