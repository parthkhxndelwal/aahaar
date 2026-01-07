import { NextResponse } from "next/server"
import { uploadImage, generateTransformationUrl, transformationPresets } from "@/utils/cloudinary"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const upload_preset = formData.get("upload_preset") || "general"
    const transformation = formData.get("transformation") || "medium"

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Check file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File size exceeds 4MB limit" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 },
      )
    }

    // Determine folder and transformation based on upload preset
    let folder = "aahaar"
    let transformationPreset = transformationPresets.medium

    switch (upload_preset) {
      case "court_logos":
        folder = "aahaar/courts/logos"
        transformationPreset = transformationPresets.logo
        break
      case "vendor_logos":
        folder = "aahaar/vendors/logos"
        transformationPreset = transformationPresets.logo
        break
      case "menu_items":
        folder = "aahaar/menu/items"
        transformationPreset = transformationPresets.medium
        break
      default:
        folder = "aahaar/general"
    }

    // Override with custom transformation if provided
    if (transformation && transformationPresets[transformation]) {
      transformationPreset = transformationPresets[transformation]
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Upload to Cloudinary with transformation
    const uploadOptions = {
      transformation: transformationPreset
    }
    
    const result = await uploadImage(base64, folder, uploadOptions)

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Failed to upload image" }, { status: 500 })
    }

    // Generate additional transformation URLs
    const transformedUrls = {}
    for (const [preset, transforms] of Object.entries(transformationPresets)) {
      transformedUrls[preset] = generateTransformationUrl(result.publicId, transforms)
    }

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        transformedUrls,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
