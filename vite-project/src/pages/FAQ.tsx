import { useEffect, useState } from "react";
import { Hash, ChevronDown } from "lucide-react";
import FAQAccordion from "@/components/faq/FAQAccordion";
import faqData from "@/data/faq-data.json";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  emoji: string;
}

interface FAQSection {
  title: string;
  description: string;
  questions: FAQItem[];
}

export default function FAQ() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Generate anchor-friendly IDs from section titles
  const getSectionId = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle smooth scrolling to sections
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 180; // Account for fixed header (73px) + sticky nav (~107px)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Close dropdown on mobile after selection
      setIsDropdownOpen(false);
    }
  };

  // Track active section on scroll (optional - for visual feedback)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    faqData.sections.forEach((section) => {
      const element = document.getElementById(getSectionId(section.title));
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Get current section title for dropdown display
  const getActiveSectionTitle = () => {
    const section = faqData.sections.find(
      (s) => getSectionId(s.title) === activeSection
    );
    return section?.title || "Select a section";
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <section className="py-12 px-6 text-center bg-blue-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about TrainPace and ElevationFinder
          </p>
        </div>
      </section>

      {/* Quick Jump Navigation */}
      <section className="sticky top-[71px] z-[999] bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">
              Jump to:
            </span>
          </div>

          {/* Desktop: Pill buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
            {faqData.sections.map((section, index) => {
              const sectionId = getSectionId(section.title);
              const isActive = activeSection === sectionId;

              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow"
                    }
                  `}
                >
                  {section.title}
                </button>
              );
            })}
          </div>

          {/* Mobile/Tablet: Dropdown */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-300 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {getActiveSectionTitle()}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop for closing dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown menu */}
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                  {faqData.sections.map((section, index) => {
                    const sectionId = getSectionId(section.title);
                    const isActive = activeSection === sectionId;

                    return (
                      <button
                        key={index}
                        onClick={() => scrollToSection(sectionId)}
                        className={`
                          w-full px-4 py-3 text-left text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                              : "bg-white text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                          }
                        `}
                      >
                        {section.title}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        {faqData.sections.map((section: FAQSection, sectionIndex: number) => {
          const sectionId = getSectionId(section.title);

          return (
            <div
              key={sectionIndex}
              id={sectionId}
              className="mb-16 scroll-mt-[180px]"
            >
              {/* Section Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-900">
                  {section.title}
                </h2>
                <p className="text-gray-600 text-lg">{section.description}</p>
              </div>

              <FAQAccordion items={section.questions} />
            </div>
          );
        })}
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-4xl mb-4">❓</div>
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-700 mb-8 text-lg">
            Can't find what you're looking for? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://instagram.com/trainpace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="mr-2">📱</span>
              Contact on Instagram
            </a>
            <a
              href="/calculator"
              className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <span className="mr-2">🧮</span>
              Try the Calculator
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
