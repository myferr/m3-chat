"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
type InputOption = {
  label: string;
  value: string;
  icon?: React.ElementType;
};

type ComboboxProps = {
  inputs: InputOption[];
  onSelect?: (val: string) => void;
};

export function Combobox({ inputs, onSelect }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>(inputs[0]?.value ?? "");

  const selectedOption = inputs.find((input) => input.value === value);

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    setOpen(false);
    onSelect?.(currentValue); // ✅ Call the callback if provided
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          <div className="flex items-center gap-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4" />
            )}
            {selectedOption?.label ?? "Select input..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search model..." className="h-9" />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {inputs.map((input) => (
                <CommandItem
                  key={input.value}
                  value={input.value}
                  onSelect={() => handleSelect(input.value)}
                  className="flex items-center gap-2"
                >
                  {input.icon && <input.icon className="h-4 w-4" />}
                  {input.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === input.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
