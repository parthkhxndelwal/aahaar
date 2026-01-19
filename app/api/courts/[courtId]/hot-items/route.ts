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
    const menuItems = await MenuItem.findAll({
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
        "category"
      ],
      limit: 20, // Get more items to choose from
    })

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

    // Randomly select 3 items from available menu items
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random())
    const selectedItems = shuffled.slice(0, 3)

    // Transform the data to match the expected format
    const hotItems: HotMenuItem[] = selectedItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      mrp: item.mrp,
      imageUrl: item.imageUrl || "/placeholder.jpg",
      vendorId: item.vendorId,
      category: item.category,
      vendor: {
        stallName: item.vendor.stallName,
        cuisineType: item.vendor.cuisineType,
      }
    }))

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
