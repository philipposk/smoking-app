import { TABLES } from '../lib/supabase/tables';
/**
 * Load the curated editorial PLACES from the design into Supabase.
 * Idempotent: re-running upserts on external_id='seed:<slug>'.
 *
 *   npm run seed:places
 */

import { adminClient } from './lib/db';

// Mirror of the seed in app/components/SmokingApp.tsx. If you edit one,
// edit the other. (Worth refactoring once when these stop changing.)
const PLACES = [
  { id: 'golden-gai',       name: 'Golden Gai',                   neighborhood: 'Shinjuku',    city: 'Tokyo',         country: 'Japan',     region: 'Asia',     lng: 139.7036, lat: 35.6938, description: "Six narrow lanes of two-storey wooden bars, the city's last unrebuilt postwar block. Lighters still click here.", tags: ['nightlife','iconic','indoor']  },
  { id: 'lisbon-miradouro', name: 'Miradouro da Senhora do Monte', neighborhood: 'Graça',      city: 'Lisbon',        country: 'Portugal',  region: 'Europe',   lng: -9.1322,  lat: 38.7191, description: "The highest of Lisbon's lookouts. Pine trees, a tiled bench, the whole city spread below the smoke.", tags: ['view','sunset','outdoor'] },
  { id: 'kreuzberg-park',   name: 'Görlitzer Park',                neighborhood: 'Kreuzberg',   city: 'Berlin',        country: 'Germany',   region: 'Europe',   lng: 13.4376,  lat: 52.4983, description: 'An anarchic city park where the rules thin out after sundown. Wide lawns, distant techno, no one notices.', tags: ['late-night','outdoor','loud'] },
  { id: 'plaka-athens',     name: 'Plaka District',                neighborhood: 'Plaka',       city: 'Athens',        country: 'Greece',    region: 'Europe',   lng: 23.7298,  lat: 37.9715, description: 'Stone alleys, bougainvillea, and that one rooftop with a clear view of the Acropolis lit up at night.', tags: ['view','evening','outdoor'] },
  { id: 'san-telmo',        name: 'Plaza Dorrego',                 neighborhood: 'San Telmo',   city: 'Buenos Aires',  country: 'Argentina', region: 'Americas', lng: -58.3712, lat: -34.6206, description: 'Cobblestones, tango dancers after dark, an accordion two tables over. Cafés ring the square — every one has an ashtray.', tags: ['outdoor','evening','iconic'] },
  { id: 'roma-norte',       name: 'Café Toscano',                  neighborhood: 'Roma Norte',  city: 'Mexico City',   country: 'Mexico',    region: 'Americas', lng: -99.1601, lat: 19.4138, description: 'A jacaranda-shaded patio in the city\'s most walkable district. The waiters bring matches before you ask.', tags: ['morning','outdoor','café'] },
  { id: 'marrakech-riad',   name: 'Le Jardin',                     neighborhood: 'Medina',      city: 'Marrakech',     country: 'Morocco',   region: 'Africa',   lng: -7.9858,  lat: 31.6324, description: 'A green riad courtyard tucked behind an unmarked door in the souk. Mint tea, tortoises underfoot, a sky-blue ceiling of leaves.', tags: ['hidden','afternoon','outdoor'] },
  { id: 'beirut-rooftop',   name: 'Mar Mikhael Rooftops',          neighborhood: 'Mar Mikhael', city: 'Beirut',        country: 'Lebanon',   region: 'Asia',     lng: 35.5276,  lat: 33.8975, description: 'A strip of converted warehouses with rooftop bars facing the port. Nargile coals glowing on every other table.', tags: ['nightlife','view','rooftop'] },
  { id: 'marais-paris',     name: 'Place des Vosges',              neighborhood: 'Le Marais',   city: 'Paris',         country: 'France',    region: 'Europe',   lng: 2.3656,   lat: 48.8553, description: 'Red-brick arcades around a tree-lined square. Every café on the perimeter spills onto the pavement, every table has its tin ashtray.', tags: ['outdoor','iconic','café'] },
  // Copenhagen — outdoor terraces + Christiania + known tobacconists
  { id: 'copenhagen-nyhavn',      name: 'Nyhavn Harbour Terraces',       neighborhood: 'Indre By',    city: 'Copenhagen', country: 'Denmark', region: 'Europe', lng: 12.5903, lat: 55.6799, description: 'Colourful canal-side cafés with heated outdoor tables. Danes still smoke outside here — grab a Carlsberg and a bench along the quay.', tags: ['outdoor','iconic','evening'] },
  { id: 'copenhagen-christiania', name: 'Freetown Christiania',          neighborhood: 'Christianshavn', city: 'Copenhagen', country: 'Denmark', region: 'Europe', lng: 12.6012, lat: 55.6736, description: 'The autonomous quarter where cannabis is openly sold on Pusher Street and outdoor smoking is part of daily life. Check local rules before visiting.', tags: ['outdoor','iconic','cannabis'] },
  { id: 'copenhagen-staer',       name: 'Stær Tobak',                    neighborhood: 'Nørrebro',    city: 'Copenhagen', country: 'Denmark', region: 'Europe', lng: 12.5534, lat: 55.6921, description: 'Classic Copenhagen tobacconist on Nørrebrogade — pipes, rolling tobacco, and Danish cigarillos since the 1970s.', tags: ['shop','tobacco'] },
  // Athens — beyond Plaka
  { id: 'athens-exarchia',  name: 'Exarchia Square Terraces',      neighborhood: 'Exarchia',    city: 'Athens',        country: 'Greece',    region: 'Europe',   lng: 23.7345,  lat: 37.9876, description: 'Student-quarter cafés spilling onto the pavement. Cheap beer, political graffiti, and nobody minds a cigarette at the outside tables.', tags: ['outdoor','evening','café'] },
  { id: 'athens-poeta',     name: 'Poeta Tobacconist',             neighborhood: 'Kolonaki',    city: 'Athens',        country: 'Greece',    region: 'Europe',   lng: 23.7412,  lat: 37.9778, description: 'Upscale tobacconist on Skoufa Street — Cuban cigars, Greek rolling tobacco, and a humidor room locals swear by.', tags: ['shop','tobacco'] },
  { id: 'athens-lycabettus', name: 'Lycabettus Hill Lookout',      neighborhood: 'Kolonaki',    city: 'Athens',        country: 'Greece',    region: 'Europe',   lng: 23.7451,  lat: 37.9818, description: 'The highest point in central Athens. Stone benches under pine trees, the whole basin below you, and a breeze that carries the smoke away.', tags: ['view','outdoor','sunset'] },
  // Lesvos — island terraces and harbour walls
  { id: 'molyvos-harbour',  name: 'Molyvos Harbour Tavernas',      neighborhood: 'Molyvos',     city: 'Lesvos',        country: 'Greece',    region: 'Europe',   lng: 26.1758,  lat: 39.3689, description: 'Stone quay lined with ouzeri tables facing the castle. Fishermen mend nets next to your chair; the whole harbour smells of grilled octopus and tobacco.', tags: ['outdoor','evening','seafront'] },
  { id: 'mytilene-waterfront', name: 'Mytilene Castle Promenade', neighborhood: 'Mytilene',    city: 'Lesvos',        country: 'Greece',    region: 'Europe',   lng: 26.5558,  lat: 39.1012, description: 'The stone walkway below the Byzantine castle. Benches every fifty metres, ferries sliding past, and late sunsets over Turkey across the strait.', tags: ['view','outdoor','sunset'] },
  { id: 'petra-monastery',  name: 'Petra Rock Terrace',            neighborhood: 'Petra',       city: 'Lesvos',        country: 'Greece',    region: 'Europe',   lng: 26.1765,  lat: 39.3301, description: 'Climb the 114 steps to Panagia Glykofilousa church, then sit on the rock ledge above the village. Locals come up here after dinner with a coffee and a cigarette.', tags: ['view','hidden','outdoor'] },
];

async function main() {
  const sb = adminClient();
  const rows = PLACES.map((p) => ({
    external_id: `seed:${p.id}`,
    source: 'seed',
    name: p.name,
    description: p.description,
    type: 'spot' as const,
    lat: p.lat,
    lng: p.lng,
    country: p.country,
    city: p.city,
    neighborhood: p.neighborhood,
    region: p.region,
    tags: p.tags,
    verified: true,
  }));

  const { error, count } = await sb
    .from(TABLES.places)
    .upsert(rows, { onConflict: 'external_id', count: 'exact' });

  if (error) {
    console.error('seed failed:', error.message);
    process.exit(1);
  }
  console.log(`seeded ${count ?? rows.length} editorial places`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
