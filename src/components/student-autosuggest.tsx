import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore } from "@/lib/store";

/**
 * Auto-suggest combobox for picking a student by name, admission no. or roll.
 * `value` is a studentId or null (= "all students").
 */
export function StudentAutosuggest({
  value,
  onChange,
  placeholder = "All students",
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const students = useStore((s) => s.students);
  const programs = useStore((s) => s.programs);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const selected = value ? students.find((s) => s.id === value) ?? null : null;

  const matches = useMemo(() => {
    const t = debouncedQuery.trim().toLowerCase();
    const base = t
      ? students.filter((s) =>
          s.name.toLowerCase().includes(t) ||
          s.admissionNo.toLowerCase().includes(t) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(t)),
        )
      : students;
    return base.slice(0, 8);
  }, [students, debouncedQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("flex min-w-0 items-center gap-2 truncate", !selected && "text-muted-foreground")}>
            <Search className="h-3.5 w-3.5 shrink-0" />
            {selected ? `${selected.name} · ${selected.admissionNo}` : placeholder}
          </span>
          {selected ? (
            <X
              className="h-3.5 w-3.5 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, admission no. or roll…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No students found.</CommandEmpty>
            <CommandGroup>
              {matches.map((s) => {
                const prog = programs.find((p) => p.id === s.programId);
                return (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === s.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{s.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {s.admissionNo} · {prog?.code} · Sem {s.currentSemester}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
