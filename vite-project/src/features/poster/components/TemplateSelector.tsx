/**
 * Template Selector Component
 * Color template selection for poster customization
 */

import { TEMPLATE_COLORS } from "../types";

interface TemplateSelectorProps {
  selectedTemplate: number;
  onSelectTemplate: (index: number) => void;
  onDataChange?: () => void;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  onDataChange,
}: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TEMPLATE_COLORS.slice(1).map((template, index) => {
        const actualIndex = index + 1;
        return (
          <button
            key={template.name}
            onClick={() => {
              onSelectTemplate(actualIndex);
              onDataChange?.();
            }}
            className={`
              relative h-16 rounded-lg border-2 transition-all
              ${
                selectedTemplate === actualIndex
                  ? "border-blue-500 ring-2 ring-blue-200 scale-105"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
            style={{ backgroundColor: template.bg }}
          >
            <div
              className="absolute inset-2 rounded-md"
              style={{
                backgroundColor: template.route,
                opacity: 0.7,
              }}
            />
            <span className="absolute bottom-0 left-0 right-0 text-[10px] font-medium text-center bg-black bg-opacity-60 text-white rounded-b-lg py-1">
              {template.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
