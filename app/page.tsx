"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, BarChart3, LayoutDashboard, Smartphone, ChefHat } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <ChefHat className="h-5 w-5" />
            </div>
            <span>Aahaar CMS</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-primary transition-colors">Solutions</Link>
            <Link href="/docs" className="hover:text-primary transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden md:block text-sm font-medium hover:underline">
              Sign In
            </Link>
            <Button onClick={() => router.push('/auth/register')}>Get Started</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 border-b relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1 text-sm rounded-full backdrop-blur-sm border">
              v2.0 Now Available
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              The Operating System for Modern Food Courts across India
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Streamline orders, payments, and kitchen operations in one unified platform. 
              Designed for high-volume environments.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 min-w-[300px]">
              <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => router.push('/auth/register')}>
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8" onClick={() => router.push('/docs')}>
                View Demo
              </Button>
            </div>
            
            {/* Abstract Dashboard Preview */}
            <div className="mt-12 w-full max-w-5xl mx-auto rounded-xl border bg-card/50 shadow-2xl overflow-hidden aspect-[16/9] relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 opactiy-20"></div>
              {/* Fallback visual if no image */}
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                 <div className="grid grid-cols-3 gap-4 p-8 w-full h-full opacity-50 blur-[1px] scale-95 group-hover:blur-0 group-hover:scale-100 transition-all duration-700">
                    <div className="col-span-2 row-span-2 bg-primary/5 rounded-lg border border-primary/10"></div>
                    <div className="col-span-1 bg-muted rounded-lg border"></div>
                    <div className="col-span-1 row-span-2 bg-muted rounded-lg border"></div>
                    <div className="col-span-2 bg-primary/10 rounded-lg border border-primary/20"></div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid (Bento Style) */}
        <section id="features" className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6 space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Everything you need to run at scale</h2>
              <p className="text-muted-foreground text-lg">
                Replace fragmented tools with a single, reliable stack.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              {/* Feature 1: Large */}
              <Card className="md:col-span-2 row-span-1 md:row-span-2 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Unified Vendor Dashboard</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Accept orders, manage inventory, and track earnings in real-time. 
                    Built for fast-paced kitchen environments with optimized touch targets.
                  </CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-background border-t border-l rounded-tl-3xl shadow-2xl translate-y-4 translate-x-4 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-500">
                   {/* Mock UI */}
                   <div className="p-4 space-y-3">
                      <div className="h-2 w-1/3 bg-muted rounded"></div>
                      <div className="h-8 w-full bg-primary/10 rounded"></div>
                      <div className="h-8 w-full bg-muted/50 rounded"></div>
                      <div className="h-8 w-full bg-muted/50 rounded"></div>
                   </div>
                </div>
              </Card>

              {/* Feature 2: Small */}
              <Card className="md:col-span-1 overflow-hidden group">
                <CardHeader>
                   <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 text-blue-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <CardTitle>Instant Updates</CardTitle>
                  <CardDescription>
                    Real-time WebSocket connections ensure orders pop up instantly. No page refreshes needed.
                  </CardDescription>
                </CardHeader>
              </Card>

               {/* Feature 3: Small */}
               <Card className="md:col-span-1 overflow-hidden group">
                <CardHeader>
                   <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3 text-green-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle>Role-Based Security</CardTitle>
                  <CardDescription>
                    Granular permissions for Super Admins, Court Managers, and Vendor Staff.
                  </CardDescription>
                </CardHeader>
              </Card>

               {/* Feature 4: Medium */}
               <Card className="md:col-span-1 overflow-hidden relative bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Mobile First
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Progressive Web App (PWA) support for smooth experience on any device.
                  </CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/10 backdrop-blur-xl"></div>
              </Card>
            </div>
          </div>
        </section>

         {/* Analytics Section */}
         <section className="w-full py-20 border-t">
          <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
             <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  Analytics
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Data-Driven Decisions</h2>
                <p className="text-muted-foreground text-lg">
                  Understand your court's performance with deep insights into peak hours, popular items, and vendor efficiency.
                </p>
                <ul className="space-y-2 mt-4">
                  {['Revenue Reports', 'Peak Time Analysis', 'Vendor Performance', 'Customer Retention'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
             </div>
             <div className="bg-muted aspect-square rounded-2xl flex items-center justify-center border shadow-inner">
               <BarChart3 className="w-32 h-32 text-muted-foreground/20" />
             </div>
          </div>
         </section>

      </main>

      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-6">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2026 Aahaar CMS. Built for enterprise.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
