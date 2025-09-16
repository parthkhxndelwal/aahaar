"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useRouter } from "next/navigation"
import { ChevronRight, Search, Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [showAdminSignIn, setShowAdminSignIn] = useState(false)

  const handleModalClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1
      if (newCount >= 15 && !showAdminSignIn) {
        setShowAdminSignIn(true)
      }
      return newCount
    })
  }

  const handleJoinUs = () => {
    setShowLoginModal(true)
    setClickCount(0) // Reset click count when modal opens
    setShowAdminSignIn(false) // Reset admin signin visibility
  }

  const handleLearnMore = () => {
    router.push('/docs')
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover z-0 transform translate-y-40 scale-150"
      >
        <source src="/bg-hero.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      
      {/* Header */}
      <header className="relative z-20 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Aahaar" 
              width={48} 
              height={48}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold">Aahaar CMS</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Home</a>
            <a href="/docs" className="text-gray-300 hover:text-white transition-colors">Technology</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-gray-600 text-white bg-transparent hover:bg-white hover:text-black transition-all"
              onClick={handleLearnMore}
            >
              Learn more
            </Button>
            <Button 
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={handleJoinUs}
            >
              Join us
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-20 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Main Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl font-bold leading-tight">
                  Serve Food,
                  <br />
                  
                  <span className="bg-gradient-to-r from-neutral-400 to-pink-400 bg-clip-text text-transparent">
                    Not Stress.
                  </span>
                </h1>

                <p className="text-xl text-gray-300 max-w-lg">
                  From billing to kitchen orders, our POS takes the load off your shoulders—leaving you free to serve customers and scale like a pro.
                </p>

                <div className="flex gap-4">
                  <Button 
                    className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-full"
                    onClick={handleLearnMore}
                  >
                    Learn more
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg rounded-full bg-transparent"
                    onClick={handleJoinUs}
                  >
                    Join us
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - 3D Visual Elements */}
            <div className="relative">
              {/* 3D Food Court Elements */}
              <div className="relative w-full h-96">
                {/* Main Platform */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm transform rotate-3 perspective-1000">
                  <div className="absolute inset-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl">
                    {/* Food Stalls */}
                    <div className="absolute top-6 left-6 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-lg">
                      <div className="absolute inset-2 bg-pink-400/30 rounded"></div>
                      <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="absolute top-6 right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                      <div className="absolute inset-2 bg-cyan-400/30 rounded"></div>
                      <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                      <div className="absolute inset-2 bg-green-400/30 rounded"></div>
                      <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Floating Order Cards */}
                <div className="absolute -top-4 -left-4 w-24 h-16 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 animate-float">
                  <div className="p-2">
                    <div className="w-full h-2 bg-pink-500/60 rounded mb-1"></div>
                    <div className="w-3/4 h-1 bg-gray-400/60 rounded mb-1"></div>
                    <div className="w-1/2 h-1 bg-gray-400/60 rounded"></div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 w-24 h-16 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 animate-float-delayed">
                  <div className="p-2">
                    <div className="w-full h-2 bg-blue-500/60 rounded mb-1"></div>
                    <div className="w-3/4 h-1 bg-gray-400/60 rounded mb-1"></div>
                    <div className="w-1/2 h-1 bg-gray-400/60 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login/Signup Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent 
          className="sm:max-w-md bg-black border-gray-800 text-white"
          onClick={handleModalClick}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              🚀 Join Aahaar CMS
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Choose how you want to get started with our platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3"
                onClick={() => router.push('/app/auth')}
              >
                Sign In
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                onClick={() => router.push('/app/auth')}
              >
                Sign Up
              </Button>
            </div>

            {showAdminSignIn && (
              <Button 
                variant="outline" 
                className="w-full border-gray-600 text-white hover:bg-gray-800 py-3 bg-transparent transition-all duration-500 ease-out transform animate-fade-in"
                onClick={() => router.push('/admin/auth')}
              >
                🔧 Admin Portal Access
              </Button>
            )}

            <div className="pt-4">
              <Link 
                href="/vendor/login"
                className="text-pink-400 hover:text-pink-300 text-sm underline block text-center"
              >
                Sign in as a Vendor
              </Link>
            </div>

            {clickCount > 10 && !showAdminSignIn && (
              <p className="text-xs text-gray-500 text-center animate-pulse">
                Keep clicking... ({15 - clickCount} more)
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
