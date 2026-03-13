"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, CheckCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado.",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((opt) => opt.value));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = selected.map(
    (value) => options.find((opt) => opt.value === value)?.label || value
  );

  const allSelected = options.length > 0 && selected.length === options.length;

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal min-h-[40px] h-auto p-2 pr-10", // Added padding right for buttons
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            <div className="flex flex-wrap gap-1 items-center flex-1 overflow-hidden mr-2">
              {selected.length === 0 ? (
                <span>{placeholder}</span>
              ) : selected.length <= 2 ? (
                selectedLabels.map((label, index) => (
                  <span
                    key={selected[index]}
                    className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs flex items-center gap-1"
                  >
                    {label}
                    <span
                      role="button"
                      className="ml-1 cursor-pointer hover:text-destructive transition-colors"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleRemove(selected[index], e)}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                ))
              ) : (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                  {selected.length} selecionados
                </span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={handleSelectAll} className="text-primary font-medium">
                  <CheckCheck className="mr-2 h-4 w-4" /> Selecionar todos
                </CommandItem>
                <CommandItem onSelect={handleDeselectAll} className="text-muted-foreground" disabled={selected.length === 0}>
                  <XCircle className="mr-2 h-4 w-4" /> Desmarcar todos
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option.value} value={option.value} onSelect={() => handleSelect(option.value)}>
                    <div className="flex items-center flex-1">
                      <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0", selected.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                        {selected.includes(option.value) && <Check className="h-3 w-3" />}
                      </div>
                      <span className="flex-1 truncate">{option.label}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear Button - Outside Trigger to avoid event interference */}
      {selected.length > 0 && (
        <span
          role="button"
          tabIndex={0}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer group z-20"
          onClick={handleClearAll}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClearAll(e as any); }}
        >
          <X className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
        </span>
      )}
    </div>
  );
}
