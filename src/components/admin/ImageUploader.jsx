'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, GripVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads to Supabase Storage from the browser.
 *
 * The bucket only accepts authenticated staff (enforced by a storage policy),
 * so even a tampered session cannot push files. Images are resized in the
 * browser first — a 6 MB phone photo becomes ~150 KB, which keeps the store
 * fast and the storage bill at zero.
 */
async function shrink(file) {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 250 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export default function ImageUploader({ name, initial = [] }) {
  const [urls, setUrls] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function onFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setError('');
    const supabase = createClient();
    const uploaded = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image.`);
        continue;
      }
      const blob = await shrink(file);
      if (blob.size > MAX_BYTES) {
        setError(`${file.name} is larger than 5 MB even after compressing.`);
        continue;
      }

      const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `products/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, blob, { contentType: blob.type || file.type, upsert: false });

      if (uploadError) {
        setError('Upload failed. Please try again.');
        continue;
      }

      const { data } = supabase.storage.from('media').getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setUrls((current) => [...current, ...uploaded]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(index, delta) {
    const next = [...urls];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setUrls(next);
  }

  function removeAt(index) {
    setUrls((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      <div className="flex flex-wrap gap-3">
        {urls.map((url, index) => (
          <div
            key={url + index}
            className="group relative h-28 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white p-2"
          >
            <img src={url} alt="" className="h-full w-full object-contain" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-brand-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                MAIN
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-slate-900/70 px-1 py-1 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(index, -1)}
                className="p-1 text-white/90 hover:text-white"
                title="Move left"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="p-1 text-white/90 hover:text-rose-300"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <label
          htmlFor={`${name}-upload`}
          className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-800 hover:text-brand-800"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-[11px] font-medium">{busy ? 'Uploading…' : 'Add photo'}</span>
          <input
            ref={inputRef}
            id={`${name}-upload`}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFiles}
            disabled={busy}
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Photos are compressed automatically before upload. The first photo is the one shown in
        listings.
      </p>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
