'use client';

import { useState } from 'react';

interface Props {
  kind: 'avatar' | 'place' | 'claim';
  /** Called when upload finishes with the public URL of the stored file. */
  onUploaded: (publicUrl: string) => void;
  /** Optional currently-attached URL (renders preview if set). */
  value?: string;
  label?: string;
}

// Two-step upload:
//   1. POST /api/upload to get a signed Supabase Storage URL
//   2. PUT the bytes directly to that URL (no proxy through our server)
// Bucket "public" must exist with public read. See /api/upload route header.
export default function ImageUploader({ kind, onUploaded, value, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErr('Max 5 MB.');
      return;
    }
    const m = /\.([a-z0-9]+)$/i.exec(f.name);
    const ext = (m?.[1] ?? 'jpg').toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      setErr('Only jpg, png, webp, gif.');
      return;
    }

    setBusy(true);
    setErr('');
    try {
      const init = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, ext }),
      });
      const initJ = await init.json().catch(() => ({}));
      if (!init.ok) {
        setErr(initJ.error || 'Upload init failed');
        return;
      }

      const put = await fetch(initJ.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': f.type || 'image/jpeg' },
        body: f,
      });
      if (!put.ok) {
        setErr(`Upload failed (HTTP ${put.status})`);
        return;
      }

      setPreview(initJ.publicUrl);
      onUploaded(initJ.publicUrl);
    } catch {
      setErr('Network error.');
    } finally {
      setBusy(false);
      // Reset the input so the same file can be re-picked if needed
      e.target.value = '';
    }
  };

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {preview && (
          <img
            src={preview}
            alt=""
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--hair)' }}
          />
        )}
        <label
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            fontSize: 13,
            border: '1px solid var(--hair)',
            borderRadius: 4,
            cursor: busy ? 'wait' : 'pointer',
            background: 'var(--card)',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Uploading…' : preview ? 'Replace' : 'Choose image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onPick}
            disabled={busy}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {err && <p style={{ color: 'var(--ember-2)', fontSize: 13, marginTop: 4 }}>{err}</p>}
    </div>
  );
}
