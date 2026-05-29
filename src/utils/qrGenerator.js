import QRCode from 'qrcode'

/**
 * Get the current base URL for QR codes.
 * Dynamically uses window.location.origin so it adapts to localhost or tunneling tools like Loophole.
 */
const getBaseUrl = () => window.location.origin;

/**
 * Generate a QR code data URL for a specific table.
 *
 * From QRDine_Backend_Architecture.md:
 * - URL: {base}/order/{restaurantId}/{tableId}
 * - Size: 500x500px
 * - Error Correction: Level H (30% damage tolerance)
 * - Format: PNG with white border padding
 *
 * @param {string} restaurantId
 * @param {string} tableId
 * @returns {Promise<string>} QR code as data URL (for display in <img>)
 */
export async function generateQRDataUrl(restaurantId, tableId) {
  const url = `${getBaseUrl()}/order/${restaurantId}/${tableId}`
  const dataUrl = await QRCode.toDataURL(url, {
    width: 500,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
  return dataUrl
}

/**
 * Generate a QR code as a Blob (for download/upload).
 *
 * @param {string} restaurantId
 * @param {string} tableId
 * @param {string|number} tableNumber
 * @returns {Promise<Blob>} QR code PNG blob
 */
export async function generateQRBlob(restaurantId, tableId, tableNumber) {
  const url = `${getBaseUrl()}/order/${restaurantId}/${tableId}`
  const canvas = document.createElement('canvas')
  const tempCanvas = document.createElement('canvas')

  await QRCode.toCanvas(tempCanvas, url, {
    width: 500,
    margin: 4,
    errorCorrectionLevel: 'H',
  })

  // Width is 500, height is 570 to accommodate text
  canvas.width = 500
  canvas.height = 570
  const ctx = canvas.getContext('2d')

  // White background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw QR code canvas
  ctx.drawImage(tempCanvas, 0, 0)

  // Draw Table text
  ctx.fillStyle = '#0F172A' // Dark Slate
  ctx.font = 'bold 28px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`TABLE ${tableNumber}`, 250, 520)
  
  // Subtle brand text
  ctx.fillStyle = '#94A3B8' // Slate 400
  ctx.font = '16px Inter, system-ui, sans-serif'
  ctx.fillText('Scan to Order | QRDine PWA', 250, 548)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/**
 * Get the ordering URL for a table (without QR encoding).
 *
 * @param {string} restaurantId
 * @param {string} tableId
 * @returns {string} Full URL
 */
export function getTableUrl(restaurantId, tableId) {
  return `${getBaseUrl()}/order/${restaurantId}/${tableId}`
}
