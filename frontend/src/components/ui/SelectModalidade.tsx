"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface SelectModalidadeProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  options?: string[];
}

const DEFAULT_OPTIONS = ["MAR", "AER", "ROD"];

export function SelectModalidadeMulti({
  value = [],
  onChange,
  label = "Modalidade",
  placeholder = "Selecione a modalidade",
  options = DEFAULT_OPTIONS,
}: SelectModalidadeProps) {
  const [open, setOpen] = useState(false);
  const [popoverWidth, setPopoverWidth] = useState<number>();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, []);

  const toggleValue = (item: string) => {
    const newValue = value.includes(item)
      ? value.filter((v) => v !== item)
      : [...value, item];
    onChange(newValue);
  };

  const removeValue = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  const clearAll = () => onChange([]);

  const handleBadgeClick = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    removeValue(item);
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAll();
  };

  return (
    <div className="w-full">
      <Label className="text-sm font-medium">{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={triggerRef}
          asChild
        >
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={label}
            className={cn(
              "w-full min-h-[36px] px-3 border rounded-md",
              "flex items-center mt-1 gap-2 cursor-pointer text-left",
              "bg-background hover:bg-accent/40 transition border-input",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div className="flex flex-wrap gap-1 items-center flex-1">
              {value.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  {placeholder}
                </span>
              ) : (
                value.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="px-2 py-0.5 flex items-center gap-1 rounded-md"
                  >
                    {item}
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => handleBadgeClick(e, item)}
                      className="hover:bg-secondary-foreground/20 rounded-sm transition cursor-pointer"
                      aria-label={`Remover ${item}`}
                    >
                      <X size={12} />
                    </span>
                  </Badge>
                ))
              )}
            </div>

            {value.length > 0 && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClearClick}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition shrink-0"
                aria-label="Limpar todas as seleções"
              >
                <X size={16} />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0"
          style={{ width: popoverWidth }}
          align="start"
        >
          <Command>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => {
                const isSelected = value.includes(item);
                return (
                  <CommandItem
                    key={item}
                    onSelect={() => toggleValue(item)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "w-4 h-4 transition",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}