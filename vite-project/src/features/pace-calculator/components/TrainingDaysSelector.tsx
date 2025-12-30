/**
 * Training Days Selector Component
 * Multi-select dropdown for choosing preferred training days
 */

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";

interface TrainingDaysSelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function TrainingDaysSelector({
  selectedDays,
  onChange,
  disabled = false,
}: TrainingDaysSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const removeDay = (day: string) => {
    onChange(selectedDays.filter((d) => d !== day));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Calendar className="w-4 h-4 inline mr-1" />
        Training Days <span className="text-gray-400">(optional)</span>
      </label>

      {/* Selected Days Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent cursor-pointer ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {selectedDays.length === 0 ? (
            <span className="text-gray-400 text-sm py-0.5">
              Select your preferred training days
            </span>
          ) : (
            selectedDays.map((day) => (
              <span
                key={day}
                className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium"
              >
                {day.slice(0, 3)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) removeDay(day);
                  }}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`absolute right-3 top-[38px] w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-auto">
          <div className="p-2">
            {/* Clear All Button */}
            {selectedDays.length > 0 && (
              <button
                onClick={clearAll}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mb-1"
              >
                Clear All
              </button>
            )}

            {/* Day Options */}
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    isSelected
                      ? "bg-purple-100 text-purple-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{day}</span>
                    {isSelected && (
                      <span className="text-purple-600">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Select the days you prefer to train (e.g., Monday, Wednesday, Friday)
      </p>
    </div>
  );
}
