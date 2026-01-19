import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"
import { uploadImage, generateTransformationUrl, transformationPresets } from "@/utils/cloudinary"

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder") || "aahaar"
    const transformation = formData.get("transformation") || "medium"

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Check if user has permission to upload to this folder
    if (folder.includes("menu-items") && user.role !== "vendor" && user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied for this folder" }, { status: 403 })
    }

    // Check file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File size exceeds 4MB limit" }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, JPG, and WebP are allowed" },
        { status: 400 },
      )
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Use transformation preset if available
    const transformationPreset = transformationPresets[transformation] || transformationPresets.medium
    
    const uploadOptions = {
      transformation: transformationPreset
    }

    // Upload to Cloudinary
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
    console.error("Image upload error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
