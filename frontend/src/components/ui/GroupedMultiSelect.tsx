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

export interface GroupedMultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectSubgroup {
  label: string;
  options: GroupedMultiSelectOption[];
}

export interface MultiSelectGroup {
  label: string;
  options?: GroupedMultiSelectOption[];
  subgroups?: MultiSelectSubgroup[];
}

interface GroupedMultiSelectProps {
  groups: MultiSelectGroup[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function GroupedMultiSelect({
  groups,
  selected,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado.",
  className,
}: GroupedMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(
    () =>
      groups.flatMap((group) => [
        ...(group.options ?? []),
        ...(group.subgroups?.flatMap((subgroup) => subgroup.options) ?? []),
      ]),
    [groups],
  );

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const toggleMany = (values: string[]) => {
    const allSelected = values.length > 0 && values.every((val) => selected.includes(val));
    if (allSelected) {
      onChange(selected.filter((val) => !values.includes(val)));
      return;
    }
    onChange([...new Set([...selected, ...values])]);
  };

  const handleSelectGroup = (groupLabel: string) => {
    const group = groups.find((g) => g.label === groupLabel);
    const values = [
      ...(group?.options?.map((o) => o.value) ?? []),
      ...(group?.subgroups?.flatMap((sg) => sg.options.map((o) => o.value)) ?? []),
    ];
    toggleMany(values);
  };

  const handleSelectSubgroup = (groupLabel: string, subgroupLabel: string) => {
    const group = groups.find((g) => g.label === groupLabel);
    const subgroup = group?.subgroups?.find((sg) => sg.label === subgroupLabel);
    toggleMany(subgroup?.options.map((o) => o.value) ?? []);
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
    (value) => allOptions.find((opt) => opt.value === value)?.label || value
  );

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal min-h-[40px] h-auto p-2 pr-10",
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            <div className="flex flex-wrap gap-1 items-center flex-1 overflow-hidden mr-2">
              {selected.length === 0 ? (
                <span>{placeholder}</span>
              ) : selected.length <= 3 ? (
                selectedLabels.map((label, index) => (
                  <span
                    key={selected[index]}
                    className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs flex items-center gap-1"
                  >
                    {label}
                    <span
                      role="button"
                      className="ml-1 cursor-pointer hover:text-destructive transition-colors"
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
            <CommandList className="max-h-[300px]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {groups.map((group) => {
                const hasSubgroups = (group.subgroups?.length ?? 0) > 0;
                const hasOptions = (group.options?.length ?? 0) > 0;

                return (
                  <React.Fragment key={group.label}>
                    <div className="px-2 py-2 text-[11px] font-bold tracking-wide text-muted-foreground flex items-center justify-between">
                      <span className="uppercase">{group.label}</span>
                      <button
                        type="button"
                        className="text-[10px] font-normal opacity-70 hover:opacity-100 hover:text-primary transition-colors"
                        onClick={() => handleSelectGroup(group.label)}
                      >
                        Marcar todos
                      </button>
                    </div>

                    {hasSubgroups &&
                      group.subgroups!.map((subgroup) => (
                        <React.Fragment key={`${group.label}::${subgroup.label}`}>
                          <CommandGroup
                            heading={
                              <div
                                className="flex items-center justify-between w-full cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSelectSubgroup(group.label, subgroup.label)}
                              >
                                <span>{subgroup.label}</span>
                                <span className="text-[10px] font-normal opacity-70">Marcar todos</span>
                              </div>
                            }
                          >
                            {subgroup.options.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => handleSelect(option.value)}
                              >
                                <div className="flex items-center flex-1">
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                                      selected.includes(option.value)
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50",
                                    )}
                                  >
                                    {selected.includes(option.value) && <Check className="h-3 w-3" />}
                                  </div>
                                  <span className="flex-1 truncate">{option.label}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                        </React.Fragment>
                      ))}

                    {!hasSubgroups && hasOptions && (
                      <React.Fragment>
                        <CommandGroup>
                          {group.options!.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => handleSelect(option.value)}
                            >
                              <div className="flex items-center flex-1">
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                                    selected.includes(option.value)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50",
                                  )}
                                >
                                  {selected.includes(option.value) && <Check className="h-3 w-3" />}
                                </div>
                                <span className="flex-1 truncate">{option.label}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                      </React.Fragment>
                    )}
                  </React.Fragment>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
