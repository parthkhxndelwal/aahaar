"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Building2, School, Hospital } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Court {
  id: string
  courtId: string
  instituteName: string
  instituteType: string
  status: string
  logoUrl?: string
}

interface CourtSwitcherProps {
  courts: Court[]
  currentCourt: Court | null
  onCourtChange?: (court: Court) => void
}

const getInstituteTypeIcon = (type: string) => {
  switch (type) {
    case "university":
    case "college":
    case "school":
      return <School className="h-4 w-4" />
    case "hospital":
      return <Hospital className="h-4 w-4" />
    case "corporate":
    case "system":
    default:
      return <Building2 className="h-4 w-4" />
  }
}

export function CourtSwitcher({ courts, currentCourt, onCourtChange }: CourtSwitcherProps) {
  const router = useRouter()

  const handleCourtChange = (court: Court) => {
    onCourtChange?.(court)
    router.push(`/admin/${court.courtId}`)
  }

  const getInstituteTypeIcon = (type: string) => {
    switch (type) {
      case "university":
      case "college":
      case "school":
        return <School className="h-4 w-4" />
      case "hospital":
        return <Hospital className="h-4 w-4" />
      case "corporate":
      case "system":
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 w-full p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-neutral-800">
            {currentCourt?.logoUrl ? (
              <img 
                src={currentCourt.logoUrl} 
                alt={currentCourt.instituteName} 
                className="size-6 rounded" 
              />
            ) : (
              getInstituteTypeIcon(currentCourt?.instituteType || 'college')
            )}
          </div>
          <div className="flex-1 text-left text-sm min-w-0">
            <div className="font-semibold text-white truncate">
              {currentCourt?.instituteName || "Select Court"}
            </div>
            <div className="text-xs text-neutral-400 truncate">
              {currentCourt?.courtId || "No court selected"}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-neutral-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Courts
        </DropdownMenuLabel>
        {courts.map((court) => (
          <DropdownMenuItem
            key={court.id}
            onClick={() => handleCourtChange(court)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-sm border">
              {court.logoUrl ? (
                <img 
                  src={court.logoUrl} 
                  alt={court.instituteName} 
                  className="size-4 rounded" 
                />
              ) : (
                getInstituteTypeIcon(court.instituteType)
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {court.instituteName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {court.courtId}
              </span>
            </div>
            {currentCourt?.id === court.id && (
              <DropdownMenuShortcut>✓</DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/admin/onboarding?add=true")} className="gap-2 p-2">
          <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
            <Plus className="size-4" />
          </div>
          <div className="font-medium text-muted-foreground">Add court</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
