import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Compress an image and upload it to Firebase Storage.
 * 
 * @param {string} path - The storage path (e.g., 'logos/id/file.jpg')
 * @param {File|Blob} file - The raw image file to upload
 * @returns {Promise<string>} The optimized secure URL of the uploaded image
 */
export async function uploadImage(path, file) {
  try {
    // 1. Compress the image
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
    
    const compressedFile = await imageCompression(file, options);

    // 2. Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, compressedFile);

    // 3. Get Download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Image processing or upload failed:', error);
    throw error;
  }
}
