import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center space-x-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="text-lg text-foreground">Loading...</span>
      </div>
    </div>
  )
}
