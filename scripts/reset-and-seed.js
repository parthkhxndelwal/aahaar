/**
 * reset-and-seed.js
 *
 * Completely wipes the database, recreates all tables via Sequelize sync,
 * then seeds it with a minimal but complete dataset for exploratory testing.
 *
 * Seed data overview:
 *   - 1 Court         → "KR Mangalam University"  (courtId: "kr-mangalam")
 *   - 1 Admin user    → admin@krmu.edu.in / Admin@123
 *   - 3 Vendor users  → vendors with realistic emails / Vendor@123
 *   - 1 Customer user → student@krmu.edu.in / Student@123
 *   - 3 Vendor stalls → each with 2 menu categories and 5 menu items
 *   - CourtSettings   → default settings for the court
 *
 * Now includes placeholder images for:
 *   - Court logo and banner
 *   - Vendor logos and banners
 *   - Menu category images
 *   - Menu item images
 *
 * Run: node scripts/reset-and-seed.js
 */

require("dotenv").config()

const bcrypt = require("bcryptjs")

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuid() {
  // Simple RFC-4122 v4 UUID without an external package
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12)
}

// ─── Image URLs ──────────────────────────────────────────────────────────────
// Using Unsplash for high-quality placeholder images

const IMAGES = {
  // Court images
  court: {
    logo: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop",
  },
  
  // Vendor images - logos and banners
  vendors: {
    desiKitchen: {
      logo: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop",
      banner: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400&fit=crop",
    },
    southSpice: {
      logo: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=200&h=200&fit=crop",
      banner: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&h=400&fit=crop",
    },
    fastBites: {
      logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
      banner: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&h=400&fit=crop",
    },
  },
  
  // Category images
  categories: {
    meals: "https://img.freepik.com/premium-vector/burger-icon-logo-vector_880237-264.jpg",
    snacks: "https://thumbs.dreamstime.com/b/flat-colored-french-fries-icon-suitable-fast-food-menus-snack-bars-side-dishes-casual-dining-themes-snacks-424285849.jpg",
    dosas: "https://static.vecteezy.com/system/resources/previews/053/308/542/non_2x/masala-dosa-indian-symbol-illustration-vector.jpg",
    beverages: "https://png.pngtree.com/png-clipart/20190903/original/pngtree-red-drink-icon-png-image_4432653.jpg",
    burgers: "https://img.freepik.com/premium-vector/burger-icon-logo-vector_880237-264.jpg",
    sides: "https://thumbs.dreamstime.com/b/flat-colored-french-fries-icon-suitable-fast-food-menus-snack-bars-side-dishes-casual-dining-themes-snacks-424285849.jpg",
    thali: "https://thumbs.dreamstime.com/b/vector-food-icon-set-pizza-meals-breakfast-dishes-white-background-illustrated-indian-thali-rice-dal-vegetable-426394443.jpg",
  },
  
  // Menu item images
  menuItems: {
    // North Indian
    rajmaChawal: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop",
    dalMakhani: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop",
    paneerButterMasala: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop",
    samosa: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop",
    alooTikki: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop",
    
    // South Indian
    masalaDosa: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=400&fit=crop",
    idli: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&fit=crop",
    uttapam: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=400&fit=crop",
    filterCoffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop",
    masalaChai: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop",
    
    // Fast Food
    vegBurger: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&h=400&fit=crop",
    paneerKathiRoll: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop",
    chickenWrap: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=400&fit=crop",
    frenchFries: "https://images.unsplash.com/photo-1630384060421-cb20aed29b3e?w=400&h=400&fit=crop",
    coldCoffee: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop",
  },
}

// ─── Models ──────────────────────────────────────────────────────────────────

const models = require("../models")
const {
  sequelize,
  Court,
  CourtSettings,
  User,
  Vendor,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  PaymentRequest,
  Cart,
  CartItem,
  AuditLog,
  OTP,
} = models

// ─── Wipe ────────────────────────────────────────────────────────────────────

