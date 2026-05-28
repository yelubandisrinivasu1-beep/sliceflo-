"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type SortOption = "showRead" | "showUnreadFirst" | "showSnoozed" | null;

interface SortMenuProps {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  iconColor?: string;
}

export default function SortMenu({
  sortOption,
  setSortOption,
  iconColor = "#8E8E93",
}: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const isActive = sortOption !== null;

  const renderMenuItem = (label: string, value: SortOption) => {
    const isSelected = sortOption === value;

    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-none cursor-pointer px-3 py-2 text-xs transition-colors",
          isSelected
            ? "border-l-4 border-[#001F3F] bg-muted/40 text-[#001F3F]"
            : "hover:bg-muted"
        )}
        onClick={() => {
          setSortOption(isSelected ? null : value);
          setOpen(false);
        }}
      >
        <span>{label}</span>

        {isSelected && (
          <Button
            size="icon"
            variant="ghost"
            className="w-5 h-5 ml-2 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setSortOption(null);
              setOpen(false);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Sort"
          className={cn(
            "relative h-8 w-8 rounded-md transition-all duration-200",
            isActive
              ? "bg-[#001F3F] text-white shadow-sm hover:bg-[#001F3F] hover:text-[#8E8E93]"
              : "text-[#8E8E93] hover:bg-gray-100"
          )}
        >
          <ArrowUpDown className="h-4 w-4" strokeWidth={2.5} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-45 text-xs border-0 border-b-[5px] border-[#001F3F] rounded shadow-md mt-1"
      >
        {renderMenuItem("Show read", "showRead")}
        {renderMenuItem("Show unread first", "showUnreadFirst")}
        {/* {renderMenuItem("Show snoozed", "showSnoozed")} */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}