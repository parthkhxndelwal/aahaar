import { NextRequest, NextResponse } from "next/server"
import { MenuItem, Vendor, MenuCategory } from "@/models"
import { Op, fn, col, literal } from "sequelize"

interface CategorySummary {
  name: string
  slug: string
  itemCount: number
  imageUrl?: string
  color?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await params

    // Get all active vendors in this court
    const activeVendors = await Vendor.findAll({
      where: {
        courtId,
        status: "active",
      },
      attributes: ["id"],
    })

    const vendorIds = activeVendors.map((v: any) => v.id)

    if (vendorIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { categories: [] },
      })
    }

    // Get unique categories from menu items with counts
    // Using the 'category' string field for now as it's more widely populated
    const categoriesFromItems = await MenuItem.findAll({
      where: {
        vendorId: { [Op.in]: vendorIds },
        status: "active",
        isAvailable: true,
        category: { [Op.ne]: null },
      },
      attributes: [
        "category",
        [fn("COUNT", col("id")), "itemCount"],
      ],
      group: ["category"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      raw: true,
    })

    // Also get MenuCategory records if they have images/colors
    const menuCategories = await MenuCategory.findAll({
      where: {
        vendorId: { [Op.in]: vendorIds },
        isActive: true,
      },
      attributes: ["name", "imageUrl", "color"],
      raw: true,
    })

    // Create a map for quick lookup
    const categoryMetaMap = new Map<string, { imageUrl?: string; color?: string }>()
    menuCategories.forEach((cat: any) => {
      categoryMetaMap.set(cat.name.toLowerCase(), {
        imageUrl: cat.imageUrl,
        color: cat.color,
      })
    })

    // Build the response with category metadata
    const categories: CategorySummary[] = (categoriesFromItems as any[]).map((cat) => {
      const meta = categoryMetaMap.get(cat.category?.toLowerCase()) || {}
      return {
        name: cat.category,
        slug: cat.category?.toLowerCase().replace(/\s+/g, "-") || "",
        itemCount: parseInt(cat.itemCount, 10),
        imageUrl: meta.imageUrl,
        color: meta.color,
      }
    })

    // Filter out any with empty names and sort alphabetically
    const validCategories = categories
      .filter((c) => c.name && c.name.trim())
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      data: { categories: validCategories },
    })
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
