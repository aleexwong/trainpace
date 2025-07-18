import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Header */}
      <section className="py-20 px-6 text-center bg-blue-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about TrainPace and ElevationFinder
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        {faqData.sections.map((section: FAQSection, sectionIndex: number) => (
          <div key={sectionIndex} className="mb-16">
            {/* Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                {section.title}
              </h2>
              <p className="text-gray-600 text-lg">{section.description}</p>
            </div>

            <div className="space-y-3 text-left">
              {section.questions.map((item: FAQItem) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl" role="img" aria-label="emoji">
                        {item.emoji}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {item.question}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {openItems.has(item.id) ? (
                        <ChevronUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                      )}
                    </div>
                  </button>

                  {openItems.has(item.id) && (
                    <div className="px-6 pb-5 bg-gradient-to-r from-blue-50 to-white">
                      <div className="pl-11">
                        <p className="text-gray-700 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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
