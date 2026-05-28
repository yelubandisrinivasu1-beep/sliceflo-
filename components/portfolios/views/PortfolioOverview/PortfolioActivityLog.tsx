// components/portfolios/views/PortfolioOverview/PortfolioActivityLog.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useActivityLogStore } from '@/stores/activity-log-store'
import { usePortfoliosStore } from '@/stores/portfolios-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PortfolioActivityLogProps {
  portfolioId?: string
}

// Activity type options
const activityTypes = [
  { value: 'all', label: 'All activity' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'complete', label: 'Completed' },
  { value: 'comment', label: 'Commented' },
]

// Time filter options
const timeFilters = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
]

function PortfolioActivityLog({ portfolioId }: PortfolioActivityLogProps) {
  const activityLogs = useActivityLogStore((s) => s.activityLogs)
  const loading = useActivityLogStore((s) => s.loading)
  const error = useActivityLogStore((s) => s.error)
  const fetchPortfolioActivityLogs = useActivityLogStore(
    (s) => s.fetchPortfolioActivityLogs
  )

  // Get portfolio and workspace members
  const portfolios = usePortfoliosStore((s) => s.portfolios)
  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore()

  const currentPortfolio = useMemo(
    () => portfolios.find((p) => p.id === portfolioId),
    [portfolios, portfolioId]
  )

  // Filter states
  const [activityFilter, setActivityFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  // Fetch workspace members on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!portfolioId) return
    fetchPortfolioActivityLogs(portfolioId)
  }, [portfolioId, fetchPortfolioActivityLogs])

  // Get S3 base URL for profile pictures
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || ''

  // Helper function to get full profile picture URL
  const getProfilePictureUrl = (profilePicture?: string | null) => {
    if (!profilePicture) return undefined
    if (profilePicture.startsWith('http')) return profilePicture
    return `${s3BaseUrl}/${profilePicture}`
  }

  // Get portfolio viewers with full details from workspace members
  const portfolioViewersWithDetails = useMemo(() => {
    if (!currentPortfolio?.viewers || !workspaceMembers.length) return []

    return currentPortfolio.viewers
      .map((viewer) => {
        const workspaceMember = workspaceMembers.find(
          (wm) => wm.userId === viewer.userId
        )
        if (!workspaceMember) return null

        return {
          userId: viewer.userId,
          name: workspaceMember.name,
          email: workspaceMember.email,
          avatar: getProfilePictureUrl(workspaceMember.profilePicture),
          initials:
            workspaceMember.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || '??',
        }
      })
      .filter((viewer): viewer is NonNullable<typeof viewer> => viewer !== null)
  }, [currentPortfolio?.viewers, workspaceMembers, s3BaseUrl])


  // Filter activity logs based on selected filters
  const filteredLogs = useMemo(() => {
    let filtered = [...activityLogs]

    // Filter by activity type
    if (activityFilter !== 'all') {
      filtered = filtered.filter((log) =>
        log.action?.toLowerCase().includes(activityFilter.toLowerCase())
      )
    }

    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter((log) => log.actor?.id === userFilter)
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((log) => {
        const logDate = new Date(log.createdAt)

        switch (timeFilter) {
          case 'today':
            return logDate >= today
          case 'yesterday': {
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            return logDate >= yesterday && logDate < today
          }
          case 'last7days': {
            const last7Days = new Date(today)
            last7Days.setDate(last7Days.getDate() - 7)
            return logDate >= last7Days
          }
          case 'last30days': {
            const last30Days = new Date(today)
            last30Days.setDate(last30Days.getDate() - 30)
            return logDate >= last30Days
          }
          case 'thisMonth': {
            const firstDayOfMonth = new Date(
              now.getFullYear(),
              now.getMonth(),
              1
            )
            return logDate >= firstDayOfMonth
          }
          default:
            return true
        }
      })
    }

    return filtered
  }, [activityLogs, activityFilter, userFilter, timeFilter])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-32 rounded-md bg-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!portfolioId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No portfolio selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Filter dropdowns */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Activity Type Filter */}
        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-[110px] h-9 p-2">
            <SelectValue placeholder="All activity" />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User Filter - Using portfolio viewers with workspace details */}
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[100px] h-9 p-2">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {portfolioViewersWithDetails.map((viewer) => (
              <SelectItem key={viewer.userId} value={viewer.userId}>
                {viewer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Filter */}
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[100px] h-9 p-2">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            {timeFilters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity list - Scrollable */}
      <div className="flex-1 min-h-0 pt-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No activity matching the filters
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {filteredLogs.map((log) => (
                <div key={log._id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={log.actor?.avatar || undefined}
                      alt={log.actor?.name || 'User'}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {log.actor?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {log.actor?.name || 'Someone'}
                      </span>{' '}
                      <span className="text-muted-foreground">{log.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.dateOnly} • {log.timeOnly}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

export default PortfolioActivityLog
