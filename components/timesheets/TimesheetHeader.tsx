"use client";

import { AlarmClockPlus, ClipboardClock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyTimesheetView, TimesheetTab } from "@/app/(pages)/timesheet/create/page";
import TimeSheetsSettings from "./TimeSheetSettings";
import { useEffect, useRef, useState } from "react";

interface Props {
    activeTab: TimesheetTab;
    onTabChange: (tab: TimesheetTab) => void;
    myView: MyTimesheetView;
    onMyViewChange: (view: MyTimesheetView) => void;
}

export function TimesheetHeader({ activeTab, onTabChange, myView, onMyViewChange }: Props) {
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [underlineStyle, setUnderlineStyle] = useState({
        width: 0,
        left: 0,
    });

    useEffect(() => {
        const indexMap = {
            teams: 0,
            my: 1,
            approvals: 2,
        };

        const index = indexMap[activeTab];
        const el = tabRefs.current[index];

        if (el) {
            setUnderlineStyle({
                width: el.offsetWidth,
                left: el.offsetLeft,
            });
        }
    }, [activeTab]);

    return (
        <div className="flex items-center justify-between bg-white px-6 py-1">
            {/* Left: Tabs */}
            <div className="relative flex gap-6">
                <Button
                    ref={(el) => { tabRefs.current[0] = el }}
                    variant="ghost"
                    onClick={() => onTabChange("teams")}
                    className={`px-0 text-sm font-medium bg-transparent hover:bg-transparent cursor-pointer ${activeTab === "teams" ? "text-[#001F3F]" : "text-[#8E8E93]"
                        }`}
                >
                    My Team's Timesheets
                </Button>

                <Button
                    ref={(el) => { tabRefs.current[1] = el }}
                    variant="ghost"
                    onClick={() => onTabChange("my")}
                    className={`px-0 text-sm font-medium bg-transparent hover:bg-transparent cursor-pointer ${activeTab === "my" ? "text-[#001F3F]" : "text-[#8E8E93]"
                        }`}
                >
                    My timesheet
                </Button>

                <Button
                    ref={(el) => { tabRefs.current[2] = el }}
                    variant="ghost"
                    onClick={() => onTabChange("approvals")}
                    className={`px-0 text-sm font-medium bg-transparent hover:bg-transparent cursor-pointer ${activeTab === "approvals" ? "text-[#001F3F]" : "text-[#8E8E93]"
                        }`}
                >
                    Approvals
                </Button>

                <div
                    className="absolute bottom-0 h-[2px] bg-[#001F3F] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                        width: underlineStyle.width,
                        transform: `translateX(${underlineStyle.left}px)`,
                    }}
                />
            </div>

            {/* Right side */}
            <div className="flex items-center">
                {/* Show these ONLY for "my" tab */}
                {activeTab === "my" && (
                    <div className="flex items-center gap-1 rounded-sm bg-gray-200 px-1 py-1">
                        <Button
                            variant="ghost"
                            className={`h-7.5 w-10 rounded-sm cursor-pointer ${myView === "timesheet"
                                ? "bg-[#001F3F] text-white hover:bg-[#001F3F] hover:text-white"
                                : "text-gray-500 hover:bg-gray-300"
                                }`}
                            onClick={() => onMyViewChange("timesheet")}
                        >
                            Day
                        </Button>

                        <Button
                            variant="ghost"
                            className={`h-7.5 w-12 rounded-sm cursor-pointer ${myView === "clipboard"
                                ? "bg-[#001F3F] text-white hover:bg-[#001F3F] hover:text-white"
                                : "text-gray-500 hover:bg-gray-300"
                                }`}
                            onClick={() => onMyViewChange("clipboard")}
                        >
                            Week
                        </Button>

                        <Button
                            variant="ghost"
                            className={`h-7.5 w-14 rounded-sm cursor-pointer ${myView === "month"
                                ? "bg-[#001F3F] text-white hover:bg-[#001F3F] hover:text-white"
                                : "text-gray-500 hover:bg-gray-300"
                                }`}
                            onClick={() => onMyViewChange("month")}
                        >
                            Month
                        </Button>
                    </div>
                )}

                <div className="ml-2">
                    <TimeSheetsSettings />
                </div>
            </div>
        </div>
    );
}
