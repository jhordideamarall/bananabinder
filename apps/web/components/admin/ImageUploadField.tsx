'use client';

import { useId, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadFieldProps {
  /** Supabase Storage bucket name, e.g. `product-images` or `banners`. */
  bucket: string;
  /** Optional form field name. When set, a text input carrying the URL is rendered for server actions. */
  name?: string;
  /** Initial URL value (edit mode). */
  defaultValue?: string;
  /** Called with the public URL after a successful upload. */
  onUploaded?: (url: string) => void;
  label?: string;
  multiple?: boolean;
}

function sanitizeFileName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : 'jpg';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/**
 * Reusable admin image uploader. Uploads to a Supabase Storage bucket and
 * exposes the resulting public URL — either via `onUploaded` callback or a
 * named text input for server-action forms.
 */
export function ImageUploadField({
  bucket,
  name,
  defaultValue = '',
  onUploaded,
  label = 'Upload foto',
  multiple = false,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const supabase = createClient();
    const path = sanitizeFileName(file.name);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFiles = async (files: FileList): Promise<void> => {
    setUploading(true);
    setError(null);

    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFile(file));
      }

      if (urls[0]) setValue(urls[urls.length - 1]);
      urls.forEach((url) => onUploaded?.(url));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengupload foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-2xl bg-[#1A1714] px-4 text-xs font-extrabold text-white"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Mengupload...' : label}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) void handleFiles(files);
          }}
        />
        {value ? (
          <span className="truncate text-xs font-semibold text-green-600">Foto siap</span>
        ) : null}
      </div>

      {name ? (
        <input name={name} value={value} onChange={(e) => setValue(e.target.value)} type="hidden" />
      ) : null}

      {error ? <p className="text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}
