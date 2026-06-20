import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireWriter, currentUser } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';

// Accept either a real DB place (UUID) OR a freeform reference to a place
// that exists only in the design's editorial seed. Admin reconciles later.
const Body = z
  .object({
    placeId: z.string().uuid().optional(),
    placeRef: z
      .object({
        slug: z.string().max(120).optional(),
        name: z.string().max(200),
        city: z.string().max(120).optional(),
        country: z.string().max(80).optional(),
      })
      .optional(),
    businessName: z.string().trim().min(1).max(200),
    contactEmail: z.string().email(),
    contactPhone: z.string().max(40).optional(),
    proofUrl: z.string().url().optional(),
    evidence: z.string().max(4000).optional(),
  })
  .refine((b) => !!b.placeId || !!b.placeRef, {
    message: 'Either placeId or placeRef is required',
  });

export async function POST(request: NextRequest) {
  const blocked = await writeLimit.check(request, 'claim');
  if (blocked) return blocked;
  const gate = await requireWriter();
  if ('status' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const user = gate;

  let body;
  try {
    body = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from('merchant_claims')
    .insert({
      place_id: body.placeId ?? null,
      place_ref: body.placeRef ?? null,
      user_id: user.id,
      business_name: body.businessName,
      contact_email: body.contactEmail,
      proof_url: body.proofUrl ?? null,
      // Stash phone + evidence inside the existing proof_url JSON-ish field
      // would require a schema change; for now keep the simple columns and
      // ignore extras. Re-evaluate when admin review UI ships.
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claim: data });
}

// Merchant claims hold private PII (contact email, ownership proof URLs).
// Never expose them to anonymous callers. Admins see all claims; a signed-in
// user sees only their own. Everyone else is rejected.
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = request.nextUrl.searchParams.get('placeId');
  let q = supabaseAdmin().from('merchant_claims').select('*');
  if ((user as any).role !== 'admin') q = q.eq('user_id', user.id);
  if (placeId) q = q.eq('place_id', placeId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: data ?? [] });
}
