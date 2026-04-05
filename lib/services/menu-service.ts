/**
 * Menu Service
 * Handles menu item and category business logic
 */

import { Op } from 'sequelize'
import { MenuItem, MenuCategory, Vendor } from '@/models'
import { ServiceError } from '@/lib/api-response'

export interface CreateMenuItemData {
  vendorId: string
  name: string
  description?: string
  price: number
  mrp?: number
  category?: string
  categoryId?: string
  imageUrl?: string
  isAvailable?: boolean
  isVegetarian?: boolean
  preparationTime?: number
  ingredients?: string | string[]
  allergens?: string[]
  tags?: string[]
  nutritionalInfo?: Record<string, number>
  hasStock?: boolean
  stockQuantity?: number
  minStockLevel?: number
  maxStockLevel?: number
  stockUnit?: string
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {}

export interface CreateCategoryData {
  vendorId: string
  name: string
  description?: string
  color?: string
  displayOrder?: number
  isActive?: boolean
}

export interface UpdateCategoryData extends Partial<Omit<CreateCategoryData, 'vendorId'>> {}

export interface MenuFilters {
  category?: string
  status?: string
  isAvailable?: boolean
  search?: string
}

export class MenuService {
  /**
   * Get vendor menu items and categories
   */
  static async getVendorMenu(vendorId: string, filters?: MenuFilters) {
    const whereClause: any = { vendorId }
    
    if (filters?.category) whereClause.category = filters.category
    if (filters?.status) whereClause.status = filters.status
    if (filters?.isAvailable !== undefined) whereClause.isAvailable = filters.isAvailable
    if (filters?.search) {
      whereClause.name = { [Op.like]: `%${filters.search}%` }
    }

    const menuItems = await MenuItem.findAll({
      where: whereClause,
      include: [
        {
          model: MenuCategory,
          as: 'menuCategory',
          attributes: ['id', 'name', 'color'],
        },
      ],
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    })

    const categories = await MenuCategory.findAll({
      where: { vendorId, isActive: true },
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC'],
      ],
    })

    return { menuItems, categories }
  }

  /**
   * Get single menu item
   */
  static async getMenuItem(itemId: string) {
    const menuItem = await MenuItem.findByPk(itemId, {
      include: [
        {
          model: MenuCategory,
          as: 'menuCategory',
          attributes: ['id', 'name', 'color'],
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'stallName', 'vendorName'],
        },
      ],
    })

    if (!menuItem) {
      throw new ServiceError('Menu item not found', 404, 'ITEM_NOT_FOUND')
    }

