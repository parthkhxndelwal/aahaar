const { MenuItem, Vendor, MenuCategory, sequelize } = require("@/models")
const { Op } = require("sequelize")

export async function GET(request, { params }) {
  try {
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 1) {
      return Response.json({
        success: false,
        error: "Search query must be at least 1 character long",
      }, { status: 400 })
    }

    console.log(`Searching for "${query}" in court: ${courtId}`)

    // Build search conditions with MySQL/TiDB compatible operators (case-insensitive)
    const lowerQuery = query.toLowerCase()
    
    const searchConditions = {
      [Op.and]: [
        {
          // Only show available items
          isAvailable: true,
        },
        {
          [Op.or]: [
            // Search in item name (case-insensitive using LOWER function)
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('MenuItem.name')),
              {
                [Op.like]: `%${lowerQuery}%`
              }
            ),
            // Search in description (case-insensitive using LOWER function)
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('MenuItem.description')),
              {
                [Op.like]: `%${lowerQuery}%`
              }
            )
          ]
        }
      ]
    }

    // Add additional search fields
    try {
      // Search in ingredients
      searchConditions[Op.and][1][Op.or].push(
        sequelize.where(
          sequelize.fn('LOWER', sequelize.col('MenuItem.ingredients')),
          {
            [Op.like]: `%${lowerQuery}%`
          }
        )
      )
      
      // Search in category name through association
      searchConditions[Op.and][1][Op.or].push(
        sequelize.where(
          sequelize.fn('LOWER', sequelize.col('menuCategory.name')),
          {
            [Op.like]: `%${lowerQuery}%`
          }
        )
      )
      
      // Search in vendor/stall name through association
      searchConditions[Op.and][1][Op.or].push(
        sequelize.where(
          sequelize.fn('LOWER', sequelize.col('vendor.stallName')),
          {
            [Op.like]: `%${lowerQuery}%`
          }
        )
      )
    } catch (additionalSearchError) {
      console.log("Some additional search fields skipped:", additionalSearchError.message)
    }

    // Query menu items with associations (simplified for debugging)
    const menuItems = await MenuItem.findAll({
      where: searchConditions,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          // Temporarily remove the courtId filter to see if that's the issue
          attributes: ['id', 'stallName', 'vendorName', 'cuisineType', 'courtId', 'status']
        },
        {
          model: MenuCategory,
          as: 'menuCategory',
          attributes: ['id', 'name', 'color'],
          required: false
        }
      ],
      order: [
        // Prioritize exact name matches
        ['name', 'ASC'],
        // Then by availability and price
        ['isAvailable', 'DESC'],
        ['price', 'ASC']
      ],
      limit: 50 // Limit results to prevent too many items
    })
    
    console.log("Search query results count:", menuItems.length)
    console.log("First few results:", menuItems.slice(0, 3).map(item => ({
      name: item.name,
      vendor: item.vendor ? {
        stallName: item.vendor.stallName,
        courtId: item.vendor.courtId,
        status: item.vendor.status
      } : 'No vendor'
    })))

    // Filter results to only include items from the correct court and approved/active vendors
    const filteredItems = menuItems.filter(item => 
      item.vendor && 
      item.vendor.courtId === courtId && 
      (item.vendor.status === 'approved' || item.vendor.status === 'active')
    )

    console.log("Filtered results for court:", filteredItems.length)

    // Format the response to match the expected format
    const formattedItems = filteredItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price) || 0,
      mrp: item.mrp ? parseFloat(item.mrp) : undefined,
      imageUrl: item.imageUrl,
      vendorId: item.vendorId,
      category: item.menuCategory?.name || 'Other',
      hasStock: item.hasStock || false,
      stockQuantity: item.stockQuantity || 0,
      stockUnit: item.stockUnit || 'pieces',
      status: item.isAvailable ? 'active' : 'inactive',
      vendor: {
        stallName: item.vendor?.stallName || 'Unknown Vendor',
        cuisineType: item.vendor?.cuisineType
      }
    }))

    return Response.json({
      success: true,
      data: formattedItems,
      meta: {
        query: query,
        count: formattedItems.length,
        courtId: courtId
      }
    })

  } catch (error) {
    console.error("Error searching menu items:", error)
    
    // Provide more specific error information for debugging
    const errorMessage = error.name === 'SequelizeDatabaseError' 
      ? `Database query error: ${error.message}` 
      : "Failed to search menu items"
      
    return Response.json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    }, { status: 500 })
  }
}