"use client"

import { useState, useEffect, use } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Package, Plus, Minus, AlertTriangle, CheckCircle, XCircle, TrendingUp, Search, Filter, ArrowLeft, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vendorApi } from "@/lib/api"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  hasStock?: boolean
  stockQuantity?: number
  minStockLevel?: number
  maxStockLevel?: number
  stockUnit?: string
  status?: "active" | "inactive" | "out_of_stock"
  category: string
  menuCategory?: {
    id: string
    name: string
    color?: string
  }
}

interface InventoryStats {
  totalItems: number
  activeItems: number
  outOfStock: number
  lowStock: number
  totalStockValue: number
}

export default function VendorInventory({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useUnifiedAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { courtId } = use(params)
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    activeItems: 0,
    outOfStock: 0,
    lowStock: 0,
    totalStockValue: 0
  })
  
  // State for debounced stock updates
  const [pendingUpdates, setPendingUpdates] = useState<{[key: string]: number}>({})
  const [updatingItems, setUpdatingItems] = useState<{[key: string]: boolean}>({})
  const [updateTimers, setUpdateTimers] = useState<{[key: string]: NodeJS.Timeout}>({})
  
  // Local state for immediate UI updates
  const [localStockQuantities, setLocalStockQuantities] = useState<{[key: string]: number}>({})

  useEffect(() => {
    if (!user || user.role !== "vendor" || user.courtId !== courtId) {
      router.push("/vendor/login")
      return
    }

    fetchInventoryData()
  }, [user, courtId])

  // Initialize local stock quantities when menu items are loaded
  useEffect(() => {
    const initialQuantities: {[key: string]: number} = {}
    menuItems.forEach(item => {
      if (item.hasStock) {
        initialQuantities[item.id] = item.stockQuantity || 0
      }
    })
    setLocalStockQuantities(initialQuantities)
  }, [menuItems])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimers).forEach(timer => clearTimeout(timer))
    }
  }, [updateTimers])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      
      const vendorId = user?.vendorProfile?.id
      if (!vendorId) return
      
      const data = await vendorApi.getMenu(vendorId)
      
      const menuItemsData = data.menuItems || []
      const mappedItems = menuItemsData.map((item: any) => ({
        ...item,
        isVeg: item.isVegetarian,
        category: item.menuCategory?.name || item.category || 'Other'
      }))
      
      setMenuItems(mappedItems)
      calculateStats(mappedItems)
    } catch (error) {
      console.error("Error fetching inventory data:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (items: MenuItem[]) => {
    const totalItems = items.length
    const activeItems = items.filter(item => item.isAvailable && item.status !== "out_of_stock").length
    const outOfStock = items.filter(item => 
      !item.isAvailable || 
      item.status === "out_of_stock" || 
      (item.hasStock && (item.stockQuantity || 0) === 0)
    ).length
    const lowStock = items.filter(item => 
      item.isAvailable && 
      item.hasStock && 
      (item.stockQuantity || 0) > 0 && 
      (item.stockQuantity || 0) <= (item.minStockLevel || 0)
    ).length
    const totalStockValue = items.reduce((total, item) => {
      if (item.isAvailable && item.hasStock && item.stockQuantity) {
        return total + (item.price * item.stockQuantity)
      }
      return total
    }, 0)

    setStats({
      totalItems,
      activeItems,
      outOfStock,
      lowStock,
      totalStockValue
    })
  }

  const handleStockUpdate = async (itemId: string, newQuantity: number) => {
    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }))
      
      const vendorId = user?.vendorProfile?.id
      if (!vendorId) return
      
      await vendorApi.updateMenuItem(vendorId, itemId, { 
        stockQuantity: Math.max(0, newQuantity),
        status: newQuantity === 0 ? "out_of_stock" : "active"
      } as any)

      // Update the local menu items state without full refetch
      setMenuItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              stockQuantity: newQuantity,
              status: (newQuantity === 0 ? "out_of_stock" : "active") as "active" | "inactive" | "out_of_stock"
            }
          : item
      ))
      
      // Recalculate stats
      const updatedItems = menuItems.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              stockQuantity: newQuantity, 
              status: (newQuantity === 0 ? "out_of_stock" : "active") as "active" | "inactive" | "out_of_stock"
            }
          : item
      )
      calculateStats(updatedItems)
      
      // Clear pending update for this item
      setPendingUpdates(prev => {
        const newPending = { ...prev }
        delete newPending[itemId]
        return newPending
      })
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      
      // Revert local state on error
      setLocalStockQuantities(prev => ({
        ...prev,
        [itemId]: menuItems.find(item => item.id === itemId)?.stockQuantity || 0
      }))
      
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const handleDebouncedStockUpdate = (itemId: string, newQuantity: number) => {
    // Update local state immediately for UI responsiveness
    setLocalStockQuantities(prev => ({ ...prev, [itemId]: newQuantity }))
    
    // Clear existing timer for this item
    if (updateTimers[itemId]) {
      clearTimeout(updateTimers[itemId])
    }
    
    // Set pending update
    setPendingUpdates(prev => ({ ...prev, [itemId]: newQuantity }))
    
    // Set new timer
    const timer = setTimeout(() => {
      handleStockUpdate(itemId, newQuantity)
    }, 1000) // 1.5 seconds delay

    setUpdateTimers(prev => ({ ...prev, [itemId]: timer }))
  }

  const handleStockIncrement = (itemId: string) => {
    const item = menuItems.find(item => item.id === itemId)
    if (!item?.isAvailable) return // Don't allow stock changes if item is unavailable
    
    const currentQuantity = localStockQuantities[itemId] || 0
    handleDebouncedStockUpdate(itemId, currentQuantity + 1)
  }

  const handleStockDecrement = (itemId: string) => {
    const item = menuItems.find(item => item.id === itemId)
    if (!item?.isAvailable) return // Don't allow stock changes if item is unavailable
    
    const currentQuantity = localStockQuantities[itemId] || 0
    if (currentQuantity > 0) {
      handleDebouncedStockUpdate(itemId, currentQuantity - 1)
    }
  }

  const handleStockInputChange = (itemId: string, value: string) => {
    const item = menuItems.find(item => item.id === itemId)
    if (!item?.isAvailable) return // Don't allow stock changes if item is unavailable
    
    const newQuantity = parseInt(value) || 0
    if (newQuantity >= 0) {
      handleDebouncedStockUpdate(itemId, newQuantity)
    }
  }

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }))
      
      const vendorId = user?.vendorProfile?.id
      if (!vendorId) return
      
      await vendorApi.toggleItemAvailability(vendorId, itemId, isAvailable)

      // Update the local menu items state without full refetch
      setMenuItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, isAvailable }
          : item
      ))
      
      // Recalculate stats
      const updatedItems = menuItems.map(item => 
        item.id === itemId 
          ? { ...item, isAvailable }
          : item
      )
      calculateStats(updatedItems)
      
      toast({
        title: "Success",
        description: `Item ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error("Error updating availability:", error)
      toast({
        title: "Error",
        description: "Failed to update item availability",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const handleEditStock = async (stockData: { 
    hasStock: boolean; 
    stockQuantity: number; 
    minStockLevel: number; 
    maxStockLevel: number; 
    stockUnit: string;
  }) => {
    if (!editingItem) return

    try {
      setUpdatingItems(prev => ({ ...prev, [editingItem.id]: true }))
      
      const vendorId = user?.vendorProfile?.id
      if (!vendorId) return
      
      await vendorApi.updateMenuItem(vendorId, editingItem.id, {
        ...stockData,
        status: !stockData.hasStock ? "active" : (stockData.stockQuantity === 0 ? "out_of_stock" : "active")
      } as any)

      // Update the local menu items state
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              ...stockData,
              status: !stockData.hasStock ? "active" : (stockData.stockQuantity === 0 ? "out_of_stock" : "active")
            }
          : item
      ))
      
      // Update local stock quantities
      setLocalStockQuantities(prev => ({
        ...prev,
        [editingItem.id]: stockData.hasStock ? stockData.stockQuantity : 0
      }))
      
      // Recalculate stats
      const updatedItems = menuItems.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              ...stockData, 
              status: (!stockData.hasStock ? "active" : (stockData.stockQuantity === 0 ? "out_of_stock" : "active")) as "active" | "inactive" | "out_of_stock"
            }
          : item
      )
      calculateStats(updatedItems)
      
      setIsEditDialogOpen(false)
      setEditingItem(null)
      toast({
        title: "Success",
        description: stockData.hasStock ? "Stock tracking enabled and settings updated successfully" : "Stock tracking disabled successfully",
      })
    } catch (error) {
      console.error("Error updating stock settings:", error)
      toast({
        title: "Error",
        description: "Failed to update stock settings",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems(prev => ({ ...prev, [editingItem.id]: false }))
    }
  }

  const getStockStatus = (item: MenuItem) => {
    if (!item.hasStock) return "no-tracking"
    
    // If item is unavailable, treat it as out of stock in UI
    if (!item.isAvailable) return "out-of-stock"
    
    // Use local quantity if available, otherwise use item quantity
    const currentQuantity = localStockQuantities[item.id] ?? item.stockQuantity ?? 0
    
    if (item.status === "out_of_stock" || currentQuantity === 0) return "out-of-stock"
    if (currentQuantity <= (item.minStockLevel || 0)) return "low-stock"
    return "in-stock"
  }

  const getStockStatusBadge = (item: MenuItem) => {
    const status = getStockStatus(item)
    
    switch (status) {
      case "out-of-stock":
        return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
      case "low-stock":
        return <Badge variant="secondary" className="text-xs">Low Stock</Badge>
      case "in-stock":
        return <Badge variant="default" className="text-xs bg-foreground text-background">In Stock</Badge>
      default:
        return <Badge variant="outline" className="text-xs">No Tracking</Badge>
    }
  }

  const getDisplayStockQuantity = (item: MenuItem) => {
    // If item is unavailable, display 0 in UI
    if (!item.isAvailable) return 0
    
    // Use local quantity if available, otherwise use item quantity
    return localStockQuantities[item.id] ?? item.stockQuantity ?? 0
  }

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "active") return matchesSearch && item.isAvailable && item.status !== "out_of_stock"
    if (filterStatus === "out-of-stock") return matchesSearch && (!item.isAvailable || item.status === "out_of_stock" || (item.hasStock && (item.stockQuantity || 0) === 0))
    if (filterStatus === "low-stock") return matchesSearch && item.isAvailable && item.hasStock && (item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) <= (item.minStockLevel || 0)
    if (filterStatus === "inactive") return matchesSearch && !item.isAvailable
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Monitor and manage your stock levels</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{Number(stats.totalStockValue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search items by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="active">Active Items</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="inactive">Inactive Items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchQuery || filterStatus !== "all") && (
            <div className="mt-4 text-sm text-muted-foreground">
              Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
              {filterStatus !== "all" && ` with status "${filterStatus.replace('-', ' ')}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            {/* Image */}
            <div className="relative aspect-video bg-muted flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 left-2">{getStockStatusBadge(item)}</div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">{item.category}</Badge>
              </div>
            </div>

            <div className="flex flex-col flex-1 p-4 gap-3">
              {/* Name + price row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold flex-shrink-0">₹{item.price}</span>
              </div>

              {/* Stock section */}
              {item.hasStock ? (
                <div className="space-y-2">
                  {/* Quantity stepper */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => handleStockDecrement(item.id)}
                      disabled={!item.isAvailable || getDisplayStockQuantity(item) <= 0 || updatingItems[item.id]}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={getDisplayStockQuantity(item)}
                        onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                        className="text-center h-8 pr-8"
                        min="0"
                        disabled={!item.isAvailable || updatingItems[item.id]}
                      />
                      {/* Saving indicator inside input */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {updatingItems[item.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : pendingUpdates[item.id] !== undefined ? (
                          <div className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse" />
                        ) : null}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => handleStockIncrement(item.id)}
                      disabled={!item.isAvailable || updatingItems[item.id]}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.stockUnit || 'pcs'}</span>
                  </div>

                  {/* Min/max hint */}
                  <p className="text-xs text-muted-foreground">
                    Min {item.minStockLevel || 0} · Max {item.maxStockLevel || 0} {item.stockUnit || 'pcs'}
                  </p>

                  {!item.isAvailable && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                      Stock controls disabled — item is unavailable
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No stock tracking</p>
              )}

              {/* Footer: availability toggle + settings */}
              <div className="flex items-center justify-between pt-1 border-t mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Available</span>
                  {updatingItems[item.id] && !item.hasStock ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                      disabled={updatingItems[item.id]}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => { setEditingItem(item); setIsEditDialogOpen(true) }}
                  disabled={updatingItems[item.id]}
                >
                  {item.hasStock ? "Settings" : "Enable tracking"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* No results message */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || filterStatus !== "all" 
                ? "No items match your current filters"
                : "You haven't added any menu items yet"
              }
            </p>
            {searchQuery || filterStatus !== "all" ? (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("")
                  setFilterStatus("all")
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button 
                className="mt-4"
                onClick={() => router.push(`/vendor/${courtId}/menu`)}
              >
                Add Menu Items
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Stock Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem?.hasStock ? "Edit Stock Settings" : "Enable Stock Tracking"}
            </DialogTitle>
            <DialogDescription>
              {editingItem?.hasStock 
                ? `Update stock settings for ${editingItem?.name}`
                : `Enable and configure stock tracking for ${editingItem?.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <StockEditForm
              item={editingItem}
              onSave={handleEditStock}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingItem(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Stock Edit Form Component
function StockEditForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: MenuItem
  onSave: (data: { 
    hasStock: boolean; 
    stockQuantity: number; 
    minStockLevel: number; 
    maxStockLevel: number; 
    stockUnit: string;
  }) => Promise<void>
  onCancel: () => void
}) {
  const [hasStock, setHasStock] = useState(item.hasStock || false)
  const [stockQuantity, setStockQuantity] = useState(item.stockQuantity || 0)
  const [minStockLevel, setMinStockLevel] = useState(item.minStockLevel || 5)
  const [maxStockLevel, setMaxStockLevel] = useState(item.maxStockLevel || 100)
  const [stockUnit, setStockUnit] = useState(item.stockUnit || "pieces")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSave({
        hasStock,
        stockQuantity: hasStock ? stockQuantity : 0,
        minStockLevel: hasStock ? minStockLevel : 0,
        maxStockLevel: hasStock ? maxStockLevel : 0,
        stockUnit: hasStock ? stockUnit : "pieces"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stock Tracking Toggle */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="hasStock"
            checked={hasStock}
            onCheckedChange={(checked) => {
              setHasStock(checked)
              if (!checked) {
                setStockQuantity(0)
                setMinStockLevel(0)
                setMaxStockLevel(0)
              } else {
                setStockQuantity(item.stockQuantity || 0)
                setMinStockLevel(item.minStockLevel || 5)
                setMaxStockLevel(item.maxStockLevel || 100)
              }
            }}
          />
          <Label htmlFor="hasStock" className="font-medium">
            Track Stock for this item
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {hasStock 
            ? "Stock tracking is enabled. You can manage quantity and set alerts." 
            : "Enable this to track inventory levels for this item."
          }
        </p>
      </div>
      
      {hasStock && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockQuantity">Current Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="stockUnit">Stock Unit</Label>
              <Select
                value={stockUnit}
                onValueChange={setStockUnit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="grams">Grams</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                  <SelectItem value="ml">Milliliters</SelectItem>
                  <SelectItem value="plates">Plates</SelectItem>
                  <SelectItem value="bowls">Bowls</SelectItem>
                  <SelectItem value="cups">Cups</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                  <SelectItem value="packets">Packets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="minStockLevel">Minimum Stock Level (Alert threshold)</Label>
            <Input
              id="minStockLevel"
              type="number"
              min="0"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 0)}
              placeholder="5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll get alerts when stock falls below this level
            </p>
          </div>

          <div>
            <Label htmlFor="maxStockLevel">Maximum Stock Capacity</Label>
            <Input
              id="maxStockLevel"
              type="number"
              min="0"
              value={maxStockLevel}
              onChange={(e) => setMaxStockLevel(parseInt(e.target.value) || 0)}
              placeholder="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum quantity you can store for this item
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : hasStock ? "Save Changes" : "Disable Stock Tracking"}
        </Button>
      </div>
    </form>
  )
}
