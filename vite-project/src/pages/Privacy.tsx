import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - TrainPace</title>
        <meta
          name="description"
          content="TrainPace privacy policy. Learn how we collect, use, and protect your data. We respect your privacy and never sell your information."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.trainpace.com/privacy" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TrainPace ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at trainpace.com (the "Service").
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using TrainPace, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Email address</strong> - For account authentication and communication</li>
              <li><strong>Name</strong> - Provided via Google OAuth or during registration</li>
              <li><strong>Authentication data</strong> - Managed securely through Firebase Authentication</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Usage Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect certain information when you use TrainPace:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Device information</strong> - Browser type, operating system, device type</li>
              <li><strong>Usage analytics</strong> - Pages visited, features used, time spent on the Service</li>
              <li><strong>IP address</strong> - For security and analytics purposes</li>
              <li><strong>Cookies and tracking technologies</strong> - For analytics via Google Analytics and Amplitude</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">GPX Files and Route Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you upload GPX files to ElevationFinder:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>GPX file content</strong> - Stored securely in Firebase Cloud Storage</li>
              <li><strong>Route metadata</strong> - Elevation data, distance, route names</li>
              <li><strong>Location data</strong> - Latitude/longitude coordinates from GPX files</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Note: You can use the Training Pace Calculator and Fuel Planner <strong>without creating an account</strong>. No data is stored for unauthenticated users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Authenticate your account and manage user sessions</li>
              <li>Store and retrieve your uploaded GPX files and saved routes</li>
              <li>Analyze usage patterns to improve features and user experience</li>
              <li>Send important updates about the Service (e.g., security notices, feature updates)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address technical issues or security threats</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>We do NOT:</strong> Sell your personal information, share your data with third-party advertisers, or use your information for marketing purposes without consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TrainPace uses the following third-party services that may collect information:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Firebase (Google)</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use Firebase Authentication for account management and Firebase Cloud Storage for GPX file storage. Firebase is governed by Google's Privacy Policy.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Google Analytics</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use Google Analytics to understand how users interact with TrainPace. Google Analytics may collect cookies and usage data. You can opt out using the Google Analytics Opt-out Browser Add-on.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Amplitude</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use Amplitude for product analytics to improve features and user experience.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Mapbox</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use Mapbox to display interactive maps in ElevationFinder. Mapbox may collect location data from GPX files you upload.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Vercel</h3>
                <p className="text-gray-700 leading-relaxed">
                  TrainPace is hosted on Vercel. Server logs may include IP addresses and request metadata.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We take data security seriously and implement industry-standard measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Encryption</strong> - All data transmitted to/from TrainPace is encrypted using HTTPS/TLS</li>
              <li><strong>Firebase Security Rules</strong> - GPX files and user data are protected by Firebase security rules</li>
              <li><strong>Authentication</strong> - Passwords are hashed and managed by Firebase Auth (we never store plain-text passwords)</li>
              <li><strong>Access controls</strong> - Only you can access your uploaded GPX files and saved routes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Data Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Access</strong> - Request a copy of your personal data</li>
              <li><strong>Correction</strong> - Update or correct inaccurate information</li>
              <li><strong>Deletion</strong> - Request deletion of your account and associated data</li>
              <li><strong>Export</strong> - Download your GPX files and route data</li>
              <li><strong>Opt-out</strong> - Disable analytics tracking (though this may affect functionality)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:alex@trainpace.com" className="text-blue-600 hover:underline">
                alex@trainpace.com
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your data for as long as your account is active or as needed to provide services:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Account data</strong> - Retained until you request deletion</li>
              <li><strong>GPX files</strong> - Stored indefinitely unless you delete them from your Dashboard</li>
              <li><strong>Analytics data</strong> - Aggregated and anonymized data may be retained for analysis</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              If you delete your account, we will delete your personal information and GPX files within 30 days, except where required by law to retain certain data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              TrainPace is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that we have collected data from a child under 13, we will delete it immediately. If you believe we have collected information from a child, please contact us at{" "}
              <a href="mailto:alex@trainpace.com" className="text-blue-600 hover:underline">
                alex@trainpace.com
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Users</h2>
            <p className="text-gray-700 leading-relaxed">
              TrainPace is hosted in the United States. If you are accessing the Service from outside the U.S., please be aware that your information may be transferred to, stored, and processed in the United States. By using TrainPace, you consent to the transfer of your information to the U.S.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. When we make changes, we will:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Update the "Last updated" date at the top of this page</li>
              <li>Notify you via email if the changes are significant</li>
              <li>Post a notice on the TrainPace homepage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Your continued use of TrainPace after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:alex@trainpace.com" className="text-blue-600 hover:underline">
                  alex@trainpace.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong>{" "}
                <a href="https://www.trainpace.com" className="text-blue-600 hover:underline">
                  www.trainpace.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              TrainPace was built by a runner for runners. We respect your privacy and are committed to transparency. We will <strong>never</strong> sell your data, show ads, or misuse your information. Our goal is to provide free, high-quality training tools while keeping your data safe and private.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              ← Back to TrainPace Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
