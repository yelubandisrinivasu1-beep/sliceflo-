"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle2, Tag } from "lucide-react";

interface CycleRightPanelProps {
    isEmpty: boolean;
}

export function CycleRightPanel({ isEmpty }: CycleRightPanelProps) {
    return (
        <div className="w-[360px] flex-none bg-white border-l border-gray-200 flex flex-col p-4 space-y-4">
            <Tabs defaultValue="assignees" className="w-full flex flex-col flex-1">
                <TabsList className="w-full grid grid-cols-2 bg-[#F2F4F7] h-9 p-1 rounded-lg">
                    <TabsTrigger
                        value="assignees"
                        className="text-xs font-semibold rounded-md transition-all
                            data-[state=active]:bg-[#001F3F] data-[state=active]:text-white data-[state=active]:shadow-sm
                            data-[state=inactive]:text-gray-500 data-[state=inactive]:bg-transparent"
                    >
                        Assignees
                    </TabsTrigger>
                    <TabsTrigger
                        value="labels"
                        className="text-xs font-semibold rounded-md transition-all
                            data-[state=active]:bg-[#001F3F] data-[state=active]:text-white data-[state=active]:shadow-sm
                            data-[state=inactive]:text-gray-500 data-[state=inactive]:bg-transparent"
                    >
                        Labels
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assignees" className="flex-1 flex flex-col items-center justify-center mt-0 pt-0">
                    <div className="flex-1 w-full flex items-center justify-center">
                        <div className="w-40 h-40 border border-gray-100 rounded-3xl flex items-center justify-center bg-white shadow-gray-400">
                            <UserCircle2 className="h-16 w-16 text-gray-200" strokeWidth={1} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="labels" className="flex-1 flex flex-col items-center justify-center mt-0 pt-0">
                    <div className="flex-1 w-full flex items-center justify-center">
                        <div className="w-40 h-40 border border-gray-100 rounded-3xl flex items-center justify-center bg-white shadow-gray-400">
                            <Tag className="h-16 w-16 text-gray-200" strokeWidth={1} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
