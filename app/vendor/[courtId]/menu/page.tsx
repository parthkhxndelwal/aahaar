"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Upload, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isAvailable: boolean
  preparationTime: number
  isVeg: boolean
  ingredients?: string[]
  allergens?: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
}

interface MenuCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
}

export default function VendorMenuPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { courtId } = use(params)
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    isAvailable: true,
    preparationTime: 15,
    isVeg: true,
    ingredients: [],
    allergens: [],
  })

  useEffect(() => {
    if (!user || user.role !== "vendor" || user.courtId !== courtId) {
      router.push("/vendor/login")
      return
    }

    fetchMenuData()
  }, [user, courtId])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      
      // Fetch menu items
      const menuResponse = await fetch(`/api/vendors/${user?.vendorProfile?.id}/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        setMenuItems(menuData.data?.items || [])
        setCategories(menuData.data?.categories || [])
      }
    } catch (error) {
      console.error("Error fetching menu data:", error)
      toast({
        title: "Error",
        description: "Failed to load menu data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveItem = async () => {
    try {
      const itemData = editingItem ? { ...editingItem } : { ...newItem }
      
      const url = editingItem 
        ? `/api/vendors/${user?.vendorProfile?.id}/menu/${editingItem.id}`
        : `/api/vendors/${user?.vendorProfile?.id}/menu`
        
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Menu item ${editingItem ? "updated" : "created"} successfully`,
        })
        setIsAddDialogOpen(false)
        setEditingItem(null)
        setNewItem({
          name: "",
          description: "",
          price: 0,
          category: "",
          isAvailable: true,
          preparationTime: 15,
          isVeg: true,
          ingredients: [],
          allergens: [],
        })
        fetchMenuData()
      } else {
        throw new Error("Failed to save menu item")
      }
    } catch (error) {
      console.error("Error saving menu item:", error)
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/vendors/${user?.vendorProfile?.id}/menu/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Menu item deleted successfully",
        })
        fetchMenuData()
      } else {
        throw new Error("Failed to delete menu item")
      }
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      })
    }
  }

  const toggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/vendors/${user?.vendorProfile?.id}/menu/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable }),
      })

      if (response.ok) {
        fetchMenuData()
      }
    } catch (error) {
      console.error("Error updating availability:", error)
    }
  }

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your menu items and categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the details of your menu item" : "Add a new item to your menu"}
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm 
              item={editingItem || newItem}
              onSave={handleSaveItem}
              onCancel={() => {
                setIsAddDialogOpen(false)
                setEditingItem(null)
              }}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className={`${!item.isAvailable ? "opacity-50" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={item.isVeg ? "secondary" : "destructive"}>
                      {item.isVeg ? "Veg" : "Non-Veg"}
                    </Badge>
                    <Badge variant="outline">₹{item.price}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleAvailability(item.id, !item.isAvailable)}
                  >
                    {item.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingItem(item)
                      setIsAddDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.imageUrl && (
                <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              <div className="space-y-2 text-xs text-gray-500">
                <div>Category: {item.category}</div>
                <div>Prep Time: {item.preparationTime} min</div>
                {item.ingredients && item.ingredients.length > 0 && (
                  <div>Ingredients: {item.ingredients.join(", ")}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {menuItems.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No menu items yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>Add Your First Menu Item</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Menu Item Form Component
function MenuItemForm({ 
  item, 
  onSave, 
  onCancel, 
  categories 
}: { 
  item: Partial<MenuItem>
  onSave: () => void
  onCancel: () => void
  categories: MenuCategory[]
}) {
  const [formData, setFormData] = useState(item)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Chicken Biryani"
          />
        </div>
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price || 0}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your dish..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appetizers">Appetizers</SelectItem>
              <SelectItem value="main-course">Main Course</SelectItem>
              <SelectItem value="beverages">Beverages</SelectItem>
              <SelectItem value="desserts">Desserts</SelectItem>
              <SelectItem value="snacks">Snacks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preparationTime">Prep Time (minutes)</Label>
          <Input
            id="preparationTime"
            type="number"
            value={formData.preparationTime || 15}
            onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isVeg || false}
            onCheckedChange={(checked) => setFormData({ ...formData, isVeg: checked })}
          />
          <Label>Vegetarian</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isAvailable ?? true}
            onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
          />
          <Label>Available</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          {item.id ? "Update" : "Add"} Item
        </Button>
      </div>
    </div>
  )
}
