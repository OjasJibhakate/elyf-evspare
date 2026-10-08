'use client';

import { createClient } from '@/lib/supabase/client';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Resizes a photo in the browser before it is uploaded.
 *
 * A 6 MB phone photo becomes roughly 150 KB, which keeps the storefront fast and
 * the storage bill at zero. Anything already small is passed through untouched
 * so we are not re-encoding an image that is fine as it is.
 */
export async function shrinkImage(file, { maxSide = 1200, quality = 0.85 } = {}) {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 250 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  return blob && blob.size < file.size ? blob : file;
}

/**
 * Compresses and uploads one image, returning its public URL.
 *
 * The write is authorised by the storage policy on the `media` bucket, which
 * only accepts authenticated staff — a tampered browser session cannot push
 * files even though this runs client-side.
 */
export async function uploadImage(file, { folder = 'products', maxSide = 1200 } = {}) {
  if (!file.type.startsWith('image/')) {
    return { error: `${file.name} is not an image.` };
  }

  const blob = await shrinkImage(file, { maxSide });
  if (blob.size > MAX_UPLOAD_BYTES) {
    return { error: `${file.name} is larger than 5 MB even after compressing.` };
  }

  const ext =
    blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from('media')
    .upload(path, blob, { contentType: blob.type || file.type, upsert: false });

  if (error) {
    console.error('[upload] failed', error);
    return { error: 'Upload failed. Please try again.' };
  }

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl };
}
