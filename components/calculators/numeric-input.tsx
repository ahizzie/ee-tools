"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitOption } from "@/lib/units";

type NumericInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  units?: UnitOption[];
  onUnitChange?: (unit: string) => void;
  placeholder?: string;
};

export function NumericInput({
  id,
  label,
  value,
  onChange,
  unit,
  units,
  onUnitChange,
  placeholder = "—",
}: NumericInputProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1"
        />
        {units && onUnitChange && unit ? (
          <Select
            value={unit}
            onValueChange={(next) => {
              if (next != null) onUnitChange(String(next));
            }}
          >
            <SelectTrigger className="w-[5.5rem] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : unit ? (
          <span className="flex h-8 items-center text-sm text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
