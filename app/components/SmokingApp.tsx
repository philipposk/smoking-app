// @ts-nocheck
'use client';
/* eslint-disable */
// Ported from the claude.ai design (Smoking.zip / app.jsx). Preserved 1:1.
// TS checking is off because the source is loose JS with editorial seed data.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import LanguagePicker from './LanguagePicker';
import ImageUploader from './ImageUploader';
import VerifyEmailHint from './VerifyEmailHint';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false });

/* ============================================================
   data
   ============================================================ */

// Coordinates are normalized (lng, lat) → (x %, y %) on an equirectangular map.
// Real lng/lat preserved for the globe view.
const PLACES = [
  {
    id: "golden-gai",
    name: "Golden Gai",
    neighborhood: "Shinjuku",
    city: "Tokyo",
    country: "Japan",
    region: "Asia",
    type: "Alley bar district",
    rating: 4.8,
    lng: 139.7036, lat: 35.6938,
    photo: 5,
    description:
      "Six narrow lanes of two-storey wooden bars, the city's last unrebuilt postwar block. Lighters still click here.",
    quote: "Pick a door at random. Sit at the bar. Don't ask for the menu.",
    tags: ["nightlife", "iconic", "indoor"],
  },
  {
    id: "lisbon-miradouro",
    name: "Miradouro da Senhora do Monte",
    neighborhood: "Graça",
    city: "Lisbon",
    country: "Portugal",
    region: "Europe",
    type: "Lookout terrace",
    rating: 4.7,
    lng: -9.1322, lat: 38.7191,
    photo: 3,
    description:
      "The highest of Lisbon's lookouts. Pine trees, a tiled bench, the whole city spread below the smoke.",
    quote: "Bring a friend, a bica, and an hour you don't need back.",
    tags: ["view", "sunset", "outdoor"],
  },
  {
    id: "kreuzberg-park",
    name: "Görlitzer Park",
    neighborhood: "Kreuzberg",
    city: "Berlin",
    country: "Germany",
    region: "Europe",
    type: "Open park",
    rating: 4.3,
    lng: 13.4376, lat: 52.4983,
    photo: 2,
    description:
      "An anarchic city park where the rules thin out after sundown. Wide lawns, distant techno, no one notices.",
    quote: "Sit on the grass, watch the slackliners, light up slow.",
    tags: ["late-night", "outdoor", "loud"],
  },
  {
    id: "plaka-athens",
    name: "Plaka District",
    neighborhood: "Plaka",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    type: "Open-air taverna",
    rating: 4.2,
    lng: 23.7298, lat: 37.9715,
    photo: 1,
    description:
      "Stone alleys, bougainvillea, and that one rooftop with a clear view of the Acropolis lit up at night.",
    quote: "Climb the stairs. Order a karafaki. Light up. Stay an hour.",
    tags: ["view", "evening", "outdoor"],
  },
  {
    id: "san-telmo",
    name: "Plaza Dorrego",
    neighborhood: "San Telmo",
    city: "Buenos Aires",
    country: "Argentina",
    region: "Americas",
    type: "Public square",
    rating: 4.4,
    lng: -58.3712, lat: -34.6206,
    photo: 6,
    description:
      "Cobblestones, tango dancers after dark, an accordion two tables over. Cafés ring the square — every one has an ashtray.",
    quote: "Sunday afternoon. Fernet. Don't make plans for later.",
    tags: ["outdoor", "evening", "iconic"],
  },
  {
    id: "roma-norte",
    name: "Café Toscano",
    neighborhood: "Roma Norte",
    city: "Mexico City",
    country: "Mexico",
    region: "Americas",
    type: "Patio café",
    rating: 4.5,
    lng: -99.1601, lat: 19.4138,
    photo: 4,
    description:
      "A jacaranda-shaded patio in the city's most walkable district. The waiters bring matches before you ask.",
    quote: "Stay until the violet petals start dropping on the table.",
    tags: ["morning", "outdoor", "café"],
  },
  {
    id: "marrakech-riad",
    name: "Le Jardin",
    neighborhood: "Medina",
    city: "Marrakech",
    country: "Morocco",
    region: "Africa",
    type: "Hidden courtyard",
    rating: 4.6,
    lng: -7.9858, lat: 31.6324,
    photo: 6,
    description:
      "A green riad courtyard tucked behind an unmarked door in the souk. Mint tea, tortoises underfoot, a sky-blue ceiling of leaves.",
    quote: "If you find it, you have earned the chair.",
    tags: ["hidden", "afternoon", "outdoor"],
  },
  {
    id: "beirut-rooftop",
    name: "Mar Mikhael Rooftops",
    neighborhood: "Mar Mikhael",
    city: "Beirut",
    country: "Lebanon",
    region: "Asia",
    type: "Rooftop bar",
    rating: 4.5,
    lng: 35.5276, lat: 33.8975,
    photo: 4,
    description:
      "A strip of converted warehouses with rooftop bars facing the port. Nargile coals glowing on every other table.",
    quote: "Order arak. Wait for the call to prayer. Light another.",
    tags: ["nightlife", "view", "rooftop"],
  },
  {
    id: "marais-paris",
    name: "Place des Vosges",
    neighborhood: "Le Marais",
    city: "Paris",
    country: "France",
    region: "Europe",
    type: "Café terrasse",
    rating: 4.6,
    lng: 2.3656, lat: 48.8553,
    photo: 1,
    description:
      "Red-brick arcades around a tree-lined square. Every café on the perimeter spills onto the pavement, every table has its tin ashtray.",
    quote: "A vin rouge, an espresso, a pack of Gauloises. The classics.",
    tags: ["outdoor", "iconic", "café"],
  },
];

const FILTERS = ["All", "Europe", "Asia", "Americas", "Africa", "Outdoor", "Rooftop", "Hidden", "Late-night"];

const THREADS = [
  {
    id: "t1",
    title: "Tokyo — is Golden Gai still actually friendly to smokers?",
    author: "marina_v",
    initial: "M",
    date: "May 18",
    body:
      "Going next month for the first time in years. I read the prefecture tightened the indoor rules in 2020 but the listings here say it's still fine in the small bars. Anyone been recently? Which lane is least touristy?",
    tags: ["tokyo", "golden-gai", "asia"],
    replies: 18,
    likes: 42,
    liked: true,
  },
  {
    id: "t2",
    title: "Berlin: what to do when the parks ban it (eventually)",
    author: "alex_k",
    initial: "A",
    date: "May 15",
    body:
      "Görli is still wide open but the writing's on the wall. Where are people moving to when the new park-smoking rules actually get enforced? Asking for a friend with a long-term lease in Kreuzberg.",
    tags: ["berlin", "policy", "europe"],
    replies: 9,
    likes: 21,
    liked: false,
  },
  {
    id: "t3",
    title: "Best miradouro in Lisbon to actually sit at, not just photograph",
    author: "yiota.p",
    initial: "Y",
    date: "May 11",
    body:
      "Senhora do Monte is gorgeous but the bench is always taken. Looking for something with seating, a kiosk that sells beer, and ideally less than a forty-minute climb. Suggestions?",
    tags: ["lisbon", "viewpoint", "recommendations"],
    replies: 22,
    likes: 47,
    liked: false,
  },
  {
    id: "t4",
    title: "Merchant listings — how do you verify the cafés are real?",
    author: "deniz",
    initial: "D",
    date: "May 9",
    body:
      "Someone added a 'rooftop' in Mar Mikhael last week that doesn't exist. Is there a process for flagging fake claims, or do we just rely on the merchant verification badge? Curious how the editors handle it.",
    tags: ["merchants", "moderation"],
    replies: 6,
    likes: 11,
    liked: false,
  },
];

const RECS = [
  { name: "Café Hawelka", neigh: "Vienna · Innere Stadt", why: "You're drawn to old-school interiors and stone courtyards. This is the Viennese version — still smoking-allowed in the back room." },
  { name: "Quartier 21", neigh: "Tunis · Medina", why: "Same hidden-courtyard energy as Le Jardin in Marrakech, with rooftop access and mint tea after dark." },
  { name: "Park Slope Stoops", neigh: "Brooklyn · NYC", why: "For when you want an outdoor neighbourhood feel and you've already explored Berlin's parks." },
];

/* ============================================================
   icons (minimal hand-rolled — no lucide)
   ============================================================ */

const Icon = ({ d, size = 18, fill = "none", strokeWidth = 1.5, style }) =>
  React.createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill, stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", style },
    typeof d === "string" ? React.createElement("path", { d }) : d
  );

