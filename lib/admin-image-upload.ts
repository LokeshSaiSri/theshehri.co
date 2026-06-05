const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 2400;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
    });
    if (!blob || blob.size <= MAX_UPLOAD_BYTES) break;
    quality -= 0.12;
  }

  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  if (file.size <= MAX_UPLOAD_BYTES) return file;
  return compressImage(file);
}

export async function uploadAdminImage(file: File): Promise<string> {
  const prepared = await prepareImageForUpload(file);

  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image is still too large after compression (${(prepared.size / 1024 / 1024).toFixed(1)}MB). Try a smaller photo.`
    );
  }

  const formData = new FormData();
  formData.append('file', prepared);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({} as { url?: string; error?: string }));

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('Image is too large. Photos are auto-compressed — try a smaller file or lower resolution.');
      }
      throw new Error(data.error || `Upload failed (${res.status})`);
    }

    if (!data.url) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.url;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Upload timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
