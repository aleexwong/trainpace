import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mb-12 pb-8 border-b">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                Always Free
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Core Tools Included
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                No Ads
              </div>
              <div className="text-sm text-muted-foreground mt-1">Clean Experience</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                Open Source
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Built for Runners
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/calculator"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Pace Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/fuel"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Fuel Planner
                </Link>
              </li>
              <li>
                <Link
                  to="/elevationfinder"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  ElevationFinder
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/faq"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:alex@trainpace.com?subject=Feedback"
                  className="text-muted-foreground hover:text-blue-600 transition-colors text-sm"
                >
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Built by a{" "}
              <Link
                to="/about"
                className="text-foreground hover:text-blue-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Read about the TrainPace story"
              >
                runner
              </Link>{" "}
              for runners. © {currentYear} TrainPace. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
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
            Science-backed training tools. No ads. Free to start.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
