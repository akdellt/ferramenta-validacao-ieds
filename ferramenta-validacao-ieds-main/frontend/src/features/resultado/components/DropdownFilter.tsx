import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface DropdownFilterProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  placeholder?: string;
}

function DropdownFilter({
  options,
  selected,
  onSelect,
  placeholder = "Selecionar IED",
}: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    if (selected === option) {
      onSelect(null);
    } else {
      onSelect(option);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full min-w-60" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-12 w-full cursor-pointer items-center justify-between rounded-t-lg border-2 bg-white px-4 transition-all duration-200 ${isOpen ? "border-eq-primary ring-2 ring-blue-100" : "hover:border-eq-primary border-eq-border"} `}
      >
        <span
          className={`text-base font-semibold uppercase ${selected ? "text-primary" : "text-secondary"}`}
        >
          {selected || placeholder}
        </span>

        <ChevronDown
          size={20}
          className={`text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 border-eq-border absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border bg-white shadow-xl duration-200">
          <ul className="max-h-60 overflow-y-auto py-1">
            <li
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className="border-eq-border text-secondary cursor-pointer border-b px-4 py-2.5 text-base hover:bg-blue-50"
            >
              Mostrar Todos
            </li>

            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-base transition-colors hover:bg-blue-50 ${selected === option ? "text-primary bg-bg-secondary font-semibold" : "text-secondary"} `}
              >
                {option}
                {selected === option && (
                  <Check size={16} className="text-primary" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DropdownFilter;
