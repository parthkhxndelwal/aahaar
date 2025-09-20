const { MenuItem, Vendor, MenuCategory } = require("@/models")

export async function GET(request) {
  try {
    console.log("=== DEBUG: Testing menu items query ===")
    
    // Test 1: Get all menu items without any filters
    const allItems = await MenuItem.findAll({
      attributes: ['id', 'name', 'description', 'isAvailable'],
      limit: 10
    })
    
    console.log("All menu items (first 10):", allItems.map(item => ({
      id: item.id,
      name: item.name,
      isAvailable: item.isAvailable
    })))
    
    // Test 2: Get items with vendor association
    const itemsWithVendor = await MenuItem.findAll({
      attributes: ['id', 'name', 'isAvailable'],
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'stallName', 'courtId', 'status'],
          required: false
        }
      ],
      limit: 5
    })
    
    console.log("Items with vendor info:", itemsWithVendor.map(item => ({
      name: item.name,
      isAvailable: item.isAvailable,
      vendor: item.vendor ? {
        stallName: item.vendor.stallName,
        courtId: item.vendor.courtId,
        status: item.vendor.status
      } : null
    })))
    
    // Test 3: Look for items containing "chole" (case insensitive)
    const choleItems = await MenuItem.findAll({
      where: {
        name: {
          [require('sequelize').Op.like]: '%chole%'
        }
      },
      attributes: ['id', 'name', 'description', 'isAvailable']
    })
    
    console.log("Items containing 'chole':", choleItems.map(item => ({
      name: item.name,
      isAvailable: item.isAvailable
    })))
    
    // Test 4: Look for items containing "Chole" (exact case)
    const CholeCaseItems = await MenuItem.findAll({
      where: {
        name: {
          [require('sequelize').Op.like]: '%Chole%'
        }
      },
      attributes: ['id', 'name', 'description', 'isAvailable']
    })
    
    console.log("Items containing 'Chole' (case sensitive):", CholeCaseItems.map(item => ({
      name: item.name,
      isAvailable: item.isAvailable
    })))

    return Response.json({
      success: true,
      data: {
        totalItems: allItems.length,
        itemsWithVendor: itemsWithVendor.length,
        choleItems: choleItems.length,
        CholeCaseItems: CholeCaseItems.length,
        sampleItems: allItems.slice(0, 3).map(item => ({
          name: item.name,
          isAvailable: item.isAvailable
        }))
      }
    })

  } catch (error) {
    console.error("Debug error:", error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}