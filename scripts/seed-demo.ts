import { TABLES } from '../lib/supabase/tables';
/**
 * Seed demo users, forum threads, reviews, and favorites so the app feels alive.
 * Idempotent: re-running upserts users by email and skips duplicate content.
 *
 *   npm run seed:demo
 *
 * Demo login (all accounts share this password):
 *   DemoSmoke2024!
 */

import bcrypt from 'bcryptjs';
import { adminClient } from './lib/db';

const DEMO_PASSWORD = 'DemoSmoke2024!';

const DEMO_USERS = [
  {
    username: 'marina_v',
    email: 'marina@demo.smoking.app',
    bio: 'Athens-born, Copenhagen-based. Terrace hunter and occasional forum lurker.',
    role: 'user' as const,
  },
  {
    username: 'klaus_m',
    email: 'klaus@demo.smoking.app',
    bio: 'Nørrebro local. Knows every tobacconist in Copenhagen within cycling distance.',
    role: 'user' as const,
  },
  {
    username: 'eleni_l',
    email: 'eleni@demo.smoking.app',
    bio: 'Lesvos every summer. Molyvos harbour is home.',
    role: 'user' as const,
  },
  {
    username: 'alex_k',
    email: 'alex@demo.smoking.app',
    bio: 'Berlin → Athens pipeline. Parks, rooftops, policy threads.',
    role: 'user' as const,
  },
  {
    username: 'yiota.p',
    email: 'yiota@demo.smoking.app',
    bio: 'Miradouro obsessive. Will climb anything for a view and a quiet smoke.',
    role: 'user' as const,
  },
  {
    username: 'sofia_n',
    email: 'sofia@demo.smoking.app',
    bio: 'Rooftop bars and late terraces. Exarchia regular.',
    role: 'merchant' as const,
  },
  {
    username: 'deniz',
    email: 'deniz@demo.smoking.app',
    bio: 'Merchant verification nerd. Flags fake listings so you don\'t have to.',
    role: 'user' as const,
  },
  {
    username: 'niels_c',
    email: 'niels@demo.smoking.app',
    bio: 'Christiania guide (unofficial). Ask me before you visit Pusher Street.',
    role: 'user' as const,
  },
];

type ForumSeed = {
  author: string;
  title: string;
  body: string;
  category: string;
  daysAgo: number;
  replies: { author: string; body: string; daysAgo: number }[];
};

const FORUM_SEEDS: ForumSeed[] = [
  {
    author: 'marina_v',
    title: 'Athens — is Plaka still the best terrace neighbourhood in 2026?',
    body:
      'Back in Athens after two years. Plaka feels more touristy but the rooftop tavernas still let you smoke outside. Has anyone found a quieter alternative near the Acropolis with the same view?',
    category: 'athens',
    daysAgo: 4,
    replies: [
      {
        author: 'sofia_n',
        body:
          'Exarchia is less polished but way more relaxed. Try the square on a weekday afternoon — half the tables are outside and nobody bats an eye.',
        daysAgo: 3,
      },
      {
        author: 'alex_k',
        body:
          'Lycabettus at sunset beats any terrace. No waiter, no bill, just the view. Bring your own drink.',
        daysAgo: 3,
      },
    ],
  },
  {
    author: 'klaus_m',
    title: 'Copenhagen outdoor smoking — where are people actually sitting now?',
    body:
      'Indoor ban is strict but Nyhavn terraces are packed even in March. Looking for less touristy spots — Nørrebro, Vesterbro, anywhere with heated tables and ashtrays.',
    category: 'copenhagen',
    daysAgo: 6,
    replies: [
      {
        author: 'niels_c',
        body:
          'Sankt Hans Torv cafés on sunny days. Also the benches along Assistens Kirkegård — locals sit there with coffee from the bakery on Nørrebrogade.',
        daysAgo: 5,
      },
      {
        author: 'marina_v',
        body: 'Nyhavn is touristy but honest — every table outside has an ashtray. Stær Tobak on Nørrebrogade is worth a stop if you need rolling tobacco.',
        daysAgo: 5,
      },
    ],
  },
  {
    author: 'eleni_l',
    title: 'Lesvos — Molyvos harbour vs Mytilene waterfront for an evening smoke',
    body:
      'Spending August on the island. Molyvos is magical at dusk but is the harbour actually smoker-friendly or do the tavernas enforce the indoor rules strictly? Mytilene promenade looks wider — any locals here?',
    category: 'lesvos',
    daysAgo: 2,
    replies: [
      {
        author: 'yiota.p',
        body:
          'Molyvos quay is the one. Tables are right on the water, octopus on the grill, ouzo cold. Mytilene is better for a morning coffee smoke watching the ferries.',
        daysAgo: 1,
      },
      {
        author: 'eleni_l',
        body: 'Petra rock terrace above the church — fewer tourists, incredible sunset. Worth the climb.',
        daysAgo: 1,
      },
    ],
  },
  {
    author: 'niels_c',
    title: 'Christiania in 2026 — what\'s the actual situation on Pusher Street?',
    body:
      'Tourist friends keep asking. I know cannabis is sold openly in the Green Light District but rules change. Is outdoor smoking still tolerated on the main drag? Any spots to sit without hassle?',
    category: 'copenhagen',
    daysAgo: 8,
    replies: [
      {
        author: 'klaus_m',
        body:
          'Still relaxed outdoors but don\'t photograph sellers and don\'t run. The benches near the lake are calmer than Pusher Street itself.',
        daysAgo: 7,
      },
    ],
  },
  {
    author: 'deniz',
    title: 'Best tobacconists in Athens for Cuban cigars?',
    body:
      'Poeta on Skoufa gets mentioned everywhere but is there a cheaper option that still keeps cigars properly? Travelling through next month.',
    category: 'athens',
    daysAgo: 10,
    replies: [
      {
        author: 'marina_v',
        body: 'Poeta is the real deal — humidor room in the back. Kolonaki prices though. For rolling tobacco, kiosks near Syntagma are fine.',
        daysAgo: 9,
      },
    ],
  },
  {
    author: 'alex_k',
    title: 'Berlin vs Copenhagen — which city is more honest about outdoor smoking?',
    body:
      'Both have indoor bans. Berlin parks are still wide open (for now). Copenhagen pushes you to terraces. Which feels less hostile to smokers in practice?',
    category: 'policy',
    daysAgo: 12,
    replies: [
      {
        author: 'klaus_m',
        body: 'Copenhagen if you stick to cafés with outdoor seating. Berlin if you want a park bench and zero performance.',
        daysAgo: 11,
      },
      {
        author: 'yiota.p',
        body: 'Athens beats both — terrace culture is just normal here. Different continent though.',
        daysAgo: 11,
      },
    ],
  },
];

type ReviewSeed = {
  author: string;
  placeExternalId: string;
  rating: number;
  body: string;
  daysAgo: number;
};

const REVIEW_SEEDS: ReviewSeed[] = [
  {
    author: 'marina_v',
    placeExternalId: 'seed:plaka-athens',
    rating: 5,
    body: 'Still my favourite evening spot in Athens. Rooftop with Acropolis view, karafaki of wine, nobody rushing you off.',
    daysAgo: 14,
  },
  {
    author: 'sofia_n',
    placeExternalId: 'seed:athens-exarchia',
    rating: 4,
    body: 'Cheap beer, loud students, perfect pavement tables. Not pretty but very honest.',
    daysAgo: 11,
  },
  {
    author: 'klaus_m',
    placeExternalId: 'seed:copenhagen-nyhavn',
    rating: 4,
    body: 'Touristy yes, but the outdoor tables are heated and ashtrays appear without asking. Classic.',
    daysAgo: 9,
  },
  {
    author: 'niels_c',
    placeExternalId: 'seed:copenhagen-christiania',
    rating: 5,
    body: 'Unique — not for everyone, but outdoor culture here is unlike anywhere else in Scandinavia.',
    daysAgo: 20,
  },
  {
    author: 'klaus_m',
    placeExternalId: 'seed:copenhagen-staer',
    rating: 5,
    body: 'Best rolling tobacco selection on Nørrebrogade. Staff actually know their pipes.',
    daysAgo: 7,
  },
  {
    author: 'eleni_l',
    placeExternalId: 'seed:molyvos-harbour',
    rating: 5,
    body: 'The whole harbour smells like grilled octopus and ouzo. Sit on the quay at 8pm.',
    daysAgo: 5,
  },
  {
    author: 'eleni_l',
    placeExternalId: 'seed:mytilene-waterfront',
    rating: 4,
    body: 'Morning coffee on the promenade watching ferries to Turkey. Benches all along.',
    daysAgo: 3,
  },
  {
    author: 'yiota.p',
    placeExternalId: 'seed:petra-monastery',
    rating: 5,
    body: 'Climb the steps, sit on the rock, watch the sun drop behind the castle. Magic.',
    daysAgo: 18,
  },
  {
    author: 'deniz',
    placeExternalId: 'seed:athens-poeta',
    rating: 4,
    body: 'Proper humidor, knowledgeable staff. Pricey but you get what you pay for.',
    daysAgo: 15,
  },
  {
    author: 'alex_k',
    placeExternalId: 'seed:athens-lycabettus',
    rating: 5,
    body: 'Better view than any paid terrace. Bring water — the climb is real.',
    daysAgo: 6,
  },
];

const FAVORITE_SEEDS: { author: string; placeExternalId: string }[] = [
  { author: 'marina_v', placeExternalId: 'seed:plaka-athens' },
  { author: 'marina_v', placeExternalId: 'seed:copenhagen-nyhavn' },
  { author: 'klaus_m', placeExternalId: 'seed:copenhagen-staer' },
  { author: 'klaus_m', placeExternalId: 'seed:copenhagen-christiania' },
  { author: 'eleni_l', placeExternalId: 'seed:molyvos-harbour' },
  { author: 'eleni_l', placeExternalId: 'seed:petra-monastery' },
  { author: 'yiota.p', placeExternalId: 'seed:lisbon-miradouro' },
  { author: 'yiota.p', placeExternalId: 'seed:mytilene-waterfront' },
  { author: 'sofia_n', placeExternalId: 'seed:athens-exarchia' },
  { author: 'alex_k', placeExternalId: 'seed:kreuzberg-park' },
];

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  const sb = adminClient();
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── users ──────────────────────────────────────────────────────────────
  const userIds = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const { data: existing } = await sb.from(TABLES.users).select('id').eq('email', u.email).maybeSingle();
    if (existing) {
      userIds.set(u.username, existing.id);
      await sb.from(TABLES.users).update({
        username: u.username,
        bio: u.bio,
        role: u.role,
        email_verified: true,
      }).eq('id', existing.id);
      continue;
    }
    const { data: created, error } = await sb
      .from(TABLES.users)
      .insert({
        username: u.username,
        email: u.email,
        password_hash,
        bio: u.bio,
        role: u.role,
        email_verified: true,
      })
      .select('id')
      .single();
    if (error || !created) {
      console.error(`user ${u.username}:`, error?.message);
      continue;
    }
    userIds.set(u.username, created.id);
  }
  console.log(`users: ${userIds.size} demo accounts ready`);

  // ── forum posts + replies ──────────────────────────────────────────────
  let postsCreated = 0;
  let repliesCreated = 0;
  for (const seed of FORUM_SEEDS) {
    const userId = userIds.get(seed.author);
    if (!userId) continue;

    const { data: existing } = await sb
      .from(TABLES.forumPosts)
      .select('id')
      .eq('user_id', userId)
      .eq('title', seed.title)
      .maybeSingle();

    let postId = existing?.id;
    if (!postId) {
      const { data: post, error } = await sb
        .from(TABLES.forumPosts)
        .insert({
          user_id: userId,
          title: seed.title,
          body: seed.body,
          category: seed.category,
          created_at: daysAgoIso(seed.daysAgo),
        })
        .select('id')
        .single();
      if (error || !post) {
        console.error(`post "${seed.title}":`, error?.message);
        continue;
      }
      postId = post.id;
      postsCreated++;
    }

    for (const reply of seed.replies) {
      const replyUserId = userIds.get(reply.author);
      if (!replyUserId) continue;
      const { data: dup } = await sb
        .from(TABLES.forumReplies)
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', replyUserId)
        .eq('body', reply.body)
        .maybeSingle();
      if (dup) continue;

      const { error } = await sb.from(TABLES.forumReplies).insert({
        post_id: postId,
        user_id: replyUserId,
        body: reply.body,
        created_at: daysAgoIso(reply.daysAgo),
      });
      if (!error) repliesCreated++;
    }
  }
  console.log(`forum: ${postsCreated} posts, ${repliesCreated} replies`);

  // ── place lookup ─────────────────────────────────────────────────────
  const extIds = [
    ...REVIEW_SEEDS.map((r) => r.placeExternalId),
    ...FAVORITE_SEEDS.map((f) => f.placeExternalId),
  ];
  const { data: places } = await sb
    .from(TABLES.places)
    .select('id, external_id')
    .in('external_id', [...new Set(extIds)]);

  const placeByExt = new Map((places ?? []).map((p) => [p.external_id, p.id]));

  // ── reviews ──────────────────────────────────────────────────────────
  let reviewsCreated = 0;
  for (const r of REVIEW_SEEDS) {
    const userId = userIds.get(r.author);
    const placeId = placeByExt.get(r.placeExternalId);
    if (!userId || !placeId) continue;

    const { data: existing } = await sb
      .from(TABLES.reviews)
      .select('id')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) continue;

    const { error } = await sb.from(TABLES.reviews).insert({
      place_id: placeId,
      user_id: userId,
      rating: r.rating,
      body: r.body,
      created_at: daysAgoIso(r.daysAgo),
    });
    if (!error) reviewsCreated++;
  }
  console.log(`reviews: ${reviewsCreated} created (${placeByExt.size} seed places found)`);

  // ── favorites ────────────────────────────────────────────────────────
  let favoritesCreated = 0;
  for (const f of FAVORITE_SEEDS) {
    const userId = userIds.get(f.author);
    const placeId = placeByExt.get(f.placeExternalId);
    if (!userId || !placeId) continue;

    const { error } = await sb.from(TABLES.favorites).upsert(
      { user_id: userId, place_id: placeId },
      { onConflict: 'user_id,place_id', ignoreDuplicates: true },
    );
    if (!error) favoritesCreated++;
  }
  console.log(`favorites: ${favoritesCreated} set`);

  console.log('\nDemo accounts (password: DemoSmoke2024!):');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.username} <${u.email}>`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
