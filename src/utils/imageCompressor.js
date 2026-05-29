import imageCompression from 'browser-image-compression'

/**
 * Compress an image file before uploading to Firebase Storage.
 *
 * From QRDine_Backend_Architecture.md:
 * - All dish photos compressed to max 800x800px and 200KB before upload
 * - Reduces Firebase Storage costs
 * - Improves menu load speed on slow Indian mobile connections
 *
 * @param {File} file - Original image file
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: 0.2,            // 200KB
    maxWidthOrHeight: 800,     // 800x800px max
    useWebWorker: true,
    fileType: file.type || 'image/jpeg',
  }

  try {
    const compressed = await imageCompression(file, options)
    return compressed
  } catch (error) {
    console.warn('Image compression failed, using original:', error)
    return file
  }
}
