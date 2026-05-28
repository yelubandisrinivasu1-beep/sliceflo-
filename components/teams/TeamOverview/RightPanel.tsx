'use client'

import React from 'react'
import AboutTeam from './AboutTeam'
import ActivityLog from './ActivityLog'
import { useEffect, useState } from "react"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { useTeamStore } from '@/stores/teams-store'

interface RightPanelProps {
  team: any
}

const RightPanel = ({ team: propTeam }: RightPanelProps) => {
  const [activeTab, setActiveTab] = useState("properties")

  const workspaceMembers = useWorkspaceStore((state) => state.workspaceMembers);
  const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspace?.id);
  const { teams, fetchTeamById } = useTeamStore();

  const teamId = propTeam?.id
  const team = teams.find(t => t.id === teamId) || propTeam;

  useEffect(() => {
    if (teamId) fetchTeamById(teamId);
    if (currentWorkspaceId && team?.workspaceId !== currentWorkspaceId) {
      useWorkspaceStore.getState().fetchWorkspaceMembers(currentWorkspaceId);
    }
  }, [teamId, currentWorkspaceId]);

  let owner = team?.teamMembers?.find((m: any) =>
    m.role === 'owner' || m.userId === team?.leaderId || m.id === team?.leaderId
  );

  if (!owner && workspaceMembers.length > 0) {
    owner = workspaceMembers.find((m: any) => m.userId === team?.leaderId);
  }

  const ownerWithAvatar = owner ? {
    ...owner,
    avatar: owner.profilePicture || owner.avatar ||
      (owner.profilePicture?.startsWith('http') ? owner.profilePicture : undefined)
  } : null;

  const tabs = [
    { value: 'properties', label: 'Properties' },
    { value: 'activity', label: 'Activity Log' },
  ]

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Full-width pill tab switcher */}
      <div className="bg-[#F2F2F7] p-2 flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer
              ${activeTab === tab.value
                ? 'bg-[#001F3F] text-white shadow-sm'
                : 'text-[#8E8E93] hover:text-[#3C3C43]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === 'properties' && (
          <AboutTeam
            teamName={team?.name}
            teamOwner={ownerWithAvatar}
            teamDescription={team?.description}
            teamPicture={team?.picture}
            teamLabels={team?.labels || []}
          />
        )}
        {activeTab === 'activity' && (
          <div className="text-sm text-muted-foreground">
            <ActivityLog />
          </div>
        )}
      </div>
    </div>
  )
}

export default RightPanel
