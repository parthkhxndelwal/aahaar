"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAppAuth } from "@/contexts/app-auth-context";
import { useEffect } from "react";

export default function AuthPage() {
  const router = useRouter();
  const { user, token, loading } = useAppAuth();

  // Redirect to user's court if already authenticated
  useEffect(() => {
    if (!loading && user && token && user.courtId) {
      console.log('🔄 [AuthPage] User already authenticated, redirecting to court:', user.courtId);
      router.replace(`/app/${user.courtId}`);
    }
  }, [user, token, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render the auth page if user is already authenticated
  if (user && token) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleGetStarted = async () => {
    // Simulate a brief loading state before navigation
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push("/app/auth/court-qrscan");
    return true; // Return true for success animation
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen text-white flex flex-col relative overflow-hidden max-w-md mx-auto"
    >
      {/* Background Image */}
      <motion.div
        initial={{ filter: "brightness(0)" }}
        animate={{ filter: "brightness(1)" }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/Backgroundd.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 10%",
          backgroundRepeat: "no-repeat",
          transformOrigin: "center center",
        }}
      >
        {/* Dark overlay with fade in */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute inset-0 bg-black"
        />
      </motion.div>

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 p-4 flex items-center"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-white hover:bg-white/10 p-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
      </motion.header>

      {/* Main Content */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-8"
      >
        {/* Logo aligned to the left above text */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1,
            y: [0, -8, 0]
          }}
          transition={{ 
            x: { duration: 0.6, delay: 1.2 },
            opacity: { duration: 0.6, delay: 1.2 },
            y: { duration: 2, delay: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="flex justify-start mb-8"
        >
          <Image
            src="/get-started-logo.png"
            alt="Fork and Knife Logo"
            width={80}
            height={80}
            className="w-16 h-16 object-contain filter brightness-0 invert"
            priority
          />
        </motion.div>

        {/* Main Text */}
        <div className="text-left mb-8 max-w-sm relative">
          <div className="relative z-20">
            <motion.h1 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-4xl font-bold mb-1 leading-tight"
            >
              Your
            </motion.h1>
            <motion.h1 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="text-4xl font-bold mb-1 leading-tight"
            >
              Favorite Meals,
            </motion.h1>
            <motion.h2 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
              className="text-4xl font-bold mb-6 leading-tight"
            >
              <motion.span 
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(239, 68, 68, 0.5)",
                    "0 0 20px rgba(239, 68, 68, 0.8)",
                    "0 0 0px rgba(239, 68, 68, 0.5)"
                  ]
                }}
                transition={{ 
                  duration: 2, 
                  delay: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="text-red-500"
              >
                a Tap away
              </motion.span>
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.0 }}
              className="text-base text-gray-300 leading-relaxed"
            >
              Browse the menu, customize your order, and enjoy hassle-free checkout.
            </motion.p>
          </div>
        </div>

        {/* Get Started Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.2 }}
        >
          <AnimatedButton
            onAsyncClick={handleGetStarted}
            className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 rounded-full text-lg h-14 shadow-lg"
          >
            Get Started
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
