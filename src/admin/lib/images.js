// Prepares a photo in the browser before upload:
//  • rejects files the site can't show
//  • re-saves EVERY photo as JPEG (max 1600 px, ~85% quality). Re-saving drops hidden
//    camera data such as GPS location, so a photo never reveals where it was taken.
//  • fingerprints the ORIGINAL file (SHA-256) so the same photo is never stored twice

const MAX_SIDE = 1600;
const MAX_INPUT_MB = 25;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export const ACCEPT_ATTR = ACCEPTED.join(',');

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file could not be opened as a photo.')); };
    img.src = url;
  });
}

export async function prepareImage(file) {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(`${file.name}: use JPG, PNG or WebP photos (iPhone HEIC photos: export as JPG first).`);
  }
  if (file.size > MAX_INPUT_MB * 1024 * 1024) {
    throw new Error(`${file.name} is larger than ${MAX_INPUT_MB} MB.`);
  }

  const original = await file.arrayBuffer();
  const hash = await sha256(original);
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;

  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // transparent PNG areas become white, matching the site
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error(`${file.name}: could not be resized in this browser.`);
  return { blob, width: canvas.width, height: canvas.height, hash, mime: 'image/jpeg', ext: 'jpg', name: file.name };
}
