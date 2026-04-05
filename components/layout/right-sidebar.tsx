"use client"

interface RightSidebarProps {
  courtId?: string
  courtName?: string
  role?: string
  userEmail?: string
}

export function RightSidebar({ courtId, courtName, role, userEmail }: RightSidebarProps) {
  return (
    <aside className="hidden xl:flex flex-col h-screen sticky top-0 w-[320px] shrink-0 border-l border-border bg-background">
      <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar">
        {/* Court / Context info */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-4">
          <h2 className="font-bold text-base mb-3">
            {role === "Customer" ? "Your Food Court" : "Active Court"}
          </h2>
          {courtId ? (
            <div className="space-y-2">
              {courtName && (
                <p className="text-sm font-semibold text-foreground">{courtName}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono">{courtId}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No court selected</p>
          )}
        </div>

        {/* Role badge */}
        {role && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-4">
            <h2 className="font-bold text-base mb-3">Signed in as</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-bold select-none">
                {role.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{role}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Aahaar CMS
          </p>
        </div>
      </div>
    </aside>
  )
}
