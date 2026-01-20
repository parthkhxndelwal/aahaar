"use client"
import { use, useState, useEffect, useRef, type SyntheticEvent } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, User, Mail, Phone, Calendar, Users, Check, X, Loader2, CropIcon, Trash2Icon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import "react-image-crop/dist/ReactCrop.css"

interface ProfileData {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  profilePicture: string
}

interface OTPDrawerProps {
  isOpen: boolean
  onClose: () => void
  emailOTP?: string
  phoneOTP?: string
  newEmail?: string
  newPhone?: string
  onVerify: (emailOtp?: string, phoneOtp?: string) => void
  isLoading: boolean
  token: string | null
}

interface CropDrawerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCrop: (croppedImageBlob: Blob) => void
  isLoading: boolean
}

// Helper function to center the crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
        height: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

function CropDrawer({ isOpen, onClose, imageUrl, onCrop, isLoading }: CropDrawerProps) {
  const aspect = 1 // Square aspect ratio for profile pictures
  const imgRef = useRef<HTMLImageElement | null>(null)
  
  const [crop, setCrop] = useState<Crop>()
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("")

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  function onCropComplete(crop: PixelCrop) {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop)
      setCroppedImageUrl(croppedImageUrl)
    }
  }

  function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width * scaleX
    canvas.height = crop.height * scaleY

    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.imageSmoothingEnabled = false

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY,
      )
    }

    return canvas.toDataURL("image/jpeg", 0.9)
  }

  async function handleCrop() {
    try {
      if (!croppedImageUrl) return
      
      // Convert data URL to blob
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      
      onCrop(blob)
    } catch (error) {
      console.error("Crop error:", error)
      alert("Failed to crop image. Please try again.")
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        className="bg-neutral-900 border-neutral-700 max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-white">
            Crop Profile Picture
          </DrawerTitle>
          <DrawerDescription className="text-neutral-400">
            Adjust the cropping area to select your profile picture
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 flex-1 flex flex-col items-center">
          {/* React Image Crop */}
          <div className="w-full max-w-md mb-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => onCropComplete(c)}
              aspect={aspect}
              className="w-full"
            >
              {imageUrl && (
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  className="w-full h-auto max-h-[400px] object-contain"
                  onLoad={onImageLoad}
                  style={{ backgroundColor: '#262626' }}
                />
              )}
            </ReactCrop>
          </div>

          <p className="text-xs text-neutral-400 text-center mb-4">
            Drag the corners to adjust the crop area. The image will be cropped to a square.
          </p>
        </div>

        <DrawerFooter>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-neutral-700 text-white border-neutral-600 hover:bg-neutral-600"
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={isLoading || !croppedImageUrl}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CropIcon className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Processing...' : 'Crop & Save'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function OTPDrawer({ isOpen, onClose, emailOTP, phoneOTP, newEmail, newPhone, onVerify, isLoading, token }: OTPDrawerProps) {
  const [emailOtp, setEmailOtp] = useState("")
  const [phoneOtp, setPhoneOtp] = useState("")
  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async () => {
    if (!token) {
      setError("Authentication required")
      return
    }

    try {
      setVerifying(true)
      setError("")

      // Determine changed fields and prepare the request
      const changedFields = []
      let emailValue = null
      let phoneValue = null

      if (newEmail) {
        changedFields.push('email')
        emailValue = newEmail
      }
      if (newPhone) {
        changedFields.push('phone')
        phoneValue = newPhone
      }

      // If both email and phone changed, we need to verify both OTPs
      if (newEmail && newPhone) {
        if (!emailOtp || !phoneOtp) {
          setError("Please enter both OTPs")
          return
        }

        // Verify email OTP first
        const emailResponse = await fetch('/api/users/profile/verify-otp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changedFields: ['email'],
            emailValue: newEmail,
            phoneValue: null,
            otp: emailOtp
          })
        })

        const emailData = await emailResponse.json()
        if (!emailData.success) {
          setError(`Email OTP verification failed: ${emailData.message}`)
          return
        }

        // Verify phone OTP
        const phoneResponse = await fetch('/api/users/profile/verify-otp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changedFields: ['phone'],
            emailValue: null,
            phoneValue: newPhone,
            otp: phoneOtp
          })
        })

        const phoneData = await phoneResponse.json()
        if (!phoneData.success) {
          setError(`Phone OTP verification failed: ${phoneData.message}`)
          return
        }

        // Both verified successfully
        onVerify(emailOtp, phoneOtp)
        setEmailOtp("")
        setPhoneOtp("")
        setError("")
      } else if (newEmail) {
        // Only email changed
        const response = await fetch('/api/users/profile/verify-otp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changedFields: ['email'],
            emailValue: newEmail,
            phoneValue: null,
            otp: emailOtp
          })
        })

        const data = await response.json()
        if (data.success) {
          onVerify(emailOtp)
          setEmailOtp("")
          setError("")
        } else {
          setError(data.message || "Invalid OTP. Please try again.")
        }
      } else if (newPhone) {
        // Only phone changed
        const response = await fetch('/api/users/profile/verify-otp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changedFields: ['phone'],
            emailValue: null,
            phoneValue: newPhone,
            otp: phoneOtp
          })
        })

        const data = await response.json()
        if (data.success) {
          onVerify(undefined, phoneOtp)
          setPhoneOtp("")
          setError("")
        } else {
          setError(data.message || "Invalid OTP. Please try again.")
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      setError("Failed to verify OTP. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const isFormValid = () => {
    if (newEmail && newPhone) {
      return emailOtp.length === 6 && phoneOtp.length === 6
    } else if (newEmail) {
      return emailOtp.length === 6
    } else if (newPhone) {
      return phoneOtp.length === 6
    }
    return false
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-neutral-900 border-neutral-700">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-white">
            Verify Your Changes
          </DrawerTitle>
          <DrawerDescription className="text-neutral-400">
            We've sent verification codes to verify your changes
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4">
          {/* Email OTP Section */}
          {newEmail && (
            <div className="space-y-3">
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <p className="text-sm text-neutral-300 mb-1">Email verification for:</p>
                <p className="text-white font-medium">{newEmail}</p>
                {emailOTP && (
                  <>
                    <p className="text-xs text-neutral-400 mt-2 mb-1">Demo OTP (for testing):</p>
                    <p className="text-lg font-mono text-green-400 font-semibold">{emailOTP}</p>
                  </>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Enter Email OTP
                </label>
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(e) => {
                    setEmailOtp(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  disabled={verifying || isLoading}
                />
              </div>
            </div>
          )}

          {/* Phone OTP Section */}
          {newPhone && (
            <div className="space-y-3">
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <p className="text-sm text-neutral-300 mb-1">Phone verification for:</p>
                <p className="text-white font-medium">{newPhone}</p>
                {phoneOTP && (
                  <>
                    <p className="text-xs text-neutral-400 mt-2 mb-1">Demo OTP (for testing):</p>
                    <p className="text-lg font-mono text-green-400 font-semibold">{phoneOTP}</p>
                  </>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Enter Phone OTP
                </label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => {
                    setPhoneOtp(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                  disabled={verifying || isLoading}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </div>

        <DrawerFooter>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={verifying || isLoading}
              className="flex-1 bg-neutral-700 text-white border-neutral-600 hover:bg-neutral-600"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!isFormValid() || verifying || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {verifying ? 'Verifying...' : 'Verify & Save'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default function ProfileSettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: ""
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cropDrawer, setCropDrawer] = useState({
    isOpen: false,
    imageUrl: '',
    isLoading: false
  })
  const [otpDrawer, setOtpDrawer] = useState({
    isOpen: false,
    emailOTP: '',
    phoneOTP: '',
    newEmail: '',
    newPhone: '',
    isLoading: false
  })

  const [originalData, setOriginalData] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: ""
  })

  // Check if any data has been edited
  const hasChanges = () => {
    return (
      profileData.fullName !== originalData.fullName ||
      profileData.email !== originalData.email ||
      profileData.phone !== originalData.phone ||
      profileData.dateOfBirth !== originalData.dateOfBirth ||
      profileData.gender !== originalData.gender ||
      profileData.profilePicture !== originalData.profilePicture
    )
  }

  // Load profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
        
        const data = await response.json()

        if (data.success && data.data.user) {
          const user = data.data.user
          const userData = {
            fullName: user.fullName || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dateOfBirth || "",
            gender: user.gender || "",
            profilePicture: user.profilePicture || ""
          }
          setProfileData(userData)
          setOriginalData(userData) // Store original data for comparison
        } else {
          console.error('Failed to fetch profile:', data.message)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    // Wait for auth to be loaded before fetching profile
    if (!authLoading) {
      fetchProfile()
    }
  }, [token, isAuthenticated, authLoading])

  const sendOTP = async (type: 'email' | 'phone', value: string) => {
    if (!token) {
      return null
    }

    try {
      const response = await fetch('/api/users/profile/send-otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, value })
      })

      const data = await response.json()

      if (data.success) {
        return data.data.otp || '' // Return the demo OTP
      } else {
        console.error('Failed to send OTP:', data.message)
        return null
      }
    } catch (error) {
      console.error('Failed to send OTP:', error)
      return null
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    // Update the profile data immediately for all fields
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleOTPVerify = async () => {
    // Save the profile after OTP verification
    await saveProfile()
    setOtpDrawer({ ...otpDrawer, isOpen: false })
  }

  const handleOTPClose = () => {
    // Reset profile data to original values
    setProfileData({ ...originalData })
    setOtpDrawer({ ...otpDrawer, isOpen: false })
  }

  const handleProfilePictureUpload = () => {
    // Create a file input element
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Validate file size (4MB limit)
      if (file.size > 4 * 1024 * 1024) {
        alert('File size must be less than 4MB')
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP)')
        return
      }

      // Convert file to data URL for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        if (imageUrl) {
          // Open crop drawer with the uploaded image
          setCropDrawer({
            isOpen: true,
            imageUrl: imageUrl,
            isLoading: false
          })
        }
      }
      reader.readAsDataURL(file)
    }

    // Trigger file selection
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!token) return

    try {
      setCropDrawer(prev => ({ ...prev, isLoading: true }))

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', croppedImageBlob, 'profile.jpg')
      formData.append('folder', 'aahaar/profiles')
      formData.append('transformation', 'profile')

      // Upload to server
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        // Use the transformed URL for profile pictures
        const profileImageUrl = data.data.transformedUrls?.profile || data.data.url
        
        // Update profile data with new image
        const updatedProfileData = { ...profileData, profilePicture: profileImageUrl }
        setProfileData(updatedProfileData)
        
        // Immediately save the profile picture to database
        const saveResponse = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfileData)
        })

        const saveData = await saveResponse.json()

        if (saveData.success) {
          // Update original data to reflect the new saved state
          setOriginalData(updatedProfileData)
          
          // Close crop drawer
          setCropDrawer({ isOpen: false, imageUrl: '', isLoading: false })
        } else {
          console.error('Failed to save profile picture:', saveData.message)
          alert('Failed to save profile picture. Please try again.')
          // Revert the profile data change
          setProfileData(prev => ({ ...prev, profilePicture: originalData.profilePicture }))
        }
      } else {
        console.error('Failed to upload image:', data.message)
        alert('Failed to upload image. Please try again.')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setCropDrawer(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleCropCancel = () => {
    setCropDrawer({ isOpen: false, imageUrl: '', isLoading: false })
  }

  const handleSave = async () => {
    if (!token) {
      return
    }

    try {
      setSaving(true)
      
      // Check if email or phone changed and need OTP verification
      const emailChanged = profileData.email !== originalData.email
      const phoneChanged = profileData.phone !== originalData.phone
      
      if (emailChanged || phoneChanged) {
        // Send OTPs for changed fields
        let emailOTP = ''
        let phoneOTP = ''
        
        if (emailChanged) {
          const otp = await sendOTP('email', profileData.email)
          if (otp) emailOTP = otp
        }
        
        if (phoneChanged) {
          const otp = await sendOTP('phone', profileData.phone)
          if (otp) phoneOTP = otp
        }
        
        // Open OTP drawer with the appropriate OTPs
        setOtpDrawer({
          isOpen: true,
          emailOTP: emailChanged ? emailOTP : '',
          phoneOTP: phoneChanged ? phoneOTP : '',
          newEmail: emailChanged ? profileData.email : '',
          newPhone: phoneChanged ? profileData.phone : '',
          isLoading: false
        })
      } else {
        // No sensitive fields changed, save directly
        await saveProfile()
      }
    } catch (error) {
      console.error('Failed to initiate save:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    if (!token) {
      return
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (data.success) {
        // Update original data to reflect the new saved state
        setOriginalData({ ...profileData })
      } else {
        console.error('Failed to save profile:', data.message)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4 pb-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400 mb-4">Please log in to view your profile</p>
          <Link href={`/app/${courtId}/login`} className="text-blue-400 hover:text-blue-300">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-4 pb-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen bg-neutral-950 p-4 pb-24"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <motion.div 
          className="flex items-center space-x-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link href={`/app/${courtId}/settings/account`}>
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
          </motion.div>
          <h1 className="text-xl font-bold text-white">Profile Settings</h1>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Profile Picture Section */}
          <div className="bg-neutral-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Picture</h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden">
                  {profileData.profilePicture && profileData.profilePicture.trim() !== "" ? (
                    <img 
                      src={profileData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${profileData.profilePicture && profileData.profilePicture.trim() !== "" ? 'hidden' : ''}`}>
                    <User className="h-12 w-12 text-neutral-400" />
                  </div>
                </div>
                <button
                  onClick={handleProfilePictureUpload}
                  disabled={cropDrawer.isLoading}
                  className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                  {cropDrawer.isLoading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-sm text-neutral-400 text-center">
                {cropDrawer.isLoading ? 'Processing image...' : 'Click the camera icon to update your profile picture'}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-neutral-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Changing email requires OTP verification
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Changing phone requires OTP verification
                </p>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <select
                    value={profileData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Save Button */}
          <AnimatePresence>
            {hasChanges() && (
              <motion.div
                className="fixed bottom-24 right-6 z-[60]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 shadow-2xl border-2 border-white/20"
                  size="lg"
                >
                  {saving ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Check className="h-6 w-6" />
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Image Crop Drawer */}
      <CropDrawer
        isOpen={cropDrawer.isOpen}
        onClose={handleCropCancel}
        imageUrl={cropDrawer.imageUrl}
        onCrop={handleCropComplete}
        isLoading={cropDrawer.isLoading}
      />

      {/* OTP Verification Drawer */}
      <OTPDrawer
        isOpen={otpDrawer.isOpen}
        onClose={handleOTPClose}
        emailOTP={otpDrawer.emailOTP}
        phoneOTP={otpDrawer.phoneOTP}
        newEmail={otpDrawer.newEmail}
        newPhone={otpDrawer.newPhone}
        onVerify={handleOTPVerify}
        isLoading={otpDrawer.isLoading}
        token={token}
      />
    </motion.div>
  )
}
