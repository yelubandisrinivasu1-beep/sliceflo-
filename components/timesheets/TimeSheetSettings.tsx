"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "../ui/separator";

import { useTimesheetSettingsStore } from "@/stores/timesheet-settings.store";
import { useState } from "react";

export default function TimeSheetsSettings() {
  const {
    capacityType,
    hours,
    notifyBefore,
    setCapacityType,
    setHours,
    setNotifyBefore,
  } = useTimesheetSettingsStore();

  const [localCapacityType, setLocalCapacityType] = useState(capacityType);
  const [localHours, setLocalHours] = useState(hours);
  const [localNotifyBefore, setLocalNotifyBefore] = useState(notifyBefore);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setCapacityType(localCapacityType);
    setHours(localHours);
    setNotifyBefore(localNotifyBefore);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9.5 w-9.5 rounded-md border bg-[#E5E5EA] text-[#8E8E93]"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 bg-white border-0 border-b-[5px] border-[#001F3F] rounded-lg pb-3.5 p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-4">Configure</h3>

        <div className="space-y-6">
          {/* My capacity */}
          <div className="flex items-center justify-between">
            <Label>My capacity</Label>

            <div className="flex items-center gap-1 rounded-md bg-gray-200 px-1 py-1">
              <button
                onClick={() => setLocalCapacityType("daily")}
                className={`flex h-7.5 w-20 items-center justify-center rounded-md text-sm ${localCapacityType === "daily"
                  ? "bg-[#001F3F] text-white"
                  : "text-gray-500 hover:bg-gray-300"
                  }`}
              >
                Daily
              </button>

              <button
                onClick={() => setLocalCapacityType("weekly")}
                className={`flex h-7.5 w-20 items-center justify-center rounded-md text-sm ${localCapacityType === "weekly"
                  ? "bg-[#001F3F] text-white"
                  : "text-gray-500 hover:bg-gray-300"
                  }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-center justify-between">
            <Label>
              {localCapacityType === "daily" ? "Daily hours" : "Weekly hours"}
            </Label>

            <Input
              type="number"
              value={localHours}
              onChange={(e) => setLocalHours(e.target.value)}
              className="w-42 text-right"
            />
          </div>

          {/* Notify before */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Notify before</Label>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#E5E5EA] text-[#8E8E93]">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>

                  <TooltipContent
                    side="bottom"
                    className="bg-[#F2F2F7] p-2 rounded-md max-w-[220px] text-center"
                  >
                    <p className="text-sm text-[#8E8E93]">
                      When do you want to be notified to remind you to submit the
                      current week Timesheet.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Select
              value={localNotifyBefore}
              onValueChange={(value) =>
                setLocalNotifyBefore(value as "1hr" | "1day" | "1week")
              }
            >
              <SelectTrigger className="w-42">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1hr">1 hr</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
                <SelectItem value="1week">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="w-24">Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