async function wipeDatabase() {
  console.log("\n[1/3] Wiping database …")

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;")

  // Child tables first, then parents
  const tables = [
    { name: "audit_logs",       model: AuditLog },
    { name: "otps",             model: OTP },
    { name: "cart_items",       model: CartItem },
    { name: "carts",            model: Cart },
    { name: "order_items",      model: OrderItem },
    { name: "payments",         model: Payment },
    { name: "payment_requests", model: PaymentRequest },
    { name: "orders",           model: Order },
    { name: "menu_items",       model: MenuItem },
    { name: "menu_categories",  model: MenuCategory },
    { name: "vendors",          model: Vendor },
    { name: "users",            model: User },
    { name: "court_settings",   model: CourtSettings },
    { name: "courts",           model: Court },
  ]

  for (const { name, model } of tables) {
    try {
      const count = await model.count()
      if (count > 0) {
        await model.destroy({ where: {}, truncate: false, force: true })
        console.log(`   deleted ${count.toString().padStart(4)} rows  →  ${name}`)
      } else {
        console.log(`   (empty)               →  ${name}`)
      }
      
      // Drop the table completely to remove all indexes
      await sequelize.query(`DROP TABLE IF EXISTS ${name};`)
    } catch (err) {
      // Table might not exist yet — that's fine, sync will create it
      if (err.original && err.original.code === "ER_NO_SUCH_TABLE") {
        console.log(`   (table missing)       →  ${name}  (will be created by sync)`)
      } else {
        // Silently continue for other errors during drop
      }
    }
  }

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;")
  console.log("   All tables wiped and dropped.")
}

// ─── Sync (create / update tables) ───────────────────────────────────────────

