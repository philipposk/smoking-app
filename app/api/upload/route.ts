import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { currentUser } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';
import { STORAGE_BUCKET } from '@/lib/supabase/tables';

// POST /api/upload  { kind: 'avatar' | 'place' | 'claim', ext: 'jpg' | 'png' | 'webp' }
//   → { uploadUrl, publicUrl, path }
//
// Client PUTs file bytes to uploadUrl. Bucket `smoking` is created by migration 0010.

const Body = z.object({
  kind: z.enum(['avatar', 'place', 'claim']),
  ext: z.enum(['jpg', 'jpeg', 'png', 'webp', 'gif']).default('jpg'),
});

export async function POST(request: NextRequest) {
  const blocked = await writeLimit.check(request, 'upload');
  if (blocked) return blocked;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const filename = `${crypto.randomUUID()}.${body.ext}`;
  const path = `${body.kind}/${user.id}/${filename}`;

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not create upload URL. Is the "smoking" storage bucket created?' },
      { status: 500 },
    );
  }

  const { data: pub } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return NextResponse.json({
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl: pub.publicUrl,
    path,
  });
}