    return menuItem
  }

  /**
   * Create menu item
   */
  static async createMenuItem(data: CreateMenuItemData, userId?: string, isAdmin = false) {
    // Verify vendor exists
    const vendor = await Vendor.findByPk(data.vendorId)
    if (!vendor) {
      throw new ServiceError('Vendor not found', 404, 'VENDOR_NOT_FOUND')
    }

    // Check authorization
    if (!isAdmin && userId && vendor.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    // Validate required fields
    if (!data.name || !data.price) {
      throw new ServiceError('Name and selling price are required fields', 400, 'VALIDATION_ERROR')
    }

    // Validate price values
    if (data.mrp && data.price > data.mrp) {
      throw new ServiceError('Selling price cannot be greater than MRP', 400, 'VALIDATION_ERROR')
    }

    // Clean up data
    const cleanedData = {
      vendorId: data.vendorId,
      name: data.name,
      description: data.description || null,
      price: parseFloat(String(data.price)),
      mrp: data.mrp ? parseFloat(String(data.mrp)) : null,
      category: data.category || null,
      categoryId: data.categoryId || null,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable !== false,
      isVegetarian: data.isVegetarian !== false,
      preparationTime: parseInt(String(data.preparationTime)) || 15,
      ingredients: Array.isArray(data.ingredients) 
        ? data.ingredients.join(', ') 
        : (data.ingredients || null),
      allergens: Array.isArray(data.allergens) ? data.allergens : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      nutritionInfo: data.nutritionalInfo || {},
      hasStock: data.hasStock || false,
      stockQuantity: data.hasStock ? (parseInt(String(data.stockQuantity)) || null) : null,
      minStockLevel: data.hasStock ? (parseInt(String(data.minStockLevel)) || 5) : null,
      maxStockLevel: data.hasStock ? (parseInt(String(data.maxStockLevel)) || 100) : null,
      stockUnit: data.hasStock ? (data.stockUnit || 'pieces') : null,
      status: data.hasStock && (parseInt(String(data.stockQuantity)) || 0) === 0 ? 'out_of_stock' : 'active',
    }

    const menuItem = await MenuItem.create(cleanedData)
    return menuItem
  }

  /**
   * Update menu item
   */
  static async updateMenuItem(itemId: string, data: UpdateMenuItemData, userId?: string, isAdmin = false) {
    const menuItem = await MenuItem.findByPk(itemId, {
      include: [{ model: Vendor, as: 'vendor' }],
    })

    if (!menuItem) {
      throw new ServiceError('Menu item not found', 404, 'ITEM_NOT_FOUND')
    }

    // Check authorization
    // @ts-ignore
    if (!isAdmin && userId && menuItem.vendor?.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    // Validate price values
    if (data.mrp && data.price && data.price > data.mrp) {
      throw new ServiceError('Selling price cannot be greater than MRP', 400, 'VALIDATION_ERROR')
    }

    await menuItem.update(data)
    return menuItem
  }

  /**
   * Delete menu item
   */
  static async deleteMenuItem(itemId: string, userId?: string, isAdmin = false) {
    const menuItem = await MenuItem.findByPk(itemId, {
      include: [{ model: Vendor, as: 'vendor' }],
    })

    if (!menuItem) {
      throw new ServiceError('Menu item not found', 404, 'ITEM_NOT_FOUND')
    }

    // Check authorization
    // @ts-ignore
    if (!isAdmin && userId && menuItem.vendor?.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    await menuItem.destroy()
    return { success: true }
  }

  /**
   * Toggle menu item availability
   */
  static async toggleItemAvailability(itemId: string, isAvailable: boolean, userId?: string) {
    const menuItem = await MenuItem.findByPk(itemId, {
      include: [{ model: Vendor, as: 'vendor' }],
    })

    if (!menuItem) {
      throw new ServiceError('Menu item not found', 404, 'ITEM_NOT_FOUND')
    }

    // @ts-ignore
    if (userId && menuItem.vendor?.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    await menuItem.update({ isAvailable })
    return menuItem
  }

  /**
   * Get vendor categories
   */
  static async getVendorCategories(vendorId: string) {
    const categories = await MenuCategory.findAll({
      where: { vendorId },
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC'],
      ],
    })

    return categories
  }

  /**
   * Create category
   */
  static async createCategory(data: CreateCategoryData, userId?: string, isAdmin = false) {
    // Verify vendor exists
    const vendor = await Vendor.findByPk(data.vendorId)
    if (!vendor) {
      throw new ServiceError('Vendor not found', 404, 'VENDOR_NOT_FOUND')
    }

    // Check authorization
    if (!isAdmin && userId && vendor.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    // Check for duplicate category name
    const existingCategory = await MenuCategory.findOne({
      where: {
        vendorId: data.vendorId,
        name: data.name,
      },
    })

    if (existingCategory) {
      throw new ServiceError('A category with this name already exists', 409, 'DUPLICATE_CATEGORY')
    }

    // Get max display order
    const maxOrder = await MenuCategory.max('displayOrder', {
      where: { vendorId: data.vendorId },
    }) || 0

    const category = await MenuCategory.create({
      ...data,
      displayOrder: data.displayOrder ?? (maxOrder as number) + 1,
      isActive: data.isActive !== false,
    })

    return category
  }

  /**
   * Update category
   */
  static async updateCategory(categoryId: string, data: UpdateCategoryData, userId?: string, isAdmin = false) {
    const category = await MenuCategory.findByPk(categoryId, {
      include: [{ model: Vendor, as: 'vendor' }],
    })

    if (!category) {
      throw new ServiceError('Category not found', 404, 'CATEGORY_NOT_FOUND')
    }

    // @ts-ignore
    if (!isAdmin && userId && category.vendor?.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== category.name) {
      const existingCategory = await MenuCategory.findOne({
        where: {
          // @ts-ignore
          vendorId: category.vendorId,
          name: data.name,
          id: { [Op.ne]: categoryId },
        },
      })

      if (existingCategory) {
        throw new ServiceError('A category with this name already exists', 409, 'DUPLICATE_CATEGORY')
      }
    }

    await category.update(data)
    return category
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryId: string, userId?: string, isAdmin = false) {
    const category = await MenuCategory.findByPk(categoryId, {
      include: [{ model: Vendor, as: 'vendor' }],
    })

    if (!category) {
      throw new ServiceError('Category not found', 404, 'CATEGORY_NOT_FOUND')
    }

    // @ts-ignore
    if (!isAdmin && userId && category.vendor?.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    // Check if category has items
    const itemCount = await MenuItem.count({
      where: { categoryId },
    })

    if (itemCount > 0) {
      throw new ServiceError(
        `Cannot delete category with ${itemCount} items. Please reassign or delete items first.`,
        400,
        'CATEGORY_HAS_ITEMS'
      )
    }

    await category.destroy()
    return { success: true }
  }

  /**
   * Search menu items across all vendors in a court
   */
  static async searchMenuItems(courtId: string, query: string, filters?: { category?: string; vendorId?: string }) {
    const whereClause: any = {
      isAvailable: true,
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
      ],
    }

    if (filters?.category) whereClause.category = filters.category

    const vendorWhere: any = { courtId, status: 'active' }
    if (filters?.vendorId) vendorWhere.id = filters.vendorId

    const items = await MenuItem.findAll({
      where: whereClause,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          where: vendorWhere,
          attributes: ['id', 'stallName', 'vendorName', 'logoUrl'],
        },
        {
          model: MenuCategory,
          as: 'menuCategory',
          attributes: ['id', 'name'],
        },
      ],
      limit: 50,
      order: [['name', 'ASC']],
    })

    return items
  }
}
