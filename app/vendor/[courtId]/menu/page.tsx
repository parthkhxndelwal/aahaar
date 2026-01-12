"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Upload, X, Tag, Search } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  mrp?: number
  category: string
  categoryId?: string
  imageUrl?: string
  isAvailable: boolean
  preparationTime: number
  isVeg: boolean
  isVegetarian?: boolean // Backend field for compatibility
  ingredients?: string[]
  allergens?: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  menuCategory?: {
    id: string
    name: string
    color?: string
  }
}

interface MenuCategory {
  id: string
  name: string
  description?: string
  vendorId: string
  displayOrder: number
  isActive: boolean
  color?: string
  imageUrl?: string
}

export default function VendorMenuPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { courtId } = use(params)
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [isCustomizeDrawerOpen, setIsCustomizeDrawerOpen] = useState(false)
  const [newCategory, setNewCategory] = useState<Partial<MenuCategory>>({
    name: "",
    description: "",
    displayOrder: 0,
    isActive: true,
    color: "#000000"
  })
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    mrp: undefined,
    category: "",
    categoryId: "",
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

    // If vendor profile is missing, try to fetch it
    if (!user.vendorProfile) {
      fetchVendorProfile()
    } else {
      fetchMenuData()
    }
  }, [user, courtId])

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter(item => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.ingredients && item.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(query)
      )) ||
      (item.allergens && item.allergens.some(allergen => 
        allergen.toLowerCase().includes(query)
      ))
    )
  })

  const fetchVendorProfile = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/vendor-profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const profileData = await response.json()
        if (profileData.success && profileData.data.vendorProfile) {
          // Update the user context with vendor profile
          const updatedUser = {
            ...user,
            vendorProfile: profileData.data.vendorProfile
          }
          // Update localStorage to persist the vendor profile
          localStorage.setItem("auth_user", JSON.stringify(updatedUser))
          fetchMenuData()
        } else {
          throw new Error("Vendor profile not found")
        }
      } else {
        throw new Error("Failed to fetch vendor profile")
      }
    } catch (error) {
      console.error("Error fetching vendor profile:", error)
      toast({
        title: "Error",
        description: "Unable to load vendor profile. Please try logging in again.",
        variant: "destructive",
      })
      router.push("/vendor/login")
    }
  }

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      
      // Fetch categories first
      const categoriesResponse = await fetch(`/api/vendors/${user?.vendorProfile?.id}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.data?.categories || [])
      }
      
      // Fetch menu items with category details
      const menuResponse = await fetch(`/api/vendors/${user?.vendorProfile?.id}/menu?include=categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        const menuItems = menuData.data?.menuItems || []
        // Map backend fields to frontend fields
        const mappedItems = menuItems.map((item: any) => ({
          ...item,
          isVeg: item.isVegetarian, // Map isVegetarian to isVeg for frontend
          category: item.menuCategory?.name || item.category || 'Other'
        }))
        setMenuItems(mappedItems)
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

  const handleSaveItem = async (formData?: Partial<MenuItem>) => {
    try {
      const itemData = formData || (editingItem ? { ...editingItem } : { ...newItem })
      
      // Validate required fields
      if (!itemData.name || !itemData.price || (!itemData.category && !itemData.categoryId)) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (name, price, category)",
          variant: "destructive",
        })
        return
      }
      
      // Map frontend fields to backend fields
      const mappedData = {
        ...itemData,
        isVegetarian: itemData.isVeg, // Map isVeg to isVegetarian
        // Remove the frontend-only field
        isVeg: undefined
      }

      console.log("User vendor profile:", user?.vendorProfile)
      console.log("Sending menu item data:", mappedData)
      
      if (!user?.vendorProfile?.id) {
        throw new Error("Vendor profile not found. Please log in again.")
      }
      
      const url = editingItem 
        ? `/api/vendors/${user.vendorProfile.id}/menu/${editingItem.id}`
        : `/api/vendors/${user.vendorProfile.id}/menu`
        
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mappedData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Menu item ${editingItem ? 'updated' : 'added'} successfully`,
        })
        setIsAddDialogOpen(false)
        setEditingItem(null)
        setNewItem({
          name: "",
          description: "",
          price: 0,
          mrp: undefined,
          category: "",
          categoryId: "",
          isAvailable: true,
          preparationTime: 15,
          isVeg: true,
          ingredients: [],
          allergens: [],
        })
        fetchMenuData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save menu item')
      }
    } catch (error) {
      console.error("Error saving menu item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save menu item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/vendors/${user?.vendorProfile?.id}/menu/${id}`, {
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

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/vendors/${user?.vendorProfile?.id}/menu/${id}`, {
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

  const handleSaveCategory = async (formData?: Partial<MenuCategory>) => {
    try {
      const categoryData = formData || (editingCategory ? { ...editingCategory } : { ...newCategory })
      
      // Validate required fields
      if (!categoryData.name) {
        toast({
          title: "Validation Error",
          description: "Please provide a category name",
          variant: "destructive",
        })
        return
      }

      const url = editingCategory 
        ? `/api/vendors/${user?.vendorProfile?.id}/categories/${editingCategory.id}`
        : `/api/vendors/${user?.vendorProfile?.id}/categories`
        
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Category ${editingCategory ? 'updated' : 'added'} successfully`,
        })
        setIsCategoryDialogOpen(false)
        setEditingCategory(null)
        setNewCategory({
          name: "",
          description: "",
          displayOrder: 0,
          isActive: true,
          color: "#000000"
        })
        fetchMenuData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/vendors/${user?.vendorProfile?.id}/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        fetchMenuData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      })
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
        <div className="flex gap-2">
          {/* Manage Categories Button */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Manage Categories</DrawerTitle>
                <DrawerDescription>
                  Add, edit, or manage your menu categories
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                {/* Add Category Button */}
                <div className="mb-4">
                  <Button
                    onClick={() => {
                      setEditingCategory(null)
                      setIsCategoryDialogOpen(true)
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Category
                  </Button>
                </div>
                
                {/* Categories List */}
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={category.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        {category.color && (
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-500 truncate">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={category.isActive ? "default" : "secondary"} className="text-xs">
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCategory(category)
                            setIsCategoryDialogOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Done</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {/* Menu Item Drawer */}
          <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DrawerTrigger asChild>
              <Button onClick={() => setEditingItem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DrawerTitle>
                <DrawerDescription>
                  {editingItem ? "Update the details of your menu item" : "Add a new item to your menu"}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 max-h-[75vh] overflow-y-auto">
                <MenuItemForm 
                  item={editingItem || newItem}
                  onSave={async (formData: Partial<MenuItem>) => await handleSaveItem(formData)}
                  onCancel={() => {
                    setIsAddDialogOpen(false)
                    setEditingItem(null)
                  }}
                  categories={categories}
                  isMobile={true}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Category Form Drawer */}
      <Drawer open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DrawerTitle>
            <DrawerDescription>
              {editingCategory ? "Update the details of your category" : "Add a new category to organize your menu"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            <CategoryForm 
              category={editingCategory || newCategory}
              onSave={async (formData: Partial<MenuCategory>) => await handleSaveCategory(formData)}
              onCancel={() => {
                setIsCategoryDialogOpen(false)
                setEditingCategory(null)
              }}
              isMobile={true}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search menu items by name, description, category, ingredients, or allergens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Found {filteredMenuItems.length} item{filteredMenuItems.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMenuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge variant={item.isVeg ? "default" : "destructive"}>
                  {item.isVeg ? "Veg" : "Non-Veg"}
                </Badge>
                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(item)
                      setIsAddDialogOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-green-600">₹{item.price}</span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-sm text-gray-500 line-through">₹{item.mrp}</span>
                      )}
                    </div>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-xs text-green-600">
                        {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                      </span>
                    )}
                  </div>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Prep time: {item.preparationTime} mins
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Available</span>
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results messages */}
      {searchQuery && filteredMenuItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-gray-600 mb-4">
                No menu items match your search for "{searchQuery}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!searchQuery && menuItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first menu item</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Category Form Component
function CategoryForm({ 
  category, 
  onSave, 
  onCancel,
  isMobile = false
}: { 
  category: Partial<MenuCategory>
  onSave: (data: Partial<MenuCategory>) => Promise<void>
  onCancel: () => void
  isMobile?: boolean
}) {
  const [formData, setFormData] = useState<Partial<MenuCategory>>(category)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Update form data when category prop changes
  useEffect(() => {
    setFormData(category)
    if (category.imageUrl) {
      setImagePreview(category.imageUrl)
    } else {
      setImagePreview(null)
    }
    setUploadedImage(null)
  }, [category])

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let imageUrl = formData.imageUrl

      // Upload image if a new one was selected
      if (uploadedImage) {
        const imageFormData = new FormData()
        imageFormData.append('image', uploadedImage)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        }
      }

      await onSave({
        ...formData,
        imageUrl
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter category name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter category description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              type="color"
              value={formData.color || "#000000"}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>
        </div>

        {/* Category Image Upload */}
        <div>
          <Label>Category Image (Recommended)</Label>
          <p className="text-sm text-gray-500 mb-2">
            Adding an image helps customers identify your category easily
          </p>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Category preview"
                  className="max-w-full h-24 object-cover mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null)
                    setUploadedImage(null)
                    setFormData(prev => ({ ...prev, imageUrl: undefined }))
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop an image here, or{' '}
                  <label className="text-blue-600 cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 400x200px, JPG or PNG
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive !== false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col' : ''} justify-end gap-2`}>
        {isMobile ? (
          <>
            <DrawerClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Category"}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Category"}
            </Button>
          </>
        )}
      </div>
    </form>
  )
}

// Menu Item Form Component
function MenuItemForm({ 
  item, 
  onSave, 
  onCancel, 
  categories,
  isMobile = false
}: { 
  item: Partial<MenuItem>
  onSave: (data: Partial<MenuItem>) => Promise<void>
  onCancel: () => void
  categories: MenuCategory[]
  isMobile?: boolean
}) {
  const [formData, setFormData] = useState<Partial<MenuItem>>(item)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (item.imageUrl) {
      setImagePreview(item.imageUrl)
    }
  }, [item.imageUrl])

  const handleImageUpload = (file: File) => {
    setUploadedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      let imageUrl = formData.imageUrl

      // Upload image if a new one was selected
      if (uploadedImage) {
        const imageFormData = new FormData()
        imageFormData.append('image', uploadedImage)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.url
        }
      }

      await onSave({
        ...formData,
        imageUrl
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter item name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter item description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Selling Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="mrp">MRP (Optional)</Label>
            <Input
              id="mrp"
              type="number"
              step="0.01"
              min="0"
              value={formData.mrp || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, mrp: parseFloat(e.target.value) || undefined }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.categoryId || ""}
              onValueChange={(value) => {
                const selectedCategory = categories.find(cat => cat.id === value)
                setFormData(prev => ({ 
                  ...prev, 
                  categoryId: value,
                  category: selectedCategory?.name || ""
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="preparationTime">Prep Time (mins)</Label>
            <Input
              id="preparationTime"
              type="number"
              min="1"
              value={formData.preparationTime || 15}
              onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 15 }))}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label>Item Image</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-32 object-cover mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null)
                    setUploadedImage(null)
                    setFormData(prev => ({ ...prev, imageUrl: undefined }))
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop an image here, or{' '}
                  <label className="text-blue-600 cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                    />
                  </label>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isVeg"
              checked={formData.isVeg !== false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVeg: checked }))}
            />
            <Label htmlFor="isVeg">Vegetarian</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isAvailable"
              checked={formData.isAvailable !== false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
            />
            <Label htmlFor="isAvailable">Available</Label>
          </div>
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col' : ''} justify-end gap-2`}>
        {isMobile ? (
          <>
            <DrawerClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
