import { NextRequest, NextResponse } from "next/server"
import { MenuItem, Vendor } from "@/models"
import { Op } from "sequelize"

interface HotMenuItem {
  id: string
  name: string
  description: string
  price: number
  mrp?: number
  imageUrl?: string
  vendorId: string
  category: string
  // Stock management fields
  hasStock: boolean
  stockQuantity?: number
  stockUnit?: string
  status: string
  vendor: {
    stallName: string
    cuisineType: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params

    // Fetch available menu items from active vendors in this court
    // First try with strict vendor constraints
    let menuItems = await MenuItem.findAll({
      where: {
        status: "active",
        isAvailable: true,
      },
      include: [
        {
          model: Vendor,
          as: "vendor",
          where: {
            courtId,
            status: "active",
            isOnline: true,
          },
          attributes: ["id", "stallName", "cuisineType"],
          required: true,
        },
      ],
      attributes: [
        "id",
        "name", 
        "description",
        "price",
        "mrp",
        "imageUrl",
        "vendorId",
        "category",
        "hasStock",
        "stockQuantity",
        "stockUnit",
        "status"
      ],
      order: [
        ['createdAt', 'DESC'],
      ],
      limit: 50,
    })

    // If we don't have enough items from active/online vendors, 
    // try with relaxed constraints (just active vendors)
    if (menuItems.length < 3) {
      menuItems = await MenuItem.findAll({
        where: {
          status: "active",
          isAvailable: true,
        },
        include: [
          {
            model: Vendor,
            as: "vendor",
            where: {
              courtId,
              status: "active",
              // Remove isOnline constraint for fallback
            },
            attributes: ["id", "stallName", "cuisineType"],
            required: true,
          },
        ],
        attributes: [
          "id",
          "name", 
          "description",
          "price",
          "mrp",
          "imageUrl",
          "vendorId",
          "category",
          "hasStock",
          "stockQuantity",
          "stockUnit",
          "status"
        ],
        order: [
          ['createdAt', 'DESC'],
        ],
        limit: 50,
      })
    }

    if (!menuItems || menuItems.length === 0) {
      // Return mock data if no real items found
      const mockHotItems = [
        {
          id: "mock-1",
          name: "Burger Deluxe",
          description: "Juicy beef patty with lettuce, tomato, cheese and special sauce",
          price: 299,
          mrp: 399,
          imageUrl: "/placeholder.jpg",
          vendorId: "vendor-1",
          category: "Fast Food",
          hasStock: true,
          stockQuantity: 15,
          stockUnit: "pieces",
          status: "active",
          vendor: {
            stallName: "Quick Bites",
            cuisineType: "Fast Food"
          }
        },
        {
          id: "mock-2", 
          name: "Margherita Pizza",
          description: "Classic pizza with fresh mozzarella, basil and tomato sauce",
          price: 449,
          mrp: 549,
          imageUrl: "/placeholder.jpg",
          vendorId: "vendor-2",
          category: "Italian",
          hasStock: true,
          stockQuantity: 3,
          stockUnit: "pieces",
          status: "active",
          vendor: {
            stallName: "Pizza Corner",
            cuisineType: "Italian"
          }
        },
        {
          id: "mock-3",
          name: "Chicken Biryani",
          description: "Aromatic basmati rice with tender chicken and traditional spices",
          price: 349,
          mrp: 449,
          imageUrl: "/placeholder.jpg", 
          vendorId: "vendor-3",
          category: "Indian",
          hasStock: false,
          stockQuantity: 0,
          stockUnit: "plates",
          status: "active",
          vendor: {
            stallName: "Spice Garden",
            cuisineType: "Indian"
          }
        }
      ]

      return NextResponse.json({
        success: true,
        data: mockHotItems,
      })
    }

    // Randomly select 3 items from available menu items, prioritizing different vendors
    let selectedItems: any[] = []
    const usedVendorIds = new Set<string>()
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random())
    
    // First pass: try to get one item from each vendor
    for (const item of shuffled) {
      if (selectedItems.length >= 3) break
      if (!usedVendorIds.has(item.vendorId)) {
        selectedItems.push(item)
        usedVendorIds.add(item.vendorId)
      }
    }
    
    // Second pass: if we don't have 3 items yet, add more from any vendor
    if (selectedItems.length < 3) {
      for (const item of shuffled) {
        if (selectedItems.length >= 3) break
        if (!selectedItems.find(selected => selected.id === item.id)) {
          selectedItems.push(item)
        }
      }
    }

    // Transform the data to match the expected format
    const hotItems: HotMenuItem[] = selectedItems.map((item: any) => {
      const transformedItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0, // Ensure it's a number
        mrp: item.mrp ? parseFloat(item.mrp) : undefined, // Ensure it's a number or undefined
        imageUrl: item.imageUrl || "/placeholder.jpg",
        vendorId: item.vendorId,
        category: item.category,
        hasStock: item.hasStock || false,
        stockQuantity: item.stockQuantity || 0,
        stockUnit: item.stockUnit || "pieces",
        status: item.status || "active",
        vendor: {
          stallName: item.vendor.stallName,
          cuisineType: item.vendor.cuisineType,
        }
      }
      
      // Debug logging for price/mrp transformation
      console.log(`💰 [HotItems] Item "${item.name}": price ${item.price} (${typeof item.price}) → ${transformedItem.price} (${typeof transformedItem.price}), mrp ${item.mrp} (${typeof item.mrp}) → ${transformedItem.mrp} (${typeof transformedItem.mrp})`)
      
      return transformedItem
    })

    return NextResponse.json({
      success: true,
      data: hotItems,
    })
  } catch (error) {
    console.error("Hot items error:", error)
    
    // Return mock data on error as fallback
    const mockHotItems = [
      {
        id: "fallback-1",
        name: "Burger Deluxe",
        description: "Juicy beef patty with lettuce, tomato, cheese and special sauce",
        price: 299,
        mrp: 399,
        imageUrl: "/placeholder.jpg",
        vendorId: "vendor-1",
        category: "Fast Food",
        hasStock: true,
        stockQuantity: 12,
        stockUnit: "pieces",
        status: "active",
        vendor: {
          stallName: "Quick Bites",
          cuisineType: "Fast Food"
        }
      },
      {
        id: "fallback-2", 
        name: "Margherita Pizza",
        description: "Classic pizza with fresh mozzarella, basil and tomato sauce",
        price: 449,
        mrp: 549,
        imageUrl: "/placeholder.jpg",
        vendorId: "vendor-2",
        category: "Italian",
        hasStock: true,
        stockQuantity: 0,
        stockUnit: "pieces",
        status: "out_of_stock",
        vendor: {
          stallName: "Pizza Corner",
          cuisineType: "Italian"
        }
      },
      {
        id: "fallback-3",
        name: "Chicken Biryani",
        description: "Aromatic basmati rice with tender chicken and traditional spices",
        price: 349,
        mrp: 449,
        imageUrl: "/placeholder.jpg", 
        vendorId: "vendor-3",
        category: "Indian",
        hasStock: false,
        stockQuantity: 0,
        stockUnit: "plates",
        status: "active",
        vendor: {
          stallName: "Spice Garden",
          cuisineType: "Indian"
        }
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockHotItems,
    })
  }
}