const Icons = {
  Sun: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>} />,
  Moon: (p) => <Icon {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  Heart: ({ filled, ...p }) => <Icon {...p} fill={filled ? "currentColor" : "none"} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  X: (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />,
  MapPin: (p) => <Icon {...p} d={<><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>} />,
  MessageSquare: (p) => <Icon {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  Plus2: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  ArrowRight: (p) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />,
  ArrowUpRight: (p) => <Icon {...p} d="M7 17 17 7M7 7h10v10" />,
  ZoomIn: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></>} />,
  ZoomOut: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/></>} />,
  Layers: (p) => <Icon {...p} d="m12 2 10 6-10 6L2 8l10-6zm10 12-10 6L2 14" />,
  Reply: (p) => <Icon {...p} d="M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4" />,
  Building: (p) => <Icon {...p} d={<><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></>} />,
  Send: (p) => <Icon {...p} d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  Sparkles: (p) => <Icon {...p} d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
};

/* ============================================================
   reusable: photo
   ============================================================ */

const Photo = ({ n, children }) => (
  <div className={`photo photo-${n} photo-grain photo-zoom`}>
    {children}
  </div>
);

/* ============================================================
   provider toggle (used in recs strip)
   ============================================================ */

function ProviderToggle() {
  const [provider, setProvider] = useState("openai");
  return (
    <div className="provider-toggle">
      <span>Engine</span>
      <div className="provider-switch">
        <button className={provider === "openai" ? "on" : ""} onClick={() => setProvider("openai")}>OpenAI</button>
        <button className={provider === "groq" ? "on" : ""} onClick={() => setProvider("groq")}>Groq</button>
      </div>
    </div>
  );
}

/* ============================================================
   header
   ============================================================ */

