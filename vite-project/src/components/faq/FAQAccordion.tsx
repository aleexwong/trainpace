import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  emoji: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  defaultOpen?: boolean;
}

export default function FAQAccordion({
  items,
  defaultOpen = false,
}: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    defaultOpen ? new Set(items.map((item) => item.id)) : new Set()
  );

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
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        const answerId = `faq-answer-${item.id}`;

        return (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              aria-controls={answerId}
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
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                )}
              </div>
            </button>

            {isOpen && (
              <div
                id={answerId}
                role="region"
                aria-labelledby={`faq-question-${item.id}`}
                className="px-6 pb-5 bg-gradient-to-r from-blue-50 to-white"
              >
                <div className="pl-11">
                  <p className="text-left text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
