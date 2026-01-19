"use client"
import { Sidebar } from "@/components/app/sidebar"
import { BottomNavigation } from "@/components/app/bottom-navigation"
import { BottomNavProvider } from "@/contexts/bottom-nav-context"
import { AnimatedLayout } from "@/components/animated-layout"
import { use } from "react"

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courtId: string }>
}) {
  const { courtId } = use(params)
  
  return (
    <BottomNavProvider>
      <div className="min-h-screen bg-neutral-950 flex">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 mx-auto w-full flex justify-center overflow-hidden">
            <div className="w-full md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%]">
              <AnimatedLayout>
                {children}
              </AnimatedLayout>
            </div>
          </main>
          {/* Mobile Bottom Navigation - hidden on desktop */}
          <div className="">
            <BottomNavigation courtId={courtId} />
          </div>
        </div>
      </div>
    </BottomNavProvider>
  )
}
