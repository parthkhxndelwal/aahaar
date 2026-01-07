import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadImage = async (file, folder = "aahaar", options = {}) => {
  try {
    const defaultOptions = {
      folder,
      resource_type: "auto",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ],
      ...options
    }

    const result = await cloudinary.uploader.upload(file, defaultOptions)

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return { success: true, result }
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    return { success: false, error: error.message }
  }
}

// Generate transformation URL
const generateTransformationUrl = (publicId, transformations = []) => {
  try {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    })
  } catch (error) {
    console.error("Cloudinary transformation error:", error)
    return null
  }
}

// Predefined transformation presets
const transformationPresets = {
  thumbnail: [
    { width: 150, height: 150, crop: "fill", gravity: "center" },
    { quality: "auto" },
    { fetch_format: "auto" }
  ],
  medium: [
    { width: 500, height: 500, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" }
  ],
  large: [
    { width: 1000, height: 1000, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" }
  ],
  logo: [
    { width: 300, height: 300, crop: "fit", background: "transparent" },
    { quality: "auto" },
    { fetch_format: "auto" }
  ]
}

export {
  cloudinary,
  uploadImage,
  deleteImage,
  generateTransformationUrl,
  transformationPresets,
}
