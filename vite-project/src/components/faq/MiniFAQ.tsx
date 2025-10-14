import { Link } from "react-router-dom";
import FAQAccordion from "@/components/faq/FAQAccordion";
import faqData from "@/data/faq-data.json";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  emoji: string;
}

export default function MiniFAQ() {
  // Get first 5 questions from the first section (Getting Started)
  const topQuestions: FAQItem[] = faqData.sections
    .slice(0, 2) // Getting Started + Pace Calculator sections
    .flatMap((section) => section.questions)
    .slice(0, 5);

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Quick Answers
          </h2>
          <p className="text-gray-600 text-lg">
            Get started with TrainPace — frequently asked questions
          </p>
        </div>

        <FAQAccordion items={topQuestions} />

        <div className="text-center mt-8">
          <Link
            to="/faq"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            View All FAQs
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