async function syncTables() {
  console.log("\n[2/3] Syncing table schemas …")
  // Use force:true to drop and recreate all tables from scratch
  // This ensures all columns defined in models are properly created
  await sequelize.sync({ force: true })
  console.log("   All tables recreated from models.")
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedDatabase() {
  console.log("\n[3/3] Seeding data …")

  // ── Court ────────────────────────────────────────────────────────────────
  const courtId = "kr-mangalam"

  const court = await Court.create({
    id: uuid(),
    courtId,
    instituteName: "KR Mangalam University",
    instituteType: "college",
    contactEmail: "admin@krmu.edu.in",
    contactPhone: "9876543210",
    address: "KR Mangalam University Campus, Delhi",
    status: "active",
    logoUrl: IMAGES.court.logo,
    bannerUrl: IMAGES.court.banner,
    subscriptionPlan: "premium",
    subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    timezone: "Asia/Kolkata",
    operatingHours: {
      monday:    { open: "08:00", close: "20:00", closed: false },
      tuesday:   { open: "08:00", close: "20:00", closed: false },
      wednesday: { open: "08:00", close: "20:00", closed: false },
      thursday:  { open: "08:00", close: "20:00", closed: false },
      friday:    { open: "08:00", close: "20:00", closed: false },
      saturday:  { open: "09:00", close: "18:00", closed: false },
      sunday:    { open: "09:00", close: "14:00", closed: true  },
    },
  })
  console.log(`   Court          →  ${court.instituteName}  (${courtId})`)

  // ── CourtSettings ────────────────────────────────────────────────────────
  await CourtSettings.create({
    id: uuid(),
    courtId,
    allowOnlinePayments: true,
    allowCOD: true,
    maxOrdersPerUser: 5,
    orderBufferTime: 5,
    allowedEmailDomains: [],
    requireEmailVerification: false,
    requirePhoneVerification: false,
    platformFeePercentage: 2.5,
    minimumOrderAmount: 0,
    maximumOrderAmount: 5000,
    autoAcceptOrders: false,
    orderCancellationWindow: 5,
    themeSettings: {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      accentColor: "#F59E0B",
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    },
    integrationSettings: {
      razorpayEnabled: true,
      cloudinaryEnabled: true,
    },
  })
  console.log(`   CourtSettings  →  created for ${courtId}`)

  // ── Admin user ───────────────────────────────────────────────────────────
  const adminId = uuid()
  const adminPassword = await hashPassword("Admin@123")

  await User.create({
    id: adminId,
    courtId,
    email: "admin@krmu.edu.in",
    phone: "9876543210",
    fullName: "Rajesh Kumar",
    password: adminPassword,
    role: "admin",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    profileCompleted: true,
    managedCourtIds: [courtId],
    preferences: {
      notifications: { email: true, sms: false, push: true },
      paymentMethod: "online",
    },
    metadata: { seeded: true },
  })
  console.log(`   Admin user     →  admin@krmu.edu.in  /  Admin@123`)

  // ── Customer user ────────────────────────────────────────────────────────
  const customerId = uuid()
  const customerPassword = await hashPassword("Student@123")

  await User.create({
    id: customerId,
    courtId,
    email: "student@krmu.edu.in",
    phone: "9123456789",
    fullName: "Priya Sharma",
    password: customerPassword,
    role: "user",
    status: "active",
    emailVerified: true,
    phoneVerified: true,
    profileCompleted: true,
    preferences: {
      notifications: { email: true, sms: false, push: true },
      paymentMethod: "online",
    },
    metadata: { seeded: true },
  })
  console.log(`   Customer user  →  student@krmu.edu.in  /  Student@123`)

  // ── Vendor definitions ───────────────────────────────────────────────────
  const vendorDefs = [
    {
      stallName: "The Desi Kitchen",
      vendorName: "Ramesh Sharma",
      email: "ramesh.sharma@krmu.edu.in",
      phone: "9800123456",
      cuisineType: "North Indian",
      description: "Authentic North Indian home-style meals, thalis, and snacks. Experience the taste of traditional Indian cooking.",
      logoUrl: IMAGES.vendors.desiKitchen.logo,
      bannerUrl: IMAGES.vendors.desiKitchen.banner,
      bankAccountNumber: "1234567890123456",
      bankIfscCode: "HDFC0001234",
      bankAccountHolderName: "Ramesh Sharma",
      bankName: "HDFC Bank",
      categories: [
        {
          name: "Meals & Thalis",
          color: "#EF4444",
          imageUrl: IMAGES.categories.meals,
          items: [
            { name: "Rajma Chawal", price: 80, mrp: 90, isVegetarian: true, spiceLevel: "medium", preparationTime: 10, description: "Kidney bean curry with steamed basmati rice, served with pickles and salad", imageUrl: IMAGES.menuItems.rajmaChawal },
            { name: "Dal Makhani", price: 70, mrp: 80, isVegetarian: true, spiceLevel: "mild", preparationTime: 12, description: "Slow-cooked black lentils in rich butter and cream, a Punjabi classic", imageUrl: IMAGES.menuItems.dalMakhani },
            { name: "Paneer Butter Masala", price: 110, mrp: 130, isVegetarian: true, spiceLevel: "medium", preparationTime: 15, description: "Soft paneer cubes in creamy tomato-based gravy with butter", imageUrl: IMAGES.menuItems.paneerButterMasala },
          ],
        },
        {
          name: "Snacks & Starters",
          color: "#F59E0B",
          imageUrl: IMAGES.categories.snacks,
          items: [
            { name: "Samosa (2 pcs)", price: 20, mrp: 25, isVegetarian: true, spiceLevel: "medium", preparationTime: 5, description: "Crispy golden pastry filled with spiced potatoes and peas", imageUrl: IMAGES.menuItems.samosa },
            { name: "Aloo Tikki", price: 30, mrp: 35, isVegetarian: true, spiceLevel: "medium", preparationTime: 7, description: "Shallow-fried spiced potato patties served with mint and tamarind chutney", imageUrl: IMAGES.menuItems.alooTikki },
          ],
        },
      ],
    },
    {
      stallName: "South Spice",
      vendorName: "Suresh Pillai",
      email: "suresh.pillai@krmu.edu.in",
      phone: "9800234567",
      cuisineType: "South Indian",
      description: "Crispy dosas, fluffy idlis, and authentic South Indian filter coffee. Taste of Karnataka and Tamil Nadu.",
      logoUrl: IMAGES.vendors.southSpice.logo,
      bannerUrl: IMAGES.vendors.southSpice.banner,
      bankAccountNumber: "9876543210987654",
      bankIfscCode: "ICIC0002345",
      bankAccountHolderName: "Suresh Pillai",
      bankName: "ICICI Bank",
      categories: [
        {
          name: "Dosas & Idlis",
          color: "#10B981",
          imageUrl: IMAGES.categories.dosas,
          items: [
            { name: "Masala Dosa", price: 60, mrp: 70, isVegetarian: true, spiceLevel: "mild", preparationTime: 10, description: "Crispy golden rice crepe filled with spiced potato masala, served with sambar and coconut chutney", imageUrl: IMAGES.menuItems.masalaDosa },
            { name: "Plain Idli (3 pcs)", price: 40, mrp: 50, isVegetarian: true, spiceLevel: "mild", preparationTime: 8, description: "Soft steamed rice cakes served with hot sambar and coconut chutney", imageUrl: IMAGES.menuItems.idli },
            { name: "Onion Uttapam", price: 55, mrp: 65, isVegetarian: true, spiceLevel: "mild", preparationTime: 12, description: "Thick rice pancake topped with onions and tomatoes, served with sambar", imageUrl: IMAGES.menuItems.uttapam },
          ],
        },
        {
          name: "Beverages",
          color: "#6366F1",
          imageUrl: IMAGES.categories.beverages,
          items: [
            { name: "Filter Coffee", price: 25, mrp: 30, isVegetarian: true, spiceLevel: null, preparationTime: 3, description: "Authentic South Indian filter coffee brewed fresh, served hot", imageUrl: IMAGES.menuItems.filterCoffee },
            { name: "Masala Chai", price: 15, mrp: 20, isVegetarian: true, spiceLevel: null, preparationTime: 3, description: "Aromatic spiced milk tea with ginger and cardamom", imageUrl: IMAGES.menuItems.masalaChai },
          ],
        },
      ],
    },
    {
      stallName: "Fast Bites",
      vendorName: "Priya Patel",
      email: "priya.patel@krmu.edu.in",
      phone: "9800345678",
      cuisineType: "Fast Food",
      description: "Quick bites for hungry students! Burgers, wraps, fries, and refreshing cold drinks.",
      logoUrl: IMAGES.vendors.fastBites.logo,
      bannerUrl: IMAGES.vendors.fastBites.banner,
      bankAccountNumber: "5678901234567890",
      bankIfscCode: "SBIN0003456",
      bankAccountHolderName: "Priya Patel",
      bankName: "State Bank of India",
      categories: [
        {
          name: "Burgers & Wraps",
          color: "#EC4899",
          imageUrl: IMAGES.categories.burgers,
          items: [
            { name: "Veg Burger", price: 70, mrp: 80, isVegetarian: true, spiceLevel: "mild", preparationTime: 8, description: "Crispy veggie patty with lettuce, tomato, and special sauce in a soft bun", imageUrl: IMAGES.menuItems.vegBurger },
            { name: "Paneer Kathi Roll", price: 80, mrp: 90, isVegetarian: true, spiceLevel: "medium", preparationTime: 8, description: "Spiced paneer tikka wrapped in a flaky paratha with onions and chutney", imageUrl: IMAGES.menuItems.paneerKathiRoll },
            { name: "Chicken Wrap", price: 100, mrp: 110, isVegetarian: false, spiceLevel: "medium", preparationTime: 10, description: "Grilled chicken strips with fresh veggies and mayo wrapped in a tortilla", imageUrl: IMAGES.menuItems.chickenWrap },
          ],
        },
        {
          name: "Sides & Drinks",
          color: "#8B5CF6",
          imageUrl: IMAGES.categories.sides,
          items: [
            { name: "French Fries", price: 50, mrp: 60, isVegetarian: true, spiceLevel: "mild", preparationTime: 6, description: "Crispy golden potato fries served hot with ketchup", imageUrl: IMAGES.menuItems.frenchFries },
            { name: "Cold Coffee", price: 60, mrp: 70, isVegetarian: true, spiceLevel: null, preparationTime: 4, description: "Chilled blended coffee with ice cream and whipped cream", imageUrl: IMAGES.menuItems.coldCoffee },
          ],
        },
      ],
    },
  ]

  for (const def of vendorDefs) {
    // Vendor user
    const userId = uuid()
    const vendorPassword = await hashPassword("Vendor@123")

    await User.create({
      id: userId,
      courtId,
      email: def.email,
      phone: def.phone,
      fullName: def.vendorName,
      password: vendorPassword,
      role: "vendor",
      status: "active",
      emailVerified: true,
      phoneVerified: true,
      profileCompleted: true,
      preferences: {
        notifications: { email: true, sms: false, push: true },
        paymentMethod: "online",
      },
      metadata: { seeded: true },
    })

    // Vendor stall
    const vendorId = uuid()
    await Vendor.create({
      id: vendorId,
      courtId,
      userId,
      stallName: def.stallName,
      stallLocation: "Food Court, Ground Floor",
      vendorName: def.vendorName,
      contactEmail: def.email,
      contactPhone: def.phone,
      cuisineType: def.cuisineType,
      description: def.description,
      logoUrl: def.logoUrl,
      bannerUrl: def.bannerUrl,
      status: "active",
      isOnline: true,
      rating: (3.5 + Math.random() * 1.5).toFixed(1), // Random rating between 3.5-5.0
      onboardingStatus: "completed",
      onboardingStep: "completed",
      onboardingCompletedAt: new Date(),
      onboardingStartedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      panNumber: "ABCDE1234F",  // dummy valid-format PAN
      bankAccountNumber: def.bankAccountNumber,
      bankIfscCode: def.bankIfscCode,
      bankAccountHolderName: def.bankAccountHolderName,
      bankName: def.bankName,
      maxConcurrentOrders: 15,
      maxOrdersPerHour: 20,
      averagePreparationTime: 10,
      settings: {
        acceptCOD: true,
        acceptOnlinePayment: true,
        orderBufferTime: 5,
        autoAcceptOrders: true,
      },
      metadata: { seeded: true },
    })

    // Categories + menu items
    let catOrder = 1
    for (const catDef of def.categories) {
      const categoryId = uuid()
      await MenuCategory.create({
        id: categoryId,
        vendorId,
        name: catDef.name,
        displayOrder: catOrder++,
        isActive: true,
        color: catDef.color,
        imageUrl: catDef.imageUrl,
      })

      let itemOrder = 1
      for (const itemDef of catDef.items) {
        await MenuItem.create({
          id: uuid(),
          vendorId,
          categoryId,
          category: catDef.name,
          name: itemDef.name,
          description: itemDef.description,
          price: itemDef.price,
          mrp: itemDef.mrp,
          imageUrl: itemDef.imageUrl,
          isAvailable: true,
          isVegetarian: itemDef.isVegetarian,
          isVegan: false,
          isJainFriendly: false,
          spiceLevel: itemDef.spiceLevel,
          preparationTime: itemDef.preparationTime,
          status: "active",
          displayOrder: itemOrder++,
          hasStock: false,
          metadata: { seeded: true },
        })
      }
    }

    console.log(`   Vendor stall   →  ${def.stallName}  (${def.email}  /  Vendor@123)`)
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(70))
  console.log("  SEED COMPLETE — Login credentials")
  console.log("─".repeat(70))
  console.log("  Role      Email                              Password")
  console.log("─".repeat(70))
  console.log("  admin     admin@krmu.edu.in                  Admin@123")
  console.log("  customer  student@krmu.edu.in                Student@123")
  console.log("  vendor    ramesh.sharma@krmu.edu.in          Vendor@123")
  console.log("  vendor    suresh.pillai@krmu.edu.in          Vendor@123")
  console.log("  vendor    priya.patel@krmu.edu.in            Vendor@123")
  console.log("─".repeat(70))
  console.log(`  Court ID : ${courtId}`)
  console.log("─".repeat(70))
  console.log("  Images added for:")
  console.log("    - Court logo & banner")
  console.log("    - All vendor logos & banners")
  console.log("    - All category images")
  console.log("    - All menu item images")
  console.log("─".repeat(70))
  console.log("  No orders, payments, or carts exist — clean slate.")
  console.log("─".repeat(70))
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60))
  console.log("  AAHAAR  —  Database Reset & Seed")
  console.log(`  Environment : ${process.env.NODE_ENV || "development"}`)
  console.log(`  Database    : ${require("../config/database")[process.env.NODE_ENV || "development"].database}`)
  console.log(`  Host        : ${require("../config/database")[process.env.NODE_ENV || "development"].host}`)
  console.log("=".repeat(60))

  try {
    await sequelize.authenticate()
    console.log("  DB connection OK")

    await wipeDatabase()
    await syncTables()
    await seedDatabase()

    console.log("\n  Done. The app is ready for exploratory testing.\n")
  } catch (err) {
    console.error("\n  FATAL:", err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

main()
