import { NextRequest, NextResponse } from 'next/server'
import { Vendor } from '../../../../../models'

export async function POST(request: NextRequest) {
  try {
    const { field, value, courtId } = await request.json()

    if (!field || !value || !courtId) {
      return NextResponse.json(
        { error: 'Missing required fields: field, value, courtId' },
        { status: 400 }
      )
    }

    // Validate field is one of the allowed duplicate check fields
    const allowedFields = ['contactEmail', 'contactPhone', 'stallName', 'panNumber']
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: `Invalid field. Allowed fields: ${allowedFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Normalize email to lowercase for comparison
    const normalizedValue = field === 'contactEmail' && typeof value === 'string' ? value.toLowerCase() : value

    // Check for existing vendor with the same value for the field
    const whereCondition: any = {
      courtId: courtId,
      [field]: normalizedValue
    }

    const existingVendor = await Vendor.findOne({
      where: whereCondition,
      attributes: ['id', field]
    })

    if (existingVendor) {
      let fieldDisplayName = field
      switch (field) {
        case 'contactEmail':
          fieldDisplayName = 'email address'
          break
        case 'contactPhone':
          fieldDisplayName = 'phone number'
          break
        case 'stallName':
          fieldDisplayName = 'stall name'
          break
        case 'panNumber':
          fieldDisplayName = 'PAN number'
          break
      }

      return NextResponse.json({
        isDuplicate: true,
        message: `A vendor with this ${fieldDisplayName} already exists.`
      })
    }

    return NextResponse.json({
      isDuplicate: false,
      message: 'No duplicate found'
    })

  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
