import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { currentUser } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';

// Flag a place, review, post, or reply for moderator review.
// Requires migration 0003_flags.sql to create the flags table.

const Body = z.object({
  targetType: z.enum(['place', 'review', 'forum_post', 'forum_reply', 'user']),
  targetId: z.string().uuid(),
  reason: z.string().max(200).optional(),
  detail: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const blocked = writeLimit.check(request, 'flag');
  if (blocked) return blocked;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from('flags')
    .insert({
      target_type: body.targetType,
      target_id: body.targetId,
      reason: body.reason ?? null,
      detail: body.detail ?? null,
      reporter_user_id: user.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flag: data });
}
