import { NextResponse } from "next/server"
import { Op } from "sequelize"
import db from "@/models"

// GET - List all vendors with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")
    const onboarded = searchParams.get("onboarded")
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit
    
    // Validation query parameters
    const email = searchParams.get("email")
    const phone = searchParams.get("phone")
    const stallName = searchParams.get("stallName")

    if (!courtId) {
      return NextResponse.json({ success: false, message: "Court ID is required" }, { status: 400 })
    }

    const whereClause = { courtId }

    // Handle validation queries
    if (email || phone || stallName) {
      const orConditions = []
      if (email) orConditions.push({ contactEmail: email })
      if (phone) orConditions.push({ contactPhone: phone })
      if (stallName) orConditions.push({ stallName: stallName })
      
      whereClause[Op.or] = orConditions
      
      // For validation, we only need to check existence
      const existingVendor = await db.Vendor.findOne({
        where: whereClause,
        attributes: ['id', 'contactEmail', 'contactPhone', 'stallName'],
      })
      
      return NextResponse.json({
        success: true,
        data: {
          exists: !!existingVendor,
          vendor: existingVendor,
        },
      })
    }

    if (status) {
      whereClause.status = status
    }

    // Filter based on onboarding status
    if (onboarded === "true") {
      whereClause.razorpayAccountId = { [Op.not]: null }
    } else if (onboarded === "false") {
      whereClause.razorpayAccountId = null
    }

    const vendors = await db.Vendor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "email", "fullName", "phone"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(vendors.count / limit)

    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: vendors.count,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get vendors error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new vendor
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      courtId,
      stallName,
      vendorName,
      contactEmail,
      contactPhone,
      stallLocation,
      cuisineType,
      description,
      logoUrl,
      bannerUrl,
      operatingHours,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      bankName,
      panNumber,
      gstin,
      maxOrdersPerHour,
      averagePreparationTime,
      businessType,
      onboardingStep,
      onboardingStatus,
      // New optional fields for Razorpay
      businessCategory,
      businessSubcategory,
      addressStreet1,
      addressStreet2,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
      acceptTnC,
      acceptSettlementTerms,
      confirmAccuracy,
    } = body

    // Normalize
    const normalizedEmail = contactEmail?.toLowerCase?.() || contactEmail

    // Validate required fields - PAN number is only required for final completion
    const basicRequiredFields = !courtId || !stallName || !vendorName || !contactEmail || !contactPhone
    if (basicRequiredFields) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: courtId, stallName, vendorName, contactEmail, contactPhone" },
        { status: 400 }
      )
    }

    // Check for duplicate email/phone/PAN within the same court
    const orChecks = []
    if (normalizedEmail) orChecks.push({ contactEmail: normalizedEmail })
    if (contactPhone) orChecks.push({ contactPhone })
    if (panNumber) orChecks.push({ panNumber })

    if (orChecks.length > 0) {
      const existingVendor = await db.Vendor.findOne({
        where: {
          courtId,
          [Op.or]: orChecks,
        },
        attributes: ['id', 'contactEmail', 'contactPhone', 'panNumber']
      })

      if (existingVendor) {
        let field = 'email'
        if (existingVendor.contactEmail === normalizedEmail) field = 'email'
        else if (existingVendor.contactPhone === contactPhone) field = 'phone'
        else if (panNumber && existingVendor.panNumber === panNumber) field = 'panNumber'
        return NextResponse.json(
          { 
            success: false, 
            message: `A vendor with this ${field} already exists`,
            field 
          },
          { status: 409 }
        )
      }
    }

    // Check for duplicate stall name in the same court
    const existingStall = await db.Vendor.findOne({
      where: {
        courtId,
        stallName,
      },
    })

    if (existingStall) {
      return NextResponse.json(
        { 
          success: false, 
          message: "A stall with this name already exists in this court",
          field: "stallName"
        },
        { status: 409 }
      )
    }

    // Razorpay onboarding BEFORE persisting vendor, so errors are surfaced and user can correct inputs
    const keyId = process.env.RAZORPAY_TEST_APIKEY || process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_API_SECRET || process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: "Razorpay credentials missing in environment" }, { status: 500 })
    }

    const basicAuth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const headers = { 'Authorization': basicAuth, 'Content-Type': 'application/json' }
    const rpBase = 'https://api.razorpay.com/v2'

    let razorpayAccountId = null
    let stakeholderId = null
    let productId = null
    let productActivationStatus = null
    let productRequirements = null

    // Force business category/subcategory as requested
    const rpCategory = 'food'
    const rpSubcategory = 'restaurant'

    try {
      // 1) Create Linked Account
      // Build short reference id (<20 chars)
      const stallSlug = (stallName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const shortStall = stallSlug.slice(0, 6) || 'vendor'
      const shortCourt = (courtId || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'ct'
      const ts = Date.now().toString(36).slice(-4)
      const refId = `${shortCourt}${shortStall}${ts}`.slice(0, 19)

      const accountPayload = {
        email: normalizedEmail,
        phone: contactPhone?.startsWith('+') ? contactPhone : `+91${contactPhone}`,
        type: 'route',
        reference_id: refId,
        legal_business_name: stallName,
        business_type: (businessType || 'individual').toLowerCase(),
        contact_name: vendorName,
        profile: {
          category: rpCategory,
          subcategory: rpSubcategory,
          addresses: {
            registered: {
              street1: addressStreet1 || stallLocation || 'Address Line 1',
              street2: addressStreet2 || '',
              city: addressCity || 'City',
              state: (addressState || 'STATE').toUpperCase(),
              postal_code: addressPostalCode || '000000',
              country: (addressCountry || 'IN').toUpperCase()
            }
          }
        },
        legal_info: panNumber ? { pan: panNumber } : undefined
      }

      const accRes = await fetch(`${rpBase}/accounts`, { method: 'POST', headers, body: JSON.stringify(accountPayload) })
      const accJson = await accRes.json()
      if (!accRes.ok) {
        return NextResponse.json({ success: false, message: accJson?.error?.description || accJson?.message || 'Failed to create Razorpay account', step: 'account' }, { status: 400 })
      }
      razorpayAccountId = accJson.id

      // 2) Create Stakeholder
      const residentialStreet = [addressStreet1, addressStreet2].filter(Boolean).join(', ')
      const stakeholderPayload = {
        name: vendorName,
        email: normalizedEmail,
        addresses: {
          residential: {
            street: residentialStreet || (stallLocation || 'Address'),
            city: addressCity || 'City',
            state: addressState || 'State',
            postal_code: addressPostalCode || '000000',
            country: (addressCountry || 'IN').toLowerCase(),
          }
        }
      }
      const sthRes = await fetch(`${rpBase}/accounts/${razorpayAccountId}/stakeholders`, { method: 'POST', headers, body: JSON.stringify(stakeholderPayload) })
      const sthJson = await sthRes.json()
      if (!sthRes.ok) {
        return NextResponse.json({ success: false, message: sthJson?.error?.description || sthJson?.message || 'Failed to create stakeholder', step: 'stakeholder', accountId: razorpayAccountId }, { status: 400 })
      }
      stakeholderId = sthJson.id

      // 3a) Initialize Product Configuration
      const productInitPayload = { product_name: 'route', tnc_accepted: true }
      const prdRes = await fetch(`${rpBase}/accounts/${razorpayAccountId}/products`, { method: 'POST', headers, body: JSON.stringify(productInitPayload) })
      const prdJson = await prdRes.json()
      if (!prdRes.ok) {
        return NextResponse.json({ success: false, message: prdJson?.error?.description || prdJson?.message || 'Failed to initialize product configuration', step: 'product_init', accountId: razorpayAccountId }, { status: 400 })
      }
      productId = prdJson.id

      // 3b) Update Product Configuration with settlement details
      const productPatchPayload = {
        settlements: {
          account_number: bankAccountNumber || '',
          ifsc_code: bankIfscCode || '',
          beneficiary_name: bankAccountHolderName || vendorName,
        }
      }
      const prdPatchRes = await fetch(`${rpBase}/accounts/${razorpayAccountId}/products/${productId}`, { method: 'PATCH', headers, body: JSON.stringify(productPatchPayload) })
      const prdPatchJson = await prdPatchRes.json()
      if (!prdPatchRes.ok) {
        return NextResponse.json({ success: false, message: prdPatchJson?.error?.description || prdPatchJson?.message || 'Failed to update product configuration', step: 'product_patch', accountId: razorpayAccountId, productId }, { status: 400 })
      }

      productActivationStatus = prdPatchJson.activation_status || prdJson.activation_status || 'unknown'
      productRequirements = prdPatchJson.requirements || prdJson.requirements || []

      // Persist vendor only after successful RP flow
      const vendor = await db.Vendor.create({
        courtId,
        stallName,
        vendorName,
        contactEmail: normalizedEmail,
        contactPhone,
        stallLocation: stallLocation || null,
        cuisineType: cuisineType || "general",
        description: description || null,
        logoUrl: logoUrl || null,
        bannerUrl,
        operatingHours: operatingHours || {
          monday: { open: "09:00", close: "18:00", closed: false },
          tuesday: { open: "09:00", close: "18:00", closed: false },
          wednesday: { open: "09:00", close: "18:00", closed: false },
          thursday: { open: "09:00", close: "18:00", closed: false },
          friday: { open: "09:00", close: "18:00", closed: false },
          saturday: { open: "09:00", close: "18:00", closed: false },
          sunday: { open: "09:00", close: "18:00", closed: true },
        },
        bankAccountNumber: bankAccountNumber || "",
        bankIfscCode: bankIfscCode || "",
        bankAccountHolderName: bankAccountHolderName || "",
        bankName: bankName || "",
        panNumber: panNumber || "",
        gstin,
        maxOrdersPerHour: maxOrdersPerHour || 10,
        averagePreparationTime: averagePreparationTime || 15,
        onboardingStatus: onboardingStatus || "in_progress",
        onboardingStep: onboardingStep || "password",
        onboardingStartedAt: new Date(),
        razorpayAccountId: razorpayAccountId,
        metadata: {
          ...(businessType ? { businessType } : {}),
          businessCategory: rpCategory,
          businessSubcategory: rpSubcategory,
          registeredAddress: { addressStreet1, addressStreet2, addressCity, addressState, addressPostalCode, addressCountry: addressCountry || 'IN' },
          ...(acceptTnC !== undefined ? { acceptTnC } : {}),
          ...(acceptSettlementTerms !== undefined ? { acceptSettlementTerms } : {}),
          ...(confirmAccuracy !== undefined ? { confirmAccuracy } : {}),
          stakeholderId: stakeholderId,
          productConfiguration: {
            productId,
            activation_status: productActivationStatus,
            requirements: productRequirements,
          },
          razorpayAccountStatus: 'created',
          razorpayReferenceId: refId,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Vendor created successfully",
        data: { vendor, razorpay: { accountId: razorpayAccountId, stakeholderId, productId, activationStatus: productActivationStatus, requirements: productRequirements } },
      }, { status: 201 })
    } catch (e) {
      console.error('Razorpay onboarding error:', e)
      return NextResponse.json({ success: false, message: e?.message || 'Razorpay onboarding failed' }, { status: 500 })
    }

    // If we reach here, Razorpay onboarding succeeded — now persist Vendor
    const vendor = await db.Vendor.create({
      courtId,
      stallName,
      vendorName,
      contactEmail: normalizedEmail,
      contactPhone,
      stallLocation: stallLocation || null,
      cuisineType: cuisineType || "general",
      description: description || null,
      logoUrl: logoUrl || null,
      bannerUrl,
      operatingHours: operatingHours || {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "09:00", close: "18:00", closed: true },
      },
      bankAccountNumber: bankAccountNumber || "",
      bankIfscCode: bankIfscCode || "",
      bankAccountHolderName: bankAccountHolderName || "",
      bankName: bankName || "",
      panNumber: panNumber || "",
      gstin,
      maxOrdersPerHour: maxOrdersPerHour || 10,
      averagePreparationTime: averagePreparationTime || 15,
      onboardingStatus: onboardingStatus || "in_progress",
      onboardingStep: onboardingStep || "password",
      onboardingStartedAt: new Date(),
      razorpayAccountId: razorpayAccountId,
      metadata: {
        ...(businessType ? { businessType } : {}),
        // Persist requested business category/subcategory as enforced values
        businessCategory: rpCategory,
        businessSubcategory: rpSubcategory,
        ...(addressStreet1 || addressCity ? { registeredAddress: { addressStreet1, addressStreet2, addressCity, addressState, addressPostalCode, addressCountry: addressCountry || 'IN' } } : {}),
        ...(acceptTnC !== undefined ? { acceptTnC } : {}),
        ...(acceptSettlementTerms !== undefined ? { acceptSettlementTerms } : {}),
        ...(confirmAccuracy !== undefined ? { confirmAccuracy } : {}),
        stakeholderId: stakeholderId,
        productConfiguration: {
          productId,
          activation_status: productActivationStatus,
          requirements: productRequirements,
        },
        razorpayAccountStatus: 'created'
      },
    })

    return NextResponse.json({
      success: true,
      message: "Vendor created successfully",
      data: { vendor, razorpay: { accountId: razorpayAccountId, stakeholderId, productId, activationStatus: productActivationStatus, requirements: productRequirements } },
    }, { status: 201 })
  } catch (error) {
    console.error("Create vendor error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
