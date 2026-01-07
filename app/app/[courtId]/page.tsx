"use client"

import { useEffect, useState, use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Clock, Star, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Vendor {
  id: string
  stallName: string
  cuisineType: string
  logoUrl?: string
  isOnline: boolean
  averagePreparationTime: number
  rating: number
  totalRatings: number
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  isVegetarian: boolean
  preparationTime: number
  rating: number
  vendor: {
    id: string
    stallName: string
  }
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  vendorId: string
  vendorName: string
}

export default function UserApp({ params }: { params: Promise<{ courtId: string }> }) {
  const { user, token } = useAuth()
  const router = useRouter()
  const { courtId } = use(params)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push(`/app/${courtId}/login`)
      return
    }

    if (user.courtId !== courtId) {
      router.push("/")
      return
    }

    fetchData()
    loadCart()
  }, [user, courtId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch vendors
      const vendorsResponse = await fetch(`/api/courts/${courtId}/vendors?status=active`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json()
        setVendors(vendorsData.data.vendors)
      }

      // Fetch menu items
      const menuResponse = await fetch(`/api/courts/${courtId}/menu?isAvailable=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        setMenuItems(menuData.data.menuItems)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    const savedCart = localStorage.getItem(`cart_${courtId}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem(`cart_${courtId}`, JSON.stringify(newCart))
    setCart(newCart)
  }

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find((item) => item.menuItemId === menuItem.id)

    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
      )
      saveCart(updatedCart)
    } else {
      const newItem: CartItem = {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        vendorId: menuItem.vendor.id,
        vendorName: menuItem.vendor.stallName,
      }
      saveCart([...cart, newItem])
    }
  }

  const removeFromCart = (menuItemId: string) => {
    const existingItem = cart.find((item) => item.menuItemId === menuItemId)

    if (existingItem && existingItem.quantity > 1) {
      const updatedCart = cart.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity: item.quantity - 1 } : item,
      )
      saveCart(updatedCart)
    } else {
      const updatedCart = cart.filter((item) => item.menuItemId !== menuItemId)
      saveCart(updatedCart)
    }
  }

  const getCartItemQuantity = (menuItemId: string) => {
    const item = cart.find((item) => item.menuItemId === menuItemId)
    return item ? item.quantity : 0
  }

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVendor = !selectedVendor || item.vendor.id === selectedVendor
    return matchesSearch && matchesVendor
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Food Court</h1>
              <p className="text-sm text-gray-600">{user?.court?.instituteName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push(`/app/${courtId}/orders`)}>
                My Orders
              </Button>
              <Button onClick={() => router.push(`/app/${courtId}/cart`)} className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getTotalCartItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {getTotalCartItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search for food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedVendor === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedVendor(null)}
            >
              All Stalls
            </Button>
            {vendors.map((vendor) => (
              <Button
                key={vendor.id}
                variant={selectedVendor === vendor.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVendor(vendor.id)}
                className="whitespace-nowrap"
              >
                {vendor.stallName}
              </Button>
            ))}
          </div>
        </div>

        {/* Vendors Grid */}
        {selectedVendor === null && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Stalls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vendor.stallName}</CardTitle>
                      <Badge variant={vendor.isOnline ? "default" : "secondary"}>
                        {vendor.isOnline ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <CardDescription>{vendor.cuisineType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {vendor.averagePreparationTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {vendor.rating.toFixed(1)} ({vendor.totalRatings})
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedVendor ? vendors.find((v) => v.id === selectedVendor)?.stallName : "All Items"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.imageUrl && (
                  <div className="aspect-video bg-gray-200">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="text-sm">{item.vendor.stallName}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.isVegetarian && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Veg
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold">₹{item.price}</span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {item.preparationTime} min
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {item.rating.toFixed(1)}
                    </div>
                  </div>

                  {getCartItemQuantity(item.id) === 0 ? (
                    <Button onClick={() => addToCart(item)} className="w-full" disabled={!item.isAvailable}>
                      {item.isAvailable ? "Add to Cart" : "Not Available"}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" onClick={() => removeFromCart(item.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium">{getCartItemQuantity(item.id)}</span>
                      <Button variant="outline" size="sm" onClick={() => addToCart(item)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {getTotalCartItems() > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => router.push(`/app/${courtId}/cart`)}
            className="rounded-full h-14 w-14 shadow-lg"
          >
            <div className="flex flex-col items-center">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">{getTotalCartItems()}</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  )
}
