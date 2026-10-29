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
            className="border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              aria-controls={answerId}
              className="w-full px-6 py-5 text-left bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl" role="img" aria-label="emoji">
                  {item.emoji}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  {item.question}
                </h3>
              </div>
              <div className="flex-shrink-0 ml-4">
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-neutral-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200" />
                )}
              </div>
            </button>

            {isOpen && (
              <div
                id={answerId}
                role="region"
                aria-labelledby={`faq-question-${item.id}`}
                className="px-6 pb-5 bg-gradient-to-r from-emerald-50 dark:from-neutral-950 to-white dark:to-neutral-950"
              >
                <div className="pl-11">
                  <p className="text-left text-gray-700 dark:text-neutral-300 leading-relaxed">
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
