"use client";

import { useRef, useState } from "react";
import {
  CalendarDays,
} from "lucide-react";
import SettingsMenu from "./SettingsMenu";
import SortMenu from "./SortMenu";
import FilterMenu from "./Filter/FilterMenu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { type DateRange } from "react-day-picker";
import RangeCalendar from "./MailCalendar/RangeCalendar";

type SortOption = "showRead" | "showUnreadFirst" | "showSnoozed" | null;

interface MailHeaderProps {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  selectedDateRange: { start: Date | null; end: Date | null };
  setSelectedDateRange: (range: { start: Date | null; end: Date | null }) => void;
  isCalendarActive: boolean;
  selectedFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

export default function MailHeader({ sortOption, setSortOption, selectedDateRange, setSelectedDateRange, isCalendarActive, selectedFilters, onFiltersChange }: MailHeaderProps) {
  // const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const isFilterActive = selectedFilters.length > 0;

  return (
    <header className="flex items-center justify-between border-b border-[#8E8E93] bg-white h-9">
      {/* LEFT SECTION → Mail list header (fixed 390px) */}
      <div className="flex items-center justify-between w-97.5 px-4">
        {/* Left aligned title */}
        {/* <h1 className="text-lg font-semibold text-[#001F3F] p-0">Inbox</h1> */}
        <h1 className="text-lg font-semibold text-[#001F3F] p-0 pl-5">Inbox</h1>

        {/* Right aligned icons */}
        <div className="flex items-center gap-1">
          <Popover
            open={calendarOpen}
            onOpenChange={(open) => {
              setCalendarOpen(open);
              if (open) {
                // Reset existing range when reopening calendar
                setSelectedDateRange({ start: null, end: null });
                setIsSelectingStart(true);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 transition cursor-pointer ${isCalendarActive ? "bg-[#001F3F] hover:bg-[#001F3F]/90" : ""}`}
              >
                <CalendarDays
                  style={{ color: isCalendarActive ? "white" : "#8E8E93" }}
                  strokeWidth={2.5}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-auto p-0 border rounded-xl shadow-md">
              <RangeCalendar
                value={{
                  from: selectedDateRange.start ?? undefined,
                  to: selectedDateRange.end ?? undefined,
                }}
                onChange={(range) => {
                  setSelectedDateRange({
                    start: range?.from ?? null,
                    end: range?.to ?? null,
                  });
                }}
              />
            </PopoverContent>
          </Popover>

          <FilterMenu
            selectedFilters={selectedFilters}
            onChange={onFiltersChange}
            iconColor={isFilterActive ? "#001F3F" : "#8E8E93"}
          />

          {/* Fixed: Pass props to SortMenu */}
          <SortMenu sortOption={sortOption} setSortOption={setSortOption} />
        </div>
      </div>

      {/* RIGHT SECTION --> Global actions */}
      <div className="flex items-center gap-5 pr-4">
        <SettingsMenu />
      </div>
    </header>
  );
}