function SearchBox() {
  const t = useTranslations("header");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=10`);
        const j = await r.json().catch(() => ({}));
        setResults(Array.isArray(j.places) ? j.places : []);
      } catch { setResults([]); }
      finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const nearMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`/api/places/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusKm=5&limit=15`);
          const j = await r.json().catch(() => ({}));
          setResults(Array.isArray(j.places) ? j.places : []);
          setOpen(true);
        } finally { setBusy(false); }
      },
      () => {
        setBusy(false);
        alert("Couldn't read your location.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex", gap:6, alignItems:"center"}}>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("searchPlaceholder")}
          style={{
            padding:"6px 10px", fontSize:13, border:"1px solid var(--hair)",
            borderRadius:999, background:"transparent", color:"inherit",
            fontFamily:"inherit", width:180,
          }}
          aria-label={t("searchPlaceholder")}
        />
        <button onClick={nearMe} className="icon-btn" aria-label={t("nearMe")} title={t("nearMe")} disabled={busy}>
          <Icons.MapPin size={16}/>
        </button>
      </div>
      {open && (q.trim() || results.length > 0) && (
        <div
          onMouseLeave={() => setOpen(false)}
          style={{
            position:"absolute", top:"100%", right:0, marginTop:6,
            background:"var(--card)", border:"1px solid var(--hair)",
            borderRadius:6, minWidth:280, maxHeight:340, overflowY:"auto", zIndex:100,
            boxShadow:"0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          {busy && <div style={{padding:12, fontSize:13, color:"var(--muted)"}}>Searching…</div>}
          {!busy && results.length === 0 && (
            <div style={{padding:12, fontSize:13, color:"var(--muted)"}}>
              No matches. {q && "Try a different query."}
            </div>
          )}
          {results.map((p) => (
            <a
              key={p.id}
              href={`/place/${p.id}`}
              style={{display:"block", padding:"10px 12px", borderTop:"1px solid var(--hair-2)", textDecoration:"none", color:"inherit"}}
              onClick={() => setOpen(false)}
            >
              <div style={{fontWeight:500, fontSize:14}}>{p.name}</div>
              <div style={{fontSize:12, color:"var(--muted)"}}>
                {[p.city, p.country].filter(Boolean).join(" · ")} · {p.type}
                {p.distance_km != null && ` · ${p.distance_km.toFixed(1)} km`}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ route, setRoute, theme, setTheme, favCount, user, onSignIn, onSignOut, onAddPlace }) {
  const t = useTranslations("header");
  const nav = [
    ["home", t("nav.home")],
    ["places", t("nav.places")],
    ["saved", t("nav.saved")],
    ["forum", t("nav.forum")],
  ];
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <a href="#" className="brand" onClick={(e)=>{e.preventDefault(); setRoute("home");}}>
          <span className="brand-mark" aria-hidden="true"></span>
          <span>Smoking</span>
        </a>
        <nav className="site-nav">
          {nav.map(([key, label]) => (
            <a
              key={key}
              href="#"
              className={route === key ? "active" : ""}
              onClick={(e) => { e.preventDefault(); setRoute(key); }}
            >
              {label}{key === "saved" && favCount ? ` · ${favCount}` : ""}
            </a>
          ))}
        </nav>
        <div className="site-actions">
          <SearchBox />
          <button
            className="icon-btn"
            onClick={onAddPlace}
            aria-label={t("addPlace")}
            title={t("addPlace")}
          >
            <Icons.Plus size={18}/>
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t("themeToggle")}
            title={t("themeToggle")}
          >
            {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
          </button>
          <LanguagePicker />
          {user ? (
            <>
              <span style={{fontSize:13, color:"var(--muted)"}}>@{user.username}</span>
              <button className="btn btn-ghost" onClick={onSignOut}>{t("signOut")}</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={onSignIn}>{t("signIn")}</button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   merchant claim modal
   ============================================================ */

function MerchantClaimModal({ place, onClose }) {
  const [step, setStep] = useState("form"); // form | sent | error
  const [errMsg, setErrMsg] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", role: "owner", email: "", phone: "", evidence: "", proofUrl: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/places/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeRef: {
            slug: place.id,
            name: place.name,
            city: place.city,
            country: place.country,
          },
          businessName: place.name,
          contactEmail: form.email,
          contactPhone: form.phone || undefined,
          evidence: form.evidence || undefined,
          proofUrl: form.proofUrl || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setErrMsg("You must sign in before submitting a claim.");
        } else if (res.status === 403) {
          setErrMsg(j.error || "Verify your email to submit claims.");
          setNeedsVerify(true);
        } else {
          setErrMsg(j.error || `Submission failed (HTTP ${res.status}).`);
        }
        setStep("error");
        return;
      }
      setStep("sent");
    } catch (err) {
      setErrMsg("Network error. Try again in a moment.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icons.X size={18}/>
        </button>

        {step === "form" ? (
          <>
            <div className="eyebrow" style={{marginBottom: 16}}>Merchant claim · {place.city}</div>
            <h2>Claim <em>{place.name}</em>.</h2>
            <p className="modal-lede">
              You're listing yourself as the owner, manager, or staff of this venue. Once verified — usually within 48 hours — you'll be able to edit hours, photos, and replies on reviews.
            </p>

            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="mc-name">Your name</label>
                <input id="mc-name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Anastasia Papadopoulou" />
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12}}>
                <div className="field">
                  <label htmlFor="mc-role">Role</label>
                  <select id="mc-role" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="mc-phone">Phone</label>
                  <input id="mc-phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+30 ..." />
                </div>
              </div>

              <div className="field">
                <label htmlFor="mc-email">Email at the venue's domain</label>
                <input id="mc-email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@venue.com" />
              </div>

              <div className="field">
                <label htmlFor="mc-evidence">Evidence of ownership</label>
                <textarea
                  id="mc-evidence"
                  rows={3}
                  placeholder="Business registration number, link to your social, or describe how we can verify."
                  value={form.evidence}
                  onChange={e => setForm({...form, evidence: e.target.value})}
                />
              </div>

              <ImageUploader
                kind="claim"
                label="Proof image (optional — license, signed photo, etc.)"
                value={form.proofUrl}
                onUploaded={(url) => setForm((f) => ({...f, proofUrl: url}))}
              />

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-ink" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit claim"}
                </button>
              </div>
            </form>
          </>
        ) : step === "sent" ? (
          <>
            <div className="eyebrow" style={{marginBottom: 16}}>Submitted</div>
            <h2>Thank you, <em>{form.name.split(" ")[0] || "friend"}</em>.</h2>
            <p className="modal-lede">
              We'll review your claim for {place.name} within 48 hours and write to {form.email || "the email you provided"}. While you wait, the listing is unchanged.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ink" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow" style={{marginBottom: 16}}>Couldn't submit</div>
            <h2>Something went wrong.</h2>
            <p className="modal-lede">{errMsg}</p>
            {needsVerify && <VerifyEmailHint message="Confirm your email before submitting a merchant claim." />}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
              <button className="btn btn-ink" onClick={() => setStep("form")}>Try again</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   page assistant (floating)
   ============================================================ */

const ASSIST_GREETING = "I'm Ash, the page assistant. Ask me where to smoke in any city, what your saved spots have in common, or how to claim a venue.";

const ASSIST_SUGGESTIONS = [
  "Spots in Lisbon with a view",
  "Where in Tokyo can I still smoke indoors?",
  "Quiet rooftops, anywhere",
  "How do I claim a café I own?",
];

function Assistant({ favorites, setRoute }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", body: ASSIST_GREETING, suggest: true },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  const reply = (q) => {
    const text = q.trim();
    if (!text) return;
    setMessages(m => [...m, { from: "user", body: text }]);
    setInput("");
    setTyping(true);

    // canned local responses — illustrative only
    setTimeout(() => {
      let body;
      const lower = text.toLowerCase();
      if (lower.includes("lisbon")) {
        body = (<>I'd point you at <strong>Miradouro da Senhora do Monte</strong> in Graça — it's the highest of the lookouts, with a tiled bench facing the river. There are also five more Lisbon spots in the atlas, all open-air.</>);
      } else if (lower.includes("tokyo") || lower.includes("japan")) {
        body = (<>Indoor smoking in Tokyo is restricted citywide as of 2020, but small bars under 100 m² that registered as smoking establishments are still permitted. <strong>Golden Gai</strong> is the easiest place to find one — most of the lanes are full of them.</>);
      } else if (lower.includes("rooftop")) {
        body = (<>Three readers' favourites: <strong>Mar Mikhael in Beirut</strong>, anything along <strong>Roma Norte rooftops in Mexico City</strong>, or — if you're already in Athens — the lesser-known balconies above Plaka.</>);
      } else if (lower.includes("claim") || lower.includes("merchant") || lower.includes("own")) {
        body = (<>Find your venue on the Places page, hit the building icon next to the heart, and submit the claim form. We verify within 48 hours using your business email or registration number. Want me to take you there?</>);
      } else if (lower.includes("saved") || lower.includes("favorite") || lower.includes("favourite")) {
        body = favorites.length
          ? <>You have <strong>{favorites.length} saved spots</strong>. They lean outdoor and European — try Café Toscano in Mexico City for the same vibe in a different time zone.</>
          : <>You haven't saved anything yet. Open the map and tap the heart on any spot — I can recommend off your saved list once it has a few entries.</>;
      } else {
        body = (<>Good question. We have <strong>2,184 spots across 47 cities</strong>. Tell me which city you're in (or want to be in) and what you're after — view, quiet, rooftop, late-night — and I'll narrow it down.</>);
      }
      setMessages(m => [...m, { from: "bot", body }]);
      setTyping(false);
    }, 900);
  };

  if (!open) {
    return (
      <button className="assistant-fab" onClick={() => setOpen(true)}>
        <span className="fab-dot" aria-hidden="true"></span>
        <span className="fab-glyph">A</span>
        <span>Ask the assistant</span>
      </button>
    );
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-head">
        <div className="who">
          <div className="av">A</div>
          <div>
            <h4>Ash</h4>
            <div className="sub">Online · for this page</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
          <Icons.X size={18}/>
        </button>
      </div>

      <div className="assistant-msgs" ref={scrollRef}>
        {messages.map((m, i) => (
          <React.Fragment key={i}>
            <div className={`msg ${m.from}`}>{m.body}</div>
            {m.suggest && (
              <div className="msg-suggest">
                {ASSIST_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => reply(s)}>{s}</button>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
        {typing && (
          <div className="msg bot" style={{padding: "14px 16px"}}>
            <span className="typing"><span></span><span></span><span></span></span>
          </div>
        )}
      </div>

      <form
        className="assistant-compose"
        onSubmit={e => { e.preventDefault(); reply(input); }}
      >
        <input
          placeholder="Ask about a city, a spot, anything…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="send" type="submit" disabled={!input.trim()}>
          <Icons.Send size={14}/>
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   home / index
   ============================================================ */

function HomeView({ setRoute, favorites, toggleFav }) {
  return (
    <>
      <section className="wrap hero">
        <div className="hero-eyebrow">
          <span className="dot" aria-hidden="true"></span>
          <span className="eyebrow">Vol. 01 · Issue 14 · An atlas of 47 cities</span>
        </div>
        <h1 className="hero-h1">
          A quiet atlas of places<br />
          <em>where you can still smoke.</em>
        </h1>
        <p className="hero-lede">
          Open-air terraces, hidden courtyards, seafront walls and rooftop bars — from Tokyo to Lisbon, kept by readers, mapped by the city.
        </p>
        <div className="hero-cta">
          <button className="btn btn-ink btn-lg" onClick={() => setRoute("places")}>
            Open the map <Icons.ArrowRight size={14}/>
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => setRoute("forum")}>
            Read the forum
          </button>
        </div>

        <div className="hero-bottom">
          <div className="stat">
            <div className="n">2,184</div>
            <div className="l">Logged spots</div>
          </div>
          <div className="sep" aria-hidden="true"></div>
          <div className="stat">
            <div className="n">47</div>
            <div className="l">Cities, 23 countries</div>
          </div>
          <div className="sep" aria-hidden="true"></div>
          <div className="stat">
            <div className="n">38,902</div>
            <div className="l">Reader notes</div>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{marginBottom: 12}}>This week's pages</div>
            <h2>Nine worth the <em>flight</em>.</h2>
          </div>
          <div className="right">
            <a href="#" className="btn btn-ghost" onClick={(e)=>{e.preventDefault(); setRoute("places");}}>
              All 2,184 spots <Icons.ArrowUpRight size={14}/>
            </a>
          </div>
        </div>

        <div className="featured-grid">
          {PLACES.map((p, i) => (
            <article key={p.id} className="spot-card" onClick={() => setRoute("places")}>
              <div className="spot-photo">
                <Photo n={p.photo} />
              </div>
              <div className="spot-body">
                <div className="spot-index">
                  No. {String(i + 1).padStart(2, "0")} — {p.city}
                </div>
                <h3 className="spot-name">{p.name}</h3>
                <div className="spot-meta">
                  <span>{p.neighborhood}, {p.country}</span>
                  <span className="dot" aria-hidden="true"></span>
                  <span>{p.type}</span>
                  <span className="dot" aria-hidden="true"></span>
                  <span>★ {p.rating.toFixed(1)}</span>
                </div>
                <p className="spot-quote">&ldquo;{p.quote}&rdquo;</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="recs">
          <div className="recs-head">
            <div className="ember-pulse">
              <span className="dot" aria-hidden="true"></span>
              <span>For you · drawn from {favorites.length || "your"} saved spots</span>
            </div>
            <h3>Notes from the editor.</h3>
            <p>Recommendations based on the corners you keep coming back to. Re-roll any time.</p>
            <div style={{display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap"}}>
              <button className="btn btn-ember">Regenerate</button>
              <ProviderToggle />
            </div>
          </div>
          <div className="recs-list">
            {RECS.map((r, i) => (
              <div key={r.name} className="rec">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="name">{r.name}</div>
                </div>
                <span className="neigh">{r.neigh}</span>
                <p className="why">{r.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="note">
          <h3>What this is, and isn't.</h3>
          <div className="note-body">
            <p>
              Smoking is not an advocacy piece. It is a field guide, written by people who already smoke, for the dwindling number of places — in 47 cities and counting — where doing so is welcomed, or at least not glared at.
            </p>
            <p>
              Most spots collected here are open-air: terraces, courtyards, public squares, the wide stone walls along the gulf. A handful of indoor venues are listed where the city still legally permits it. Health warnings are on the pack; we trust you've read them.
            </p>
            <div className="signature">— The editors, worldwide</div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   globe view (orthographic projection, rotatable)
   ============================================================ */

function project(lng, lat, lng0, R, cx, cy) {
  // orthographic, lat0 = 15° fixed slight tilt
  const lat0 = 15 * Math.PI / 180;
  const λ = (lng - lng0) * Math.PI / 180;
  const φ = lat * Math.PI / 180;
  const cosc = Math.sin(lat0) * Math.sin(φ) + Math.cos(lat0) * Math.cos(φ) * Math.cos(λ);
  if (cosc < 0) return null; // backside
  const x = R * Math.cos(φ) * Math.sin(λ);
  const y = R * (Math.cos(lat0) * Math.sin(φ) - Math.sin(lat0) * Math.cos(φ) * Math.cos(λ));
  return { x: cx + x, y: cy - y, vis: cosc };
}

function GlobeView({ places, selectedId, onSelect }) {
  const [rot, setRot] = useState(20);
  const cx = 200, cy = 200, R = 180;

  // continent points sampled from equirectangular paths → just plot as small dots
  // simpler: use the path data converted to vertices and project each.
  const continentVerts = useMemo(() => {
    const verts = [];
    CONTINENT_PATHS.forEach((d) => {
      // crude parse: extract numbers as pairs
      const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
      const region = [];
      for (let i = 0; i < nums.length; i += 2) {
        const eqx = nums[i];   // 0..360
        const eqy = nums[i+1]; // 0..180
        const lng = (eqx / 360) * 360 - 180;
        const lat = 90 - (eqy / 180) * 180;
        region.push({ lng, lat });
      }
      verts.push(region);
    });
    return verts;
  }, []);

  const selected = places.find(p => p.id === selectedId);

  return (
    <div className="globe-shell">
      <div className="globe-stage">
        <div className="globe-bg" />

        <div className="globe-region-strip">
          {["All", "Europe", "Asia", "Americas", "Africa", "Oceania"].map((r, i) => (
            <a key={r} className={i === 0 ? "on" : ""}>{r}</a>
          ))}
        </div>

        <div className="globe">
          <svg viewBox="0 0 400 400">
            <defs>
              <radialGradient id="gshade" cx="40%" cy="35%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(26,24,20,0.18)" />
              </radialGradient>
            </defs>
            <circle className="sphere" cx={cx} cy={cy} r={R} />

            {/* graticule meridians */}
            {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lng => {
              const pts = [];
              for (let lat = -90; lat <= 90; lat += 4) {
                const p = project(lng, lat, rot, R, cx, cy);
                if (p) pts.push(`${p.x},${p.y}`);
              }
              return pts.length ? <polyline key={`m${lng}`} className="grat" points={pts.join(" ")} /> : null;
            })}
            {/* graticule parallels */}
            {[-60,-30,0,30,60].map(lat => {
              const pts = [];
              for (let lng = -180; lng <= 180; lng += 4) {
                const p = project(lng, lat, rot, R, cx, cy);
                if (p) pts.push(`${p.x},${p.y}`);
              }
              return pts.length ? <polyline key={`p${lat}`} className="grat" points={pts.join(" ")} /> : null;
            })}

            {/* continents as filled polygons */}
            {continentVerts.map((region, i) => {
              const pts = region
                .map(v => project(v.lng, v.lat, rot, R, cx, cy))
                .filter(Boolean)
                .map(p => `${p.x},${p.y}`);
              if (pts.length < 3) return null;
              return <polygon key={i} className="continent" points={pts.join(" ")} />;
            })}

            {/* sphere shading */}
            <circle cx={cx} cy={cy} r={R} fill="url(#gshade)" pointerEvents="none" />

            {/* pins */}
            {places.map(p => {
              const proj = project(p.lng, p.lat, rot, R, cx, cy);
              if (!proj) return null;
              const active = p.id === selectedId;
              return (
                <g key={p.id} onClick={() => onSelect(p.id)} style={{cursor: "pointer"}}>
                  {active && (
                    <circle className="pin-pulse" cx={proj.x} cy={proj.y} r="2" />
                  )}
                  <circle
                    className={`pin-circ ${active ? "active" : ""}`}
                    cx={proj.x}
                    cy={proj.y}
                    r={active ? 4.5 : 3}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {selected && (
          <div className="globe-callout">
            <div className="eyebrow">Now centred · {selected.country}</div>
            <h4>{selected.name}</h4>
            <div className="meta">{selected.neighborhood}, {selected.city} · {selected.type}</div>
            <p style={{fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, lineHeight: 1.4, color: "var(--ink-2)", marginTop: 4}}>
              &ldquo;{selected.quote}&rdquo;
            </p>
          </div>
        )}

        <div className="globe-rot">
          <span>Rotate</span>
          <input
            type="range"
            min="-180"
            max="180"
            value={rot}
            onChange={e => setRot(parseFloat(e.target.value))}
          />
          <span style={{minWidth: 40, textAlign: "right"}}>{Math.round(rot)}°</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   places view (list / map / globe)
   ============================================================ */

/* ============================================================
   world map (equirectangular) + simplified continent paths
   ============================================================ */

// rough continent outlines on equirectangular projection (lon -180..180, lat -90..90)
// → svg viewBox 0..360 x 0..180 (origin top-left)
const CONTINENT_PATHS = [
  // Africa
  "M188 78 L186 86 L188 96 L194 108 L204 120 L212 130 L218 140 L220 148 L216 154 L208 156 L200 150 L194 142 L188 132 L184 122 L182 112 L184 102 L186 90 Z",
  // Europe
  "M180 60 L184 56 L196 54 L210 52 L218 56 L220 64 L214 70 L206 72 L196 74 L186 72 L180 68 Z",
  // Asia
  "M210 50 L228 48 L248 50 L268 56 L282 64 L290 72 L284 80 L274 84 L262 82 L250 80 L240 80 L228 76 L220 70 L212 62 Z",
  // Indonesia / Australasia
  "M280 110 L292 108 L304 110 L312 116 L312 126 L304 132 L292 130 L284 124 L280 116 Z",
  // Australia
  "M278 134 L296 132 L312 134 L320 140 L322 150 L312 156 L296 156 L282 152 L276 144 Z",
  // North America
  "M50 40 L70 36 L92 40 L110 50 L120 64 L114 78 L100 86 L84 92 L70 96 L60 92 L52 82 L46 70 L44 56 Z",
  // Central America
  "M96 92 L106 96 L114 102 L118 110 L114 116 L106 116 L98 112 L94 104 Z",
  // South America
  "M114 116 L124 114 L134 118 L142 126 L146 136 L146 148 L140 158 L132 162 L122 160 L116 152 L114 142 L112 130 Z",
  // Greenland
  "M124 24 L142 22 L150 28 L148 38 L140 42 L128 40 L122 32 Z",
  // UK / Ireland
  "M174 56 L180 54 L182 60 L178 64 L174 62 Z",
  // Japan
  "M298 64 L304 62 L308 68 L304 74 L300 72 Z",
  // Madagascar
  "M226 132 L230 128 L232 138 L228 148 L224 144 Z",
];

function WorldMap({ places, selectedId, onSelect }) {
  const lngToX = (lng) => ((lng + 180) / 360) * 100;
  const latToY = (lat) => ((90 - lat) / 180) * 100;

  return (
    <svg className="worldmap-svg" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" style={{position:"absolute", inset:0, width:"100%", height:"100%"}}>
      <defs>
        <pattern id="dotgrid" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.25" fill="rgba(26,24,20,0.18)" />
        </pattern>
      </defs>
      <rect width="360" height="180" fill="url(#dotgrid)" />
      {/* graticule */}
      <g className="graticule">
        {[-60,-30,0,30,60].map(lat => (
          <line key={lat} x1="0" y1={latToY(lat)} x2="360" y2={latToY(lat)} />
        ))}
        {[-120,-60,0,60,120].map(lng => (
          <line key={lng} x1={lngToX(lng)} y1="0" x2={lngToX(lng)} y2="180" />
        ))}
      </g>
      {/* continents */}
      <g>
        {CONTINENT_PATHS.map((d, i) => (
          <path key={i} className="land" d={d} />
        ))}
      </g>
      {/* pins */}
      {places.map((p, i) => {
        const cx = (p.lng + 180) / 360 * 360;
        const cy = (90 - p.lat) / 180 * 180;
        const active = p.id === selectedId;
        return (
          <g key={p.id} style={{cursor: "pointer"}} onClick={() => onSelect(p.id)}>
            {active && <circle cx={cx} cy={cy} r="3.5" fill="rgba(185,66,26,0.25)" />}
            <circle
              cx={cx}
              cy={cy}
              r={active ? 2.2 : 1.6}
              fill={active ? "var(--ember)" : "var(--ink)"}
              stroke="var(--paper)"
              strokeWidth="0.4"
            />
          </g>
        );
      })}
    </svg>
  );
}

function PlacesView({ favorites, toggleFav, openClaim }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(PLACES[0].id);
  const [mode, setMode] = useState("live"); // live | map | list | globe

  const filtered = useMemo(() => {
    if (activeFilter === "All") return PLACES;
    const f = activeFilter.toLowerCase();
    return PLACES.filter(p =>
      (p.region || "").toLowerCase().includes(f) ||
      p.city.toLowerCase().includes(f) ||
      p.country.toLowerCase().includes(f) ||
      p.type.toLowerCase().includes(f) ||
      p.tags.some(t => t.includes(f))
    );
  }, [activeFilter]);

  const selected = PLACES.find(p => p.id === selectedId);

  // Live view: pulls from /api/places (DB-backed, OSM/scraper data)
  if (mode === "live") {
    return <LivePlacesView mode={mode} setMode={setMode} />;
  }

  // Globe view: full-bleed, no list
  if (mode === "globe") {
    return (
      <>
        <div style={{borderTop: "1px solid var(--hair)", background: "var(--paper)"}}>
          <div className="wrap" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px"}}>
            <div>
              <div className="eyebrow">The atlas · globe view</div>
              <h1 style={{fontFamily: "var(--serif)", fontSize: 32, letterSpacing: "-0.01em", lineHeight: 1, marginTop: 4}}>
                {PLACES.length} spots, 23 countries.
              </h1>
            </div>
            <ViewSwitch mode={mode} setMode={setMode} />
          </div>
        </div>
        <GlobeView places={PLACES} selectedId={selectedId} onSelect={setSelectedId} />
      </>
    );
  }

  // List-only mode: full-width column
  if (mode === "list") {
    return (
      <>
        <div style={{borderTop: "1px solid var(--hair)", background: "var(--paper)"}}>
          <div className="wrap" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px"}}>
            <div>
              <div className="eyebrow">The index · list view</div>
              <h1 style={{fontFamily: "var(--serif)", fontSize: 32, letterSpacing: "-0.01em", lineHeight: 1, marginTop: 4}}>
                {filtered.length} of {PLACES.length}
              </h1>
            </div>
            <ViewSwitch mode={mode} setMode={setMode} />
          </div>
          <div className="wrap" style={{padding: "0 32px 16px"}}>
            <div className="places-filters" style={{borderTop: "1px solid var(--hair)", borderBottom: 0, padding: "14px 0"}}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${activeFilter === f ? "active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="wrap" style={{maxWidth: 880, padding: "32px"}}>
          {filtered.map((p, i) => (
            <PlaceRow
              key={p.id}
              p={p}
              i={i}
              isFav={favorites.includes(p.id)}
              isSel={false}
              onSelect={() => {}}
              onFav={() => toggleFav(p.id)}
              onClaim={() => openClaim(p)}
            />
          ))}
        </div>
      </>
    );
  }

  // Map mode (default)
  return (
    <>
      <div style={{borderTop: "1px solid var(--hair)", background: "var(--paper)"}}>
        <div className="wrap" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", gap: 24, flexWrap: "wrap"}}>
          <div>
            <div className="eyebrow">The atlas</div>
            <h1 style={{fontFamily: "var(--serif)", fontSize: 32, letterSpacing: "-0.01em", lineHeight: 1, marginTop: 4}}>
              {filtered.length} of {PLACES.length} spots
            </h1>
          </div>
          <ViewSwitch mode={mode} setMode={setMode} />
        </div>
      </div>

      <div className="places-shell" style={{height: "calc(100vh - 64px - 88px)"}}>
        <div className="places-list-wrap">
          <div className="places-filters">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`chip ${activeFilter === f ? "active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="places-list">
            {filtered.map((p, i) => (
              <PlaceRow
                key={p.id}
                p={p}
                i={i}
                isFav={favorites.includes(p.id)}
                isSel={p.id === selectedId}
                onSelect={() => setSelectedId(p.id)}
                onFav={() => toggleFav(p.id)}
                onClaim={() => openClaim(p)}
              />
            ))}
          </div>
        </div>

        <div className="places-map" style={{position:"relative", overflow:"hidden"}}>
          {/* Real MapLibre map backed by seed editorial places */}
          <LiveMap
            places={filtered.map(p => ({
              id: p.id,
              name: p.name,
              lat: p.lat,
              lng: p.lng,
              type: p.type,
              city: p.city,
              country: p.country,
            }))}
            initialZoom={2}
            initialCenter={[20, 30]}
          />

          {selected && (
            <div className="map-overlay-card">
              <div className="eyebrow">{selected.country} · {selected.city}</div>
              <h3 style={{fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1.05, letterSpacing: "-0.005em"}}>
                {selected.name}
              </h3>
              <div className="meta">{selected.neighborhood} · {selected.type} · ★ {selected.rating.toFixed(1)}</div>
              <p style={{fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-2)", fontSize: 15, lineHeight: 1.4, marginTop: 4}}>
                &ldquo;{selected.quote}&rdquo;
              </p>
              <div style={{display: "flex", gap: 8, marginTop: 6}}>
                <button
                  className={`btn ${favorites.includes(selected.id) ? "btn-ember" : "btn-ghost"}`}
                  onClick={() => toggleFav(selected.id)}
                >
                  {favorites.includes(selected.id) ? "Saved" : "Save"}
                </button>
                <a href={`/place/${selected.id}`} className="btn btn-ink" style={{flex: 1, textDecoration:"none", textAlign:"center"}}>
                  Open ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ViewSwitch({ mode, setMode }) {
  return (
    <div className="view-toggle">
      <button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")}>
        <Icons.MapPin size={12}/> Map
      </button>
      <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>
        <Icons.Layers size={12}/> List
      </button>
      <button className={mode === "globe" ? "active" : ""} onClick={() => setMode("globe")}>
        <span style={{fontSize:11, lineHeight:1}}>◐</span> Globe
      </button>
      <button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")} title="Live data from OpenStreetMap + scrapers">
        <Icons.Sparkles size={12}/> Live
      </button>
    </div>
  );
}

function LivePlacesView({ mode, setMode }) {
  const [data, setData] = useState({ status: "loading", places: [], err: "" });
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    fetch("/api/places?limit=500")
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!alive) return;
        if (!ok) setData({ status: "error", places: [], err: j.error || "Request failed" });
        else setData({ status: "ok", places: j.places || [], err: "" });
      })
      .catch((e) => alive && setData({ status: "error", places: [], err: e.message }));
    return () => { alive = false; };
  }, []);

  const typeCounts = useMemo(() => {
    const c = { shop: 0, bench: 0, smoking_area: 0, cafe: 0, dispensary: 0, kiosk: 0, convenience: 0, spot: 0 };
    for (const p of data.places) {
      if (p.type in c) c[p.type]++;
    }
    return c;
  }, [data.places]);

  const visible = typeFilter === "all"
    ? data.places
    : data.places.filter((p) => p.type === typeFilter);

  return (
    <>
      <div style={{borderTop: "1px solid var(--hair)", background: "var(--paper)"}}>
        <div className="wrap" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", gap: 24, flexWrap: "wrap"}}>
          <div>
            <div className="eyebrow">Live data · OSM + scrapers</div>
            <h1 style={{fontFamily: "var(--serif)", fontSize: 32, letterSpacing: "-0.01em", lineHeight: 1, marginTop: 4}}>
              {data.status === "loading" ? "Loading…"
                : data.status === "error" ? "Couldn't load"
                : `${visible.length} of ${data.places.length} live places`}
            </h1>
          </div>
          <ViewSwitch mode={mode} setMode={setMode} />
        </div>
        <div className="wrap" style={{padding: "0 32px 16px"}}>
          <div className="places-filters" style={{borderTop: "1px solid var(--hair)", borderBottom: 0, padding: "14px 0", flexWrap: "wrap"}}>
            {[
              ["all", `All · ${data.places.length}`],
              ["shop", `Shops · ${typeCounts.shop}`],
              ["bench", `Benches · ${typeCounts.bench}`],
              ["smoking_area", `Smoking areas · ${typeCounts.smoking_area}`],
              ["cafe", `Cafés · ${typeCounts.cafe}`],
              ["kiosk", `Kiosks · ${typeCounts.kiosk}`],
            ].map(([k, label]) => (
              <button
                key={k}
                className={`chip ${typeFilter === k ? "active" : ""}`}
                onClick={() => setTypeFilter(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Always render the map. Fall back to seed editorial places when API
          is empty (Supabase not configured or scraper hasn't run yet). */}
      {data.status !== "error" && (
        <LiveMap
          places={
            visible.length > 0
              ? visible
              : PLACES.map(p => ({
                  id: p.id, name: p.name, lat: p.lat, lng: p.lng,
                  type: p.type, city: p.city, country: p.country,
                }))
          }
        />
      )}

      <div className="wrap" style={{maxWidth: 880, padding: "32px"}}>
        {data.status === "error" && (
          <div style={{padding: 24, border: "1px solid var(--hair)", borderRadius: 8, background: "var(--card)", marginBottom: 24}}>
            <p style={{fontWeight: 600, marginBottom: 4}}>Live data unavailable</p>
            <p style={{color: "var(--ember-2)", marginBottom: 8, fontSize: 13}}>{data.err}</p>
            <p style={{fontSize: 13, color: "var(--muted)"}}>
              Most often this means Supabase isn&apos;t configured yet. See <code>SETUP_SUPABASE.md</code>.
              Showing the editorial 9 seed spots below.
            </p>
          </div>
        )}
        {data.status === "error" && (
          PLACES.map((p, i) => (
            <a key={p.id} href={`/place/${p.id}`} style={{display:"block", textDecoration:"none", color:"inherit"}}>
              <article className="place-row">
                <div className="place-row-no"><span>No. {String(i + 1).padStart(3, "0")}</span></div>
                <div className="place-row-body">
                  <div className="place-row-head">
                    <div>
                      <div className="eyebrow">{p.country} · {p.city}</div>
                      <h3 className="place-row-name">{p.name}</h3>
                    </div>
                  </div>
                  <p className="place-row-meta"><span className="tag">{p.type}</span></p>
                </div>
              </article>
            </a>
          ))
        )}
        {data.status === "ok" && visible.length === 0 && (
          <div style={{padding: 32, textAlign: "center", color: "var(--muted)"}}>
            <p style={{marginBottom: 8}}>No live places for this filter yet.</p>
            <p style={{fontSize: 13}}>
              Run <code>npm run scrape:osm</code> to pull tobacco shops + benches from OpenStreetMap.
            </p>
          </div>
        )}
        {data.status === "ok" && visible.slice(0, 200).map((p, i) => (
          <a key={p.id} href={`/place/${p.id}`} style={{display:"block", textDecoration:"none", color:"inherit"}}>
            <article className="place-row">
              <div className="place-row-no">
                <span>No. {String(i + 1).padStart(3, "0")}</span>
              </div>
              <div className="place-row-body">
                <div className="place-row-head">
                  <div>
                    <div className="eyebrow">{p.country || "—"} · {p.city || p.neighborhood || "—"}</div>
                    <h3 className="place-row-name">{p.name}</h3>
                  </div>
                </div>
                <p className="place-row-meta">
                  <span className="tag">{p.type}</span>
                  {p.source && <span className="tag">{p.source}</span>}
                  {p.verified && <span className="tag">verified</span>}
                </p>
                {p.description && <p className="place-row-desc">{p.description}</p>}
              </div>
            </article>
          </a>
        ))}
        {data.status === "ok" && visible.length > 200 && (
          <p style={{textAlign: "center", color: "var(--muted)", fontSize: 13, padding: 16}}>
            Showing first 200. Use the type filter or the bbox query on <code>/api/places</code> for more.
          </p>
        )}
      </div>
    </>
  );
}

function PlaceRow({ p, i, isFav, isSel, onSelect, onFav, onClaim }) {
  return (
    <article
      className={`place-row ${isSel ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="place-thumb">
        <Photo n={p.photo} />
      </div>
      <div className="place-info">
        <h3 className="pname">{p.name}</h3>
        <div className="pmeta">
          <span>No. {String(PLACES.indexOf(p) + 1).padStart(2, "0")}</span>
          <span className="dot" aria-hidden="true"></span>
          <span>{p.city}, {p.country}</span>
          <span className="dot" aria-hidden="true"></span>
          <span>★ {p.rating.toFixed(1)}</span>
          {p.merchantVerified && (
            <>
              <span className="dot" aria-hidden="true"></span>
              <span className="merchant-badge">Merchant</span>
            </>
          )}
        </div>
        <p className="pdesc">{p.description}</p>
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: 4, alignItems: "center"}}>
        <button
          className={`place-fav ${isFav ? "is-fav" : ""}`}
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          title={isFav ? "Remove from saved" : "Save"}
        >
          <Icons.Heart filled={isFav} size={18} />
        </button>
        <button
          className="merchant-btn"
          onClick={(e) => { e.stopPropagation(); onClaim(); }}
          title="Claim as merchant"
        >
          <Icons.Building size={16} />
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   saved / gallery
   ============================================================ */

function SavedView({ favorites, toggleFav, setRoute }) {
  const saved = PLACES.filter(p => favorites.includes(p.id));

  return (
    <main className="wrap gallery">
      <header className="gallery-head">
        <div>
          <div className="eyebrow" style={{marginBottom: 16}}>Personal index</div>
          <h1>Your <em>saved</em>.</h1>
        </div>
        <div className="meta">{saved.length} {saved.length === 1 ? "spot" : "spots"} kept</div>
      </header>

      {saved.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">∅</div>
          <h2>Nothing kept yet.</h2>
          <p>Open the map and tap the heart on the places worth coming back to. They'll collect here, in order.</p>
          <button className="btn btn-ink btn-lg" onClick={() => setRoute("places")}>
            Open the map <Icons.ArrowRight size={14}/>
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {saved.map((p, i) => (
            <article key={p.id} className="gallery-card">
              <div className="gphoto">
                <Photo n={p.photo} />
                <button className="remove" onClick={() => toggleFav(p.id)} title="Remove">
                  <Icons.X size={16}/>
                </button>
              </div>
              <div className="meta">No. {String(i + 1).padStart(2, "0")} · saved {["3 days ago","last week","this morning","yesterday"][i % 4]}</div>
              <h3 className="gname">{p.name}</h3>
              <div className="gmeta">
                <span className="meta">{p.neighborhood}</span>
                <span className="meta" aria-hidden="true">·</span>
                <span className="meta">{p.type}</span>
                <span className="meta" aria-hidden="true">·</span>
                <span className="meta">★ {p.rating.toFixed(1)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

/* ============================================================
   forum
   ============================================================ */

function ForumView({ user, onSignIn }) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", tags: "" });
  const [threads, setThreads] = useState(THREADS);
  const [submitErr, setSubmitErr] = useState("");
  const [submitNeedsVerify, setSubmitNeedsVerify] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real posts on mount, prepend them to the editorial seed so the page
  // is never empty even if Supabase isn't configured yet.
  useEffect(() => {
    let alive = true;
    fetch("/api/forum/posts?limit=50")
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((j) => {
        if (!alive || !Array.isArray(j.posts)) return;
        const mapped = j.posts.map((p) => ({
          id: p.id,
          title: p.title,
          author: p.users?.username ?? "user",
          initial: (p.users?.username ?? "U")[0].toUpperCase(),
          date: new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          body: p.body,
          tags: p.category ? [p.category] : [],
          replies: 0, likes: 0, liked: false,
        }));
        if (mapped.length) setThreads([...mapped, ...THREADS]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim() || submitting) return;
    if (!user) {
      setSubmitErr("Sign in to post.");
      onSignIn?.();
      return;
    }
    setSubmitting(true);
    setSubmitErr("");
    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          body: draft.body || draft.title,
          category: draft.tags.split(",").map((t) => t.trim()).filter(Boolean)[0] || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitErr(j.error || `Failed (HTTP ${res.status})`);
        if (res.status === 403) setSubmitNeedsVerify(true);
        return;
      }
      // Prepend locally so the user sees their post immediately
      setThreads((t) => [{
        id: j.post?.id ?? `t${Date.now()}`,
        title: draft.title,
        author: user.username,
        initial: user.username[0].toUpperCase(),
        date: "now",
        body: draft.body,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        replies: 0, likes: 0, liked: false,
      }, ...t]);
      setDraft({ title: "", body: "", tags: "" });
      setComposing(false);
    } catch {
      setSubmitErr("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = (id) => {
    setThreads(threads.map(t => t.id === id ? { ...t, liked: !t.liked, likes: t.likes + (t.liked ? -1 : 1) } : t));
  };

  return (
    <main className="wrap forum">
      <header className="forum-head">
        <div className="eyebrow" style={{marginBottom: 16}}>Reader correspondence</div>
        <h1><em>Letters</em>.</h1>
        <p className="lede">Questions, finds, complaints, recommendations. From readers, to readers.</p>
        <div style={{marginTop: 24, display: "flex", gap: 8, alignItems: "center"}}>
          {!composing && (
            <button className="btn btn-ink" onClick={() => setComposing(true)}>
              <Icons.Plus size={14}/> Write a letter
            </button>
          )}
          <span className="meta">{threads.length} threads · {threads.reduce((s, t) => s + t.replies, 0)} replies</span>
        </div>
      </header>

      {composing && (
        <form className="forum-compose" onSubmit={submit}>
          <input
            className="title-input"
            placeholder="A title — say what you mean."
            value={draft.title}
            onChange={e => setDraft({...draft, title: e.target.value})}
            autoFocus
          />
          <textarea
            placeholder="The question, the find, the complaint."
            value={draft.body}
            onChange={e => setDraft({...draft, body: e.target.value})}
            rows={4}
          />
          <div className="compose-row">
            <input
              className="tag-input"
              placeholder="#tags, separated by commas"
              value={draft.tags}
              onChange={e => setDraft({...draft, tags: e.target.value})}
            />
            <div style={{display: "flex", gap: 8}}>
              <button type="button" className="btn btn-ghost" onClick={() => setComposing(false)}>Cancel</button>
              <button type="submit" className="btn btn-ink" disabled={submitting}>
                {submitting ? "…" : "Post"}
              </button>
            </div>
          </div>
          {submitErr && !submitNeedsVerify && (
            <p style={{color:"var(--ember-2)", fontSize:14, marginTop:8}}>{submitErr}</p>
          )}
          {submitNeedsVerify && <VerifyEmailHint message={submitErr || "Verify your email to post."} />}
        </form>
      )}

      <div>
        {threads.map((t) => (
          <Thread
            key={t.id}
            t={t}
            user={user}
            onSignIn={onSignIn}
            onLikeToggle={() => toggleLike(t.id)}
            onReplyAdded={() =>
              setThreads((all) => all.map((x) => x.id === t.id ? { ...x, replies: (x.replies || 0) + 1 } : x))
            }
          />
        ))}
      </div>
    </main>
  );
}

// Thread row with lazy-loaded replies + inline reply form.
// Replies are fetched from /api/forum/replies on first expand and cached in state.
// Real (UUID id) threads talk to the API; seed threads (string id) stay local.
function Thread({ t, user, onSignIn, onLikeToggle, onReplyAdded }) {
  const isReal = typeof t.id === "string" && t.id.length === 36;
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const loadReplies = async () => {
    if (loaded || loading || !isReal) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/forum/replies?postId=${t.id}`);
      const j = await r.json().catch(() => ({}));
      setReplies(Array.isArray(j.replies) ? j.replies : []);
      setLoaded(true);
    } finally { setLoading(false); }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadReplies();
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    if (!user) { onSignIn?.(); return; }
    if (!isReal) {
      setErr("This is a seed thread — sign-in and create your own post to start a real conversation.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/forum/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: t.id, body: draft }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || `Failed (HTTP ${res.status})`);
        return;
      }
      setReplies((r) => [...r, {
        id: j.reply?.id ?? Date.now(),
        body: draft,
        created_at: new Date().toISOString(),
        users: { username: user.username },
      }]);
      setDraft("");
      onReplyAdded?.();
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  };

  return (
    <article className="thread">
      <div className="thead">
        <span className="avatar">{t.initial}</span>
        <span>{t.author}</span>
        <span className="dot" aria-hidden="true"></span>
        <span>{t.date}</span>
      </div>
      <h3>{t.title}</h3>
      <p className="body">{t.body}</p>
      <div className="footer">
        <div className="tags">
          {t.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div className="actions">
          <button className="action-btn" onClick={toggleOpen} aria-expanded={open}>
            <Icons.Reply size={13}/> {t.replies}{open ? " ▾" : " ▸"}
          </button>
          <button className={`action-btn ${t.liked ? "liked" : ""}`} onClick={onLikeToggle}>
            <Icons.Heart filled={t.liked} size={13}/> {t.likes}
          </button>
        </div>
      </div>

      {open && (
        <div style={{marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hair-2)"}}>
          {loading && <p style={{fontSize: 13, color: "var(--muted)"}}>Loading replies…</p>}
          {!loading && replies.length === 0 && loaded && (
            <p style={{fontSize: 13, color: "var(--muted)"}}>No replies yet. Be first.</p>
          )}
          {replies.map((r) => (
            <div key={r.id} style={{padding: "8px 0", borderTop: "1px solid var(--hair-2)"}}>
              <div style={{fontSize: 13, color: "var(--muted)", marginBottom: 4}}>
                @{r.users?.username ?? "user"} · {new Date(r.created_at).toLocaleDateString()}
              </div>
              <p style={{fontSize: 14, lineHeight: 1.5}}>{r.body}</p>
            </div>
          ))}

          <form onSubmit={submitReply} style={{marginTop: 12}}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder={user ? "Reply…" : "Sign in to reply"}
              disabled={!user || !isReal}
              style={{
                width: "100%", padding: 8, fontSize: 14, fontFamily: "inherit",
                border: "1px solid var(--hair)", borderRadius: 4, background: "var(--card)",
              }}
            />
            {err && <p style={{color: "var(--ember-2)", fontSize: 13, marginTop: 4}}>{err}</p>}
            <div style={{display: "flex", justifyContent: "flex-end", marginTop: 8}}>
              <button type="submit" className="btn btn-ink" disabled={busy || !draft.trim()}>
                {busy ? "…" : "Reply"}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

/* ============================================================
   footer
   ============================================================ */

function Footer({ setRoute }) {
  return (
    <footer className="site-footer">
      <div className="wrap inner">
        <div>
          <p className="colophon">
            Smoking is an independent reader-kept field guide to Athens & Thessaloniki. Set in Instrument Serif and Space Grotesk.
          </p>
        </div>
        <div>
          <h4>Read</h4>
          <ul>
            <li><a href="#" onClick={(e)=>{e.preventDefault(); setRoute("places");}}>The map</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault(); setRoute("forum");}}>Letters</a></li>
            <li><a href="#" onClick={(e)=>{e.preventDefault(); setRoute("saved");}}>Your saved</a></li>
          </ul>
        </div>
        <div>
          <h4>Cities</h4>
          <ul>
            <li><a href="#">Athens</a></li>
            <li><a href="#">Thessaloniki</a></li>
            <li><a href="#">Submit a city</a></li>
          </ul>
        </div>
        <div>
          <h4>About</h4>
          <ul>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="wrap bottom">
        <span>© 2026 Smoking · Athens</span>
        <span>Vol. 01 · Issue 14</span>
      </div>
    </footer>
  );
}

/* ============================================================
   auth modal
   ============================================================ */

function AddPlaceModal({ onClose, onAdded, user, onSignIn }) {
  const [form, setForm] = useState({
    name: "", type: "spot", lat: "", lng: "",
    country: "", city: "", neighborhood: "", description: "",
    photo_url: "",
  });
  const [err, setErr] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  // Debounced reverse-geocode against Photon (komoot public, free, no key).
  // Fires whenever lat+lng are both valid numbers. Only fills empty fields
  // so the user's manual edits aren't clobbered.
  useEffect(() => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    const ctl = new AbortController();
    const id = setTimeout(async () => {
      setGeoBusy(true);
      try {
        const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1`;
        const r = await fetch(url, { signal: ctl.signal });
        if (!r.ok) return;
        const j = await r.json();
        const p = j?.features?.[0]?.properties;
        if (!p) return;
        setForm((f) => ({
          ...f,
          country: f.country || p.country || "",
          city: f.city || p.city || p.town || p.village || p.county || "",
          neighborhood: f.neighborhood || p.district || p.suburb || p.locality || "",
        }));
      } catch {
        // network errors silent; user can fill manually
      } finally {
        setGeoBusy(false);
      }
    }, 600);
    return () => { clearTimeout(id); ctl.abort(); };
  }, [form.lat, form.lng]);

  const fillFromLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => { setLocating(false); alert("Couldn't read location."); },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!user) { onSignIn?.(); return; }

    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErr("Latitude + longitude required (use the 'Use my location' button).");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          lat, lng,
          country: form.country || undefined,
          city: form.city || undefined,
          neighborhood: form.neighborhood || undefined,
          description: form.description || undefined,
          photo_url: form.photo_url || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || `Failed (HTTP ${res.status})`);
        if (res.status === 403) setNeedsVerify(true);
        return;
      }
      onAdded?.(j.place);
      onClose();
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icons.X size={18}/>
        </button>
        <div className="eyebrow" style={{marginBottom:16}}>Submit a spot</div>
        <h2>Add a <em>place</em>.</h2>
        <p className="modal-lede">
          Drop a place worth knowing about. Other readers will see it once a moderator confirms it isn&apos;t spam.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="ap-name">Name</label>
            <input id="ap-name" required value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="field">
              <label htmlFor="ap-type">Type</label>
              <select id="ap-type" value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})}>
                <option value="spot">Spot</option>
                <option value="shop">Tobacco shop</option>
                <option value="cafe">Café</option>
                <option value="dispensary">Dispensary</option>
                <option value="kiosk">Kiosk</option>
                <option value="convenience">Convenience store</option>
                <option value="bench">Bench</option>
                <option value="smoking_area">Designated smoking area</option>
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <button type="button" className="btn btn-ghost" onClick={fillFromLocation} disabled={locating}>
                {locating ? "…" : "Use my location"}
              </button>
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div className="field">
              <label htmlFor="ap-lat">Latitude</label>
              <input id="ap-lat" required type="number" step="any" value={form.lat} onChange={(e)=>setForm({...form, lat:e.target.value})} />
            </div>
            <div className="field">
              <label htmlFor="ap-lng">Longitude</label>
              <input id="ap-lng" required type="number" step="any" value={form.lng} onChange={(e)=>setForm({...form, lng:e.target.value})} />
            </div>
          </div>

          <div style={{display:"flex", justifyContent:"flex-end", marginTop:-8, marginBottom:4, height:14, fontSize:11, color:"var(--muted)"}}>
            {geoBusy && "Looking up address from coordinates…"}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
            <div className="field">
              <label htmlFor="ap-country">Country</label>
              <input id="ap-country" value={form.country} onChange={(e)=>setForm({...form, country:e.target.value})} />
            </div>
            <div className="field">
              <label htmlFor="ap-city">City</label>
              <input id="ap-city" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} />
            </div>
            <div className="field">
              <label htmlFor="ap-hood">Neighborhood</label>
              <input id="ap-hood" value={form.neighborhood} onChange={(e)=>setForm({...form, neighborhood:e.target.value})} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="ap-desc">Description (optional)</label>
            <textarea id="ap-desc" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
          </div>

          <ImageUploader
            kind="place"
            label="Photo (optional)"
            value={form.photo_url}
            onUploaded={(url)=>setForm((f)=>({...f, photo_url: url}))}
          />

          {err && !needsVerify && <p style={{color:"var(--ember-2)", fontSize:14}}>{err}</p>}
          {needsVerify && <VerifyEmailHint message={err || "Verify your email to submit a place."} />}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-ink" disabled={busy}>
              {busy ? "…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthModal({ onClose, onAuthed }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup"
        ? { username: form.username, email: form.email, password: form.password }
        : { username: form.username, password: form.password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || `Failed (HTTP ${res.status})`);
        return;
      }
      onAuthed(j.user);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icons.X size={18} />
        </button>
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          {mode === "signup" ? "Create account" : "Welcome back"}
        </div>
        <h2>
          {mode === "signup" ? <>Sign up to <em>Smoking</em>.</> : <>Sign in to <em>Smoking</em>.</>}
        </h2>
        <p className="modal-lede">
          Save places, post in the forum, claim listings. No public profile until you fill one in.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="au-username">
              {mode === "signup" ? "Username (3+ chars, a-z 0-9 _.-)" : "Username or email"}
            </label>
            <input
              id="au-username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </div>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="au-email">Email</label>
              <input
                id="au-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="au-pw">Password{mode === "signup" ? " (8+ chars)" : ""}</label>
            <input
              id="au-pw"
              type="password"
              required
              minLength={mode === "signup" ? 8 : 1}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {err && (
            <p style={{ color: "var(--ember-2)", fontSize: 14, marginTop: 8 }}>{err}</p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(""); }}
            >
              {mode === "signup" ? "Have an account? Sign in" : "New here? Sign up"}
            </button>
            <button type="submit" className="btn btn-ink" disabled={busy}>
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   app
   ============================================================ */

const FAV_KEY = "smoking_favs_v1";

// Resolve a design slug to a Supabase UUID via external_id='seed:<slug>'.
// Returns null if the seed-loader hasn't been run yet or the place isn't in DB.
// Cached in a Map for the session so we don't re-fetch the same lookup.
async function resolveSlugToUuid(slug, cache) {
  if (cache.has(slug)) return cache.get(slug);
  try {
    const r = await fetch(`/api/places?external_id=${encodeURIComponent(`seed:${slug}`)}&limit=1`);
    if (!r.ok) { cache.set(slug, null); return null; }
    const j = await r.json();
    const uuid = j?.places?.[0]?.id ?? null;
    cache.set(slug, uuid);
    return uuid;
  } catch { cache.set(slug, null); return null; }
}

function App() {
  const [route, setRoute] = useState("home");
  const [theme, setTheme] = useState("light");
  // Favorites are slug ids tied to the editorial seed. Always written to
  // localStorage (so logged-out users keep their list). When the user is
  // signed in AND the seed-loader has run, each toggle is also mirrored to
  // /api/favorites so the list follows them across devices.
  const [favorites, setFavorites] = useState([]);
  const [favsHydrated, setFavsHydrated] = useState(false);
  const [claimingPlace, setClaimingPlace] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  // slug → UUID cache, plus a guard so we only run the one-shot sync once per session
  const slugCache = useRef(new Map());
  const syncedFromDb = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Bootstrap session on mount
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => { if (alive) setUser(j.user ?? null); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavorites(arr.filter((x) => typeof x === "string"));
      } else {
        // First-time visitors get a friendly preset
        setFavorites(["plaka-athens", "lisbon-miradouro"]);
      }
    } catch {}
    setFavsHydrated(true);
  }, []);

  // Persist favorites whenever they change (skip the initial mount)
  useEffect(() => {
    if (!favsHydrated) return;
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites, favsHydrated]);

  // One-shot hydration from server on first sign-in. Merges DB favorites
  // (which arrive as UUIDs joined to places.external_id) with whatever the
  // user already had locally. localStorage is the source of truth for new
  // toggles after this point.
  useEffect(() => {
    if (!user || !favsHydrated || syncedFromDb.current) return;
    syncedFromDb.current = true;
    (async () => {
      try {
        const r = await fetch("/api/favorites");
        if (!r.ok) return;
        const j = await r.json();
        const serverSlugs = [];
        for (const row of j.favorites ?? []) {
          const ext = row.places?.external_id;
          if (typeof ext === "string" && ext.startsWith("seed:")) {
            serverSlugs.push(ext.slice(5));
          }
        }
        if (serverSlugs.length === 0) {
          // No server favorites yet — push the local list up so the next device sees it.
          for (const slug of favorites) {
            const uuid = await resolveSlugToUuid(slug, slugCache.current);
            if (uuid) {
              await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placeId: uuid }),
              }).catch(() => {});
            }
          }
          return;
        }
        // Union of local + server
        setFavorites((cur) => Array.from(new Set([...cur, ...serverSlugs])));
      } catch {}
    })();
  }, [user, favsHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFav = (id) => {
    setFavorites((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);

    // Best-effort DB mirror (skipped if not signed in, or if seed not in DB)
    if (!user) return;
    const willAdd = !favorites.includes(id);
    (async () => {
      const uuid = await resolveSlugToUuid(id, slugCache.current);
      if (!uuid) return; // seed-loader hasn't run yet — localStorage covers it
      try {
        if (willAdd) {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ placeId: uuid }),
          });
        } else {
          await fetch(`/api/favorites?placeId=${uuid}`, { method: "DELETE" });
        }
      } catch {}
    })();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  return (
    <>
      <Header
        route={route}
        setRoute={setRoute}
        theme={theme}
        setTheme={setTheme}
        favCount={favorites.length}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={signOut}
        onAddPlace={() => (user ? setShowAddPlace(true) : setShowAuth(true))}
      />
      {route === "home" && <HomeView setRoute={setRoute} favorites={favorites} toggleFav={toggleFav} />}
      {route === "places" && <PlacesView favorites={favorites} toggleFav={toggleFav} openClaim={setClaimingPlace} />}
      {route === "saved" && <SavedView favorites={favorites} toggleFav={toggleFav} setRoute={setRoute} />}
      {route === "forum" && <ForumView user={user} onSignIn={() => setShowAuth(true)} />}
      {route !== "places" && <Footer setRoute={setRoute} />}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthed={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}

      {showAddPlace && (
        <AddPlaceModal
          onClose={() => setShowAddPlace(false)}
          onAdded={() => {}}
          user={user}
          onSignIn={() => { setShowAddPlace(false); setShowAuth(true); }}
        />
      )}

      {claimingPlace && (
        <MerchantClaimModal place={claimingPlace} onClose={() => setClaimingPlace(null)} />
      )}

      <Assistant favorites={favorites} setRoute={setRoute} />
    </>
  );
}

export default App;
