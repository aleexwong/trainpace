import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - TrainPace</title>
        <meta
          name="description"
          content="TrainPace Terms of Service. Read our terms and conditions for using TrainPace's free training tools, calculators, and elevation analysis."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.trainpace.com/terms" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-6">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to TrainPace. By accessing or using our website at
              trainpace.com (the "Service"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms,
              please do not use the Service.
            </p>
            <p className="text-gray-700 leading-normal">
              These Terms constitute a legally binding agreement between you and
              TrainPace ("we," "us," or "our"). We reserve the right to modify
              these Terms at any time. Your continued use of the Service after
              changes are posted constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Description of Service
            </h2>
            <p className="text-gray-700 leading-normal mb-2">
              TrainPace is a free web application that provides running training
              tools, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>
                <strong>Training Pace Calculator</strong> - Calculate training
                zones from race times
              </li>
              <li>
                <strong>ElevationFinder</strong> - Upload and analyze GPX files
                with elevation profiles
              </li>
              <li>
                <strong>Race Fuel Planner</strong> - Calculate nutrition needs
                for races
              </li>
              <li>
                <strong>Dashboard</strong> - Save and manage routes (requires
                account)
              </li>
            </ul>
            <p className="text-gray-700 leading-normal">
              The Service is provided free of charge and without warranty. We
              reserve the right to modify, suspend, or discontinue any aspect of
              the Service at any time without notice.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">User Accounts</h2>

            <h3 className="text-lg font-semibold mb-2 mt-4">
              Account Creation
            </h3>
            <p className="text-gray-700 leading-normal mb-2">
              To use certain features (ElevationFinder with saved routes,
              Dashboard), you must create an account. You can register using:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>Email and password</li>
              <li>Google OAuth authentication</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 mt-4">
              Account Responsibilities
            </h3>
            <p className="text-gray-700 leading-normal mb-2">You agree to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>
                Provide accurate and complete information during registration
              </li>
              <li>Maintain the security of your account credentials</li>
              <li>
                Notify us immediately of any unauthorized access to your account
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account
              </li>
              <li>
                Not share your account with others or create multiple accounts
              </li>
            </ul>
            <p className="text-gray-700 leading-normal">
              We reserve the right to suspend or terminate accounts that violate
              these Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
            <p className="text-gray-700 leading-normal mb-2">
              You agree to use TrainPace only for lawful purposes. You must NOT:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>Upload malicious files, viruses, or harmful code</li>
              <li>
                Attempt to gain unauthorized access to our systems or other
                users' accounts
              </li>
              <li>
                Use automated tools (bots, scrapers) to access the Service
                without permission
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract source code
              </li>
              <li>
                Upload GPX files containing illegal content or violating
                third-party rights
              </li>
              <li>
                Interfere with the Service's operation or other users'
                experience
              </li>
              <li>
                Impersonate others or misrepresent your affiliation with any
                person or entity
              </li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
            <p className="text-gray-700 leading-normal">
              Violation of these terms may result in immediate account
              termination and legal action if necessary.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              User Content and GPX Files
            </h2>

            <h3 className="text-lg font-semibold mb-2 mt-4">Ownership</h3>
            <p className="text-gray-700 leading-normal mb-2">
              You retain all rights to the GPX files and content you upload to
              TrainPace. By uploading content, you grant us a limited license
              to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>Store your GPX files securely in Firebase Cloud Storage</li>
              <li>Process and display elevation data on interactive maps</li>
              <li>
                Enable you to share route links with others (if you choose to
                share)
              </li>
            </ul>
            <p className="text-gray-700 leading-normal">
              This license terminates when you delete your content or account.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-4">
              Content Responsibility
            </h3>
            <p className="text-gray-700 leading-normal mb-2">
              You are solely responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>The accuracy and legality of uploaded GPX files</li>
              <li>
                Ensuring you have the right to upload and share the content
              </li>
              <li>Any consequences resulting from sharing routes publicly</li>
            </ul>
            <p className="text-gray-700 leading-normal">
              We do not claim ownership of your content and do not monitor or
              review uploaded files unless required by law or to investigate
              violations of these Terms.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-4">Content Removal</h3>
            <p className="text-gray-700 leading-normal">
              We reserve the right to remove content that violates these Terms
              or applicable laws, without notice.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Intellectual Property
            </h2>
            <p className="text-gray-700 leading-normal mb-2">
              The TrainPace Service, including its design, code, features, and
              branding, is owned by TrainPace and protected by copyright,
              trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-normal mb-2">You may not:</p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>Copy, modify, or distribute the Service's code or design</li>
              <li>
                Use TrainPace branding, logos, or trademarks without permission
              </li>
              <li>Create derivative works based on the Service</li>
            </ul>
            <p className="text-gray-700 leading-normal">
              We grant you a limited, non-exclusive, non-transferable license to
              access and use the Service for personal, non-commercial purposes.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 leading-normal mb-2 uppercase font-semibold">
              Important: Please read this section carefully.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT
              PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>
                Warranties of merchantability, fitness for a particular purpose,
                and non-infringement
              </li>
              <li>
                That the Service will be uninterrupted, error-free, or secure
              </li>
              <li>
                That results obtained from the Service will be accurate or
                reliable
              </li>
              <li>That defects will be corrected</li>
            </ul>
            <p className="text-gray-700 leading-normal bg-yellow-50 p-4 rounded-lg">
              <strong>Training and Medical Disclaimer:</strong> TrainPace
              provides training calculations and recommendations based on
              established exercise science formulas. However, these are general
              guidelines and may not be suitable for everyone. We are not
              medical professionals, and the Service does not provide medical
              advice. Consult a qualified healthcare provider before starting
              any training program, especially if you have pre-existing health
              conditions. Use the Service at your own risk.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-normal mb-2 uppercase font-semibold">
              Important: Please read this section carefully.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, TRAINPACE AND ITS CREATOR
              SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>
                Any indirect, incidental, consequential, or punitive damages
              </li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>
                Injuries, health issues, or damages resulting from following
                training recommendations
              </li>
              <li>
                Errors or inaccuracies in calculations, elevation data, or route
                analysis
              </li>
              <li>
                Unauthorized access to your account or data breaches (though we
                implement security measures)
              </li>
              <li>Service interruptions, downtime, or loss of functionality</li>
            </ul>
            <p className="text-gray-700 leading-normal mb-2">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED $100 USD OR THE
              AMOUNT YOU PAID TO USE THE SERVICE (WHICH IS $0, AS THE SERVICE IS
              FREE).
            </p>
            <p className="text-gray-700 leading-normal">
              Some jurisdictions do not allow limitations on implied warranties
              or liability for incidental/consequential damages, so the above
              limitations may not apply to you.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Indemnification</h2>
            <p className="text-gray-700 leading-normal">
              You agree to indemnify, defend, and hold harmless TrainPace and
              its creator from any claims, damages, losses, liabilities, and
              expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1 mt-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>
                Your violation of any third-party rights (e.g., uploading
                copyrighted GPX files)
              </li>
              <li>
                Any injuries or damages resulting from following training
                recommendations
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <p className="text-gray-700 leading-normal mb-2">
              TrainPace integrates with third-party services, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>
                <strong>Firebase (Google)</strong> - Authentication and file
                storage
              </li>
              <li>
                <strong>Mapbox</strong> - Interactive maps and elevation
                rendering
              </li>
              <li>
                <strong>Google Analytics</strong> - Usage analytics
              </li>
              <li>
                <strong>Vercel</strong> - Hosting infrastructure
              </li>
            </ul>
            <p className="text-gray-700 leading-normal">
              These third-party services have their own terms and privacy
              policies. We are not responsible for their practices or
              availability. By using TrainPace, you acknowledge that we rely on
              these services and are not liable for any issues arising from
              them.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Termination</h2>
            <p className="text-gray-700 leading-normal mb-2">
              We reserve the right to suspend or terminate your account and
              access to the Service at any time, with or without cause, with or
              without notice.
            </p>
            <p className="text-gray-700 leading-normal mb-2">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>Deleting your account through the Settings page</li>
              <li>
                Contacting us at{" "}
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-blue-600 hover:underline"
                >
                  alex@trainpace.com
                </a>
              </li>
            </ul>
            <p className="text-gray-700 leading-normal">
              Upon termination, your right to access the Service ceases
              immediately. We will delete your data in accordance with our{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Governing Law and Disputes
            </h2>
            <p className="text-gray-700 leading-normal mb-2">
              These Terms are governed by the laws of the United States, without
              regard to conflict of law principles.
            </p>
            <p className="text-gray-700 leading-normal mb-2">
              Any disputes arising from these Terms or the Service shall be
              resolved through:
            </p>
            <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1">
              <li>Good-faith negotiation between the parties</li>
              <li>
                If negotiation fails, binding arbitration under the rules of the
                American Arbitration Association
              </li>
            </ol>
            <p className="text-gray-700 leading-normal">
              You agree to resolve disputes individually and waive any right to
              participate in class-action lawsuits or class-wide arbitration.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Changes to These Terms
            </h2>
            <p className="text-gray-700 leading-normal mb-2">
              We may update these Terms from time to time. When we make changes,
              we will:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>Update the "Last updated" date at the top of this page</li>
              <li>Notify users via email if changes are material</li>
              <li>
                Post a notice on the TrainPace homepage for significant changes
              </li>
            </ul>
            <p className="text-gray-700 leading-normal">
              Your continued use of TrainPace after changes are posted
              constitutes acceptance of the updated Terms. If you do not agree
              to the new Terms, you must stop using the Service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Severability</h2>
            <p className="text-gray-700 leading-normal">
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision will be limited or eliminated to the
              minimum extent necessary, and the remaining provisions will remain
              in full force and effect.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Entire Agreement</h2>
            <p className="text-gray-700 leading-normal">
              These Terms, together with our{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              , constitute the entire agreement between you and TrainPace
              regarding the Service and supersede all prior agreements and
              understandings.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-gray-700 leading-normal mb-3">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:alex@trainpace.com"
                  className="text-blue-600 hover:underline"
                >
                  alex@trainpace.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong>{" "}
                <a
                  href="https://www.trainpace.com"
                  className="text-blue-600 hover:underline"
                >
                  www.trainpace.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
            <p className="text-gray-700 leading-normal">
              TrainPace was built by a runner for runners. Our goal is to
              provide free, high-quality training tools without ads, paywalls,
              or BS. We believe every runner deserves access to science-backed
              training resources. If you have feedback or feature requests, we'd
              love to hear from you at{" "}
              <a
                href="mailto:alex@trainpace.com"
                className="text-blue-600 hover:underline"
              >
                alex@trainpace.com
              </a>
              .
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              ← Back to TrainPace Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
