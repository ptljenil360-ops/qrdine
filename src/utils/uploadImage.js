import imageCompression from 'browser-image-compression';

/**
 * Compress an image and upload it to Cloudinary.
 * Uses an unsigned upload preset to securely upload from the client.
 * 
 * @param {string} path - (Unused, kept for backward compatibility with old signature)
 * @param {File|Blob} file - The raw image file to upload
 * @returns {Promise<string>} The optimized secure URL of the uploaded image
 */
export async function uploadImage(path, file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary credentials missing in .env. Falling back to local URL for preview.');
    return URL.createObjectURL(file);
  }

  try {
    // 1. Compress the image
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
    
    const compressedFile = await imageCompression(file, options);

    // 2. Upload to Cloudinary Unsigned Preset
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // Add f_auto,q_auto for automated WebP/AVIF format optimization and quality compression
    const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
    
    return optimizedUrl;
  } catch (error) {
    console.error('Image processing or upload failed:', error);
    throw error;
  }
}
