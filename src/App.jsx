import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// API — Replace with your deployed backend URL
// ─────────────────────────────────────────────
const BASE_URL = "https://microsage-backend.onrender.com";

async function fetchSymptoms(site) {
  try {
    const res = await fetch(`${BASE_URL}/symptoms/${site}`);
    const data = await res.json();
    return [...(data.general_symptoms || []), ...(data.site_specific_symptoms || [])];
  } catch {
    return FALLBACK_SYMPTOMS[site] || [];
  }
}

async function analyzeCase(payload) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Analysis failed");
  }
  return res.json();
}

// ─────────────────────────────────────────────
// FALLBACK SYMPTOMS
// ─────────────────────────────────────────────
const FALLBACK_SYMPTOMS = {
  Respiratory:    ["Fever","Cough","Productive cough","Shortness of breath","Chest pain","Night sweats","Whooping sound","Hemoptysis"],
  Urinary:        ["Fever","Burning urination","Frequent urination","Cloudy urine","Flank pain","Blood in urine"],
  Gastrointestinal:["Fever","Diarrhea","Bloody diarrhea","Abdominal cramps","Nausea / Vomiting","Rice water stools"],
  CNS:            ["Fever","Neck stiffness","Headache","Photophobia","Altered consciousness","Seizures"],
  Skin:           ["Fever","Itching","Rash","Redness / Erythema","Swelling","Pus / Wound discharge","Skin ulceration"],
  Bloodstream:    ["Fever","Chills and rigors","Altered consciousness","Rash","Fatigue / Malaise"],
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const GRAM_OPTIONS = [
  { value: "Gram Positive",    label: "Gram +ve",    desc: "Appears purple/violet" },
  { value: "Gram Negative",    label: "Gram −ve",    desc: "Appears pink/red"      },
  { value: "No Gram Reaction", label: "No Reaction", desc: "Atypical / no cell wall" },
];

const SHAPE_OPTIONS = [
  { value: "Cocci",       label: "Cocci",       icon: "●" },
  { value: "Bacilli",     label: "Bacilli",     icon: "▬" },
  { value: "Coccobacilli",label: "Coccobacilli",icon: "◉" },
];

const SITE_OPTIONS = [
  { value: "Respiratory",      icon: "🌬️" },
  { value: "Urinary",          icon: "💧" },
  { value: "Gastrointestinal", icon: "🍽️" },
  { value: "CNS",              icon: "🧠" },
  { value: "Skin",             icon: "🩹" },
  { value: "Bloodstream",      icon: "🩸" },
];

const AGE_OPTIONS = [
  { value: "Neonate", label: "Neonate", sub: "0–28 days"   },
  { value: "Child",   label: "Child",   sub: "1 mo–12 yrs" },
  { value: "Adult",   label: "Adult",   sub: "13–64 yrs"   },
  { value: "Elderly", label: "Elderly", sub: "65+ yrs"     },
];

const CONFIDENCE_CONFIG = {
  High:     { bg:"rgba(74,222,128,0.08)",  border:"rgba(74,222,128,0.25)",  text:"#4ade80", dot:"#4ade80"  },
  Moderate: { bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.25)",  text:"#fbbf24", dot:"#fbbf24"  },
  Low:      { bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.25)", text:"#f87171", dot:"#f87171"  },
};

const RANK_COLORS = ["#c8a96e","#94a3b8","#b87333"];

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:      #07111f;
    --s1:      #0d1e30;
    --s2:      #132540;
    --s3:      #1a2e4a;
    --gold:    #c8a96e;
    --gold-lt: #e2c98e;
    --white:   #eef2f7;
    --dim:     #8096b0;
    --faint:   #3d556e;
    --bdr:     rgba(200,169,110,0.12);
    --bdr-d:   rgba(255,255,255,0.05);
    --r:       16px; --rsm:10px;
  }
  body { background:var(--bg); color:var(--white); font-family:'DM Sans',sans-serif; min-height:100vh; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:460px; margin:0 auto; min-height:100vh; position:relative; }
  .glow {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse 70% 40% at 50% 0%,rgba(200,169,110,0.07) 0%,transparent 70%),
      radial-gradient(ellipse 50% 30% at 90% 80%,rgba(14,40,80,0.6) 0%,transparent 60%);
  }

  /* LANDING */
  .land { position:relative; z-index:1; padding:0 22px 48px; display:flex; flex-direction:column; min-height:100vh; }
  .hero { padding-top:64px; text-align:center; margin-bottom:40px; }
  .logomark {
    width:76px; height:76px; border-radius:22px;
    background:linear-gradient(145deg,var(--s2),var(--s3));
    border:1px solid var(--bdr); margin:0 auto 22px;
    display:flex; align-items:center; justify-content:center; font-size:34px;
    box-shadow:0 0 48px rgba(200,169,110,0.12),0 8px 32px rgba(0,0,0,0.4);
  }
  .brand { font-family:'Playfair Display',serif; font-size:46px; font-weight:700; letter-spacing:-1.5px; line-height:1; margin-bottom:8px; }
  .brand em { color:var(--gold); font-style:normal; }
  .tagline { font-size:11px; font-weight:600; letter-spacing:3.5px; text-transform:uppercase; color:var(--gold); opacity:.75; margin-bottom:18px; }
  .hero-desc { font-size:15px; color:var(--dim); line-height:1.75; max-width:310px; margin:0 auto 36px; }
  .start-btn {
    display:inline-flex; align-items:center; gap:10px;
    background:var(--gold); color:#07111f;
    font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700;
    padding:16px 40px; border-radius:50px; border:none; cursor:pointer;
    transition:all .25s; box-shadow:0 4px 28px rgba(200,169,110,.28);
  }
  .start-btn:hover { background:var(--gold-lt); transform:translateY(-2px); box-shadow:0 8px 36px rgba(200,169,110,.38); }
  .arr { transition:transform .25s; }
  .start-btn:hover .arr { transform:translateX(5px); }

  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:32px; }
  .stat { background:var(--s1); border:1px solid var(--bdr-d); border-radius:var(--r); padding:18px 10px; text-align:center; }
  .stat-n { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:var(--gold); line-height:1; margin-bottom:5px; }
  .stat-l { font-size:11px; color:var(--faint); text-transform:uppercase; letter-spacing:.5px; font-weight:500; }

  .feats { display:flex; flex-direction:column; gap:10px; margin-bottom:36px; }
  .feat { background:var(--s1); border:1px solid var(--bdr-d); border-radius:var(--r); padding:16px; display:flex; align-items:flex-start; gap:14px; }
  .feat-ic { width:38px; height:38px; border-radius:11px; background:rgba(200,169,110,.09); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .feat h4 { font-size:14px; font-weight:600; color:var(--white); margin-bottom:3px; }
  .feat p  { font-size:12px; color:var(--faint); line-height:1.5; }

  .land-foot { font-size:11px; color:var(--faint); text-align:center; line-height:1.8; border-top:1px solid var(--bdr-d); padding-top:22px; }
  .land-foot strong { color:var(--gold-lt); }

  /* HEADER */
  .hdr {
    position:sticky; top:0; z-index:100;
    background:rgba(7,17,31,0.88); backdrop-filter:blur(20px);
    border-bottom:1px solid var(--bdr-d);
    padding:13px 20px; display:flex; align-items:center; justify-content:space-between;
  }
  .hdr-brand { display:flex; align-items:center; gap:10px; }
  .hdr-mark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,var(--s2),var(--s3)); border:1px solid var(--bdr); display:flex; align-items:center; justify-content:center; font-size:16px; }
  .hdr-name { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; }
  .hdr-name em { color:var(--gold); font-style:normal; }
  .hdr-btn { background:none; border:1px solid var(--bdr-d); color:var(--dim); font-size:13px; padding:7px 14px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
  .hdr-btn:hover { border-color:var(--gold); color:var(--gold); }

  /* FORM */
  .form-wrap { position:relative; z-index:1; padding:24px 20px 48px; }
  .form-intro { margin-bottom:28px; }
  .form-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--white); margin-bottom:4px; }
  .form-sub   { font-size:13px; color:var(--dim); line-height:1.5; }

  .qblock { margin-bottom:26px; }
  .qlabel { font-size:13px; font-weight:600; color:var(--white); margin-bottom:3px; display:flex; align-items:center; gap:6px; }
  .qhint  { font-size:11px; color:var(--dim); font-weight:400; }
  .qdesc  { font-size:12px; color:var(--faint); margin-bottom:10px; line-height:1.5; }

  /* GRAM CARDS */
  .gram-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .gram-card { background:var(--s1); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:14px 8px; text-align:center; cursor:pointer; transition:all .2s; }
  .gram-card.sel { background:rgba(200,169,110,.1); border-color:var(--gold); }
  .gram-card-lbl { font-size:13px; font-weight:600; color:var(--white); margin-bottom:3px; }
  .gram-card-dsc { font-size:10px; color:var(--faint); line-height:1.4; }
  .gram-card.sel .gram-card-lbl { color:var(--gold); }

  /* SHAPE */
  .shape-row { display:flex; gap:8px; }
  .shape-btn { flex:1; background:var(--s1); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:14px 8px; cursor:pointer; transition:all .2s; display:flex; flex-direction:column; align-items:center; gap:6px; color:var(--dim); font-family:'DM Sans',sans-serif; }
  .shape-btn.sel { background:rgba(200,169,110,.1); border-color:var(--gold); color:var(--gold); }
  .shape-ic  { font-size:22px; }
  .shape-lbl { font-size:12px; font-weight:600; }

  /* SITE */
  .site-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .site-btn { background:var(--s1); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:14px 8px; cursor:pointer; transition:all .2s; display:flex; flex-direction:column; align-items:center; gap:7px; font-family:'DM Sans',sans-serif; }
  .site-btn.sel { background:rgba(200,169,110,.1); border-color:var(--gold); }
  .site-em  { font-size:22px; }
  .site-lbl { font-size:12px; font-weight:600; color:var(--dim); }
  .site-btn.sel .site-lbl { color:var(--gold); }

  /* AGE */
  .age-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .age-btn { background:var(--s1); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:12px 6px; cursor:pointer; transition:all .2s; display:flex; flex-direction:column; align-items:center; gap:3px; font-family:'DM Sans',sans-serif; text-align:center; }
  .age-btn.sel { background:rgba(200,169,110,.1); border-color:var(--gold); }
  .age-lbl { font-size:12px; font-weight:600; color:var(--dim); }
  .age-sub { font-size:9px; color:var(--faint); }
  .age-btn.sel .age-lbl { color:var(--gold); }

  /* IMMUNO */
  .immuno-row { display:flex; gap:8px; }
  .immuno-btn { flex:1; background:var(--s1); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:12px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:var(--dim); transition:all .2s; text-align:center; }
  .immuno-btn.sel { background:rgba(200,169,110,.1); border-color:var(--gold); color:var(--gold); }

  /* SYMPTOMS */
  .symp-hint { background:var(--s1); border:1px dashed var(--bdr-d); border-radius:var(--rsm); padding:20px; text-align:center; font-size:13px; color:var(--faint); }
  .symp-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .symp-chip { background:var(--s1); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:10px 12px; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:var(--dim); transition:all .2s; text-align:left; }
  .symp-chip.sel { background:rgba(200,169,110,.1); border-color:var(--gold); color:var(--gold-lt); }

  .divider { border:none; border-top:1px solid var(--bdr-d); margin:4px 0 24px; }

  /* ANALYZE BTN */
  .analyze-btn { width:100%; background:linear-gradient(135deg,var(--gold),#b8923e); color:#07111f; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; padding:18px; border-radius:var(--r); border:none; cursor:pointer; transition:all .25s; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow:0 4px 28px rgba(200,169,110,.22); letter-spacing:.2px; }
  .analyze-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 36px rgba(200,169,110,.32); }
  .analyze-btn:disabled { opacity:.45; cursor:not-allowed; }

  .err { background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.25); border-radius:var(--rsm); padding:14px 16px; font-size:13px; color:#f87171; margin-top:16px; line-height:1.5; }

  /* LOADING */
  .load { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; gap:24px; padding:40px; position:relative; z-index:1; }
  .load-orb { width:72px; height:72px; border-radius:20px; background:linear-gradient(145deg,var(--s2),var(--s3)); border:1px solid var(--bdr); display:flex; align-items:center; justify-content:center; font-size:32px; animation:orb 1.6s ease-in-out infinite; }
  @keyframes orb { 0%,100%{box-shadow:0 0 0 0 rgba(200,169,110,.3)} 50%{box-shadow:0 0 0 22px rgba(200,169,110,0)} }
  .load-txt  { font-size:15px; color:var(--dim); text-align:center; }
  .load-mono { font-family:'DM Mono',monospace; font-size:12px; color:var(--faint); animation:blink 1.2s step-end infinite; }
  @keyframes blink { 50%{opacity:0} }

  /* RESULTS */
  .res-wrap { position:relative; z-index:1; padding:20px 20px 48px; }
  .res-hdr  { margin-bottom:20px; }
  .res-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; margin-bottom:3px; }
  .res-sub   { font-size:13px; color:var(--dim); margin-bottom:12px; }
  .anote { background:rgba(200,169,110,.05); border:1px solid var(--bdr); border-radius:var(--rsm); padding:12px 14px; font-size:12px; color:var(--dim); line-height:1.6; display:flex; gap:8px; align-items:flex-start; }

  /* ORGANISM CARD */
  .org-card { background:var(--s1); border:1px solid var(--bdr-d); border-radius:var(--r); margin-bottom:14px; overflow:hidden; animation:up .4s ease forwards; opacity:0; transform:translateY(16px); }
  .org-card:nth-child(1){animation-delay:.08s} .org-card:nth-child(2){animation-delay:.18s} .org-card:nth-child(3){animation-delay:.28s}
  @keyframes up { to{opacity:1;transform:translateY(0)} }

  .card-hdr { padding:16px; cursor:pointer; display:flex; align-items:center; gap:13px; transition:background .15s; }
  .card-hdr:hover { background:rgba(255,255,255,.02); }

  .rank-pill { width:42px; height:42px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; border:1px solid; }
  .rank-n { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; line-height:1; }
  .rank-l { font-size:8px; font-weight:600; letter-spacing:.5px; text-transform:uppercase; opacity:.65; }

  .org-info { flex:1; min-width:0; }
  .org-name { font-family:'DM Mono',monospace; font-size:13px; font-weight:500; color:var(--white); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:6px; }
  .conf-pill { display:inline-flex; align-items:center; gap:5px; border-radius:20px; padding:3px 9px; font-size:11px; font-weight:600; border:1px solid; }
  .conf-dot  { width:6px; height:6px; border-radius:50%; }
  .pbar      { height:3px; background:var(--bdr-d); border-radius:2px; overflow:hidden; margin-top:7px; }
  .pbar-fill { height:100%; border-radius:2px; transition:width 1.2s ease; }
  .pct-txt   { font-family:'Playfair Display',serif; font-size:24px; font-weight:700; flex-shrink:0; line-height:1; }
  .chev { color:var(--faint); font-size:11px; flex-shrink:0; transition:transform .3s; }
  .chev.open { transform:rotate(180deg); }

  /* EXPANDED */
  .exp-body { border-top:1px solid var(--bdr-d); padding:18px; display:flex; flex-direction:column; gap:18px; }
  .csec-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:var(--gold); margin-bottom:9px; display:flex; align-items:center; gap:6px; }

  .teach-box { background:rgba(200,169,110,.05); border:1px solid rgba(200,169,110,.18); border-radius:var(--rsm); padding:14px; font-size:13px; color:var(--dim); line-height:1.75; }
  .pearl-box { border-left:3px solid var(--gold); padding:11px 14px; background:rgba(255,255,255,.02); border-radius:0 var(--rsm) var(--rsm) 0; font-size:13px; color:var(--white); line-height:1.65; font-style:italic; }
  .gram-box  { background:var(--s2); border-radius:var(--rsm); padding:12px 14px; display:flex; gap:10px; align-items:flex-start; }
  .gram-box-txt { font-size:13px; color:var(--dim); line-height:1.6; }

  .info-box { background:var(--s2); border-radius:var(--rsm); overflow:hidden; }
  .irow { padding:11px 14px; border-bottom:1px solid var(--bdr-d); }
  .irow:last-child { border-bottom:none; }
  .ilbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--faint); margin-bottom:3px; }
  .ival { font-size:13px; color:var(--dim); line-height:1.5; }
  .ival.hi   { color:var(--white); font-weight:500; }
  .ival.warn { color:#f87171; font-size:12px; }

  .tests { display:flex; flex-direction:column; gap:7px; }
  .trow  { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--dim); line-height:1.5; }
  .tdot  { color:var(--gold); flex-shrink:0; margin-top:2px; font-size:8px; }

  .conf-reason { background:var(--s2); border-radius:var(--rsm); padding:11px 14px; font-size:12px; color:var(--faint); line-height:1.65; }

  .match-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .match-col  { background:var(--s2); border-radius:var(--rsm); padding:12px; }
  .match-col-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .match-item { font-size:11px; color:var(--faint); line-height:1.5; margin-bottom:4px; display:flex; gap:5px; }

  .new-btn { width:100%; background:transparent; border:1px solid var(--bdr); color:var(--gold); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; padding:16px; border-radius:var(--r); cursor:pointer; transition:all .25s; margin-top:6px; display:flex; align-items:center; justify-content:center; gap:8px; }
  .new-btn:hover { background:rgba(200,169,110,.07); }

  .foot { text-align:center; padding:22px 20px 10px; font-size:11px; color:var(--faint); line-height:1.8; position:relative; z-index:1; }
  .foot strong { color:var(--gold-lt); }

  /* FEEDBACK */
  .fb-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; background:transparent; border:1px solid var(--bdr); color:var(--gold); font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:13px; border-radius:var(--r); cursor:pointer; transition:all .25s; margin-top:10px; }
  .fb-btn:hover { background:rgba(200,169,110,.07); }
  .fb-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:200; display:flex; align-items:flex-end; justify-content:center; animation:fadein .2s ease; }
  @keyframes fadein { from{opacity:0} to{opacity:1} }
  .fb-sheet { background:var(--s1); border-radius:24px 24px 0 0; padding:28px 22px 40px; width:100%; max-width:460px; border-top:1px solid var(--bdr); animation:slideup .3s ease; }
  @keyframes slideup { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .fb-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; margin-bottom:4px; }
  .fb-sub { font-size:12px; color:var(--dim); margin-bottom:22px; }
  .stars { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:18px; }
  .star-btn { background:var(--s2); border:1.5px solid var(--bdr-d); border-radius:8px; padding:8px 10px; font-size:12px; font-weight:600; color:var(--dim); cursor:pointer; font-family:'DM Mono',monospace; transition:all .15s; }
  .star-btn.sel { background:rgba(200,169,110,.15); border-color:var(--gold); color:var(--gold); }
  .fb-textarea { width:100%; background:var(--s2); border:1.5px solid var(--bdr-d); border-radius:var(--rsm); padding:13px; font-family:'DM Sans',sans-serif; font-size:13px; color:var(--white); resize:none; height:100px; margin-bottom:14px; outline:none; transition:border .2s; }
  .fb-textarea:focus { border-color:var(--gold); }
  .fb-textarea::placeholder { color:var(--faint); }
  .fb-submit { width:100%; background:linear-gradient(135deg,var(--gold),#b8923e); color:#07111f; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; padding:16px; border-radius:var(--r); border:none; cursor:pointer; transition:all .25s; }
  .fb-submit:disabled { opacity:.45; cursor:not-allowed; }
  .fb-cancel { width:100%; background:transparent; border:none; color:var(--dim); font-family:'DM Sans',sans-serif; font-size:13px; padding:12px; cursor:pointer; margin-top:4px; }
  .fb-success { text-align:center; padding:20px 0; }
  .fb-success-icon { font-size:44px; margin-bottom:12px; }
  .fb-success-txt { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; margin-bottom:6px; }
  .fb-success-sub { font-size:13px; color:var(--dim); }
`;

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function MicroSage() {
  const [screen,   setScreen]   = useState("landing");
  const [results,  setResults]  = useState(null);
  const [note,     setNote]     = useState("");
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState(0);
  const [symptoms, setSymptoms] = useState([]);
  const [fbOpen,   setFbOpen]   = useState(false);
  const [fbRating, setFbRating] = useState(0);
  const [fbComment,setFbComment]= useState("");
  const [fbDone,   setFbDone]   = useState(false);
  const [fbLoading,setFbLoading]= useState(false);

  const RATINGS = [1,1.5,2,2.5,3,3.5,4,4.5,5];

  const submitFeedback = async () => {
    if (!fbRating) return;
    setFbLoading(true);
    try {
      await fetch(`${BASE_URL}/feedback`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({rating:fbRating, comment:fbComment})
      });
      setFbDone(true);
      setTimeout(() => { setFbOpen(false); setFbDone(false); setFbRating(0); setFbComment(""); }, 2500);
    } catch(e) {
      alert("Could not submit feedback. Please try again.");
    }
    setFbLoading(false);
  };

  const FeedbackModal = () => fbOpen ? (
    <div className="fb-overlay" onClick={e => { if(e.target.className==="fb-overlay") setFbOpen(false); }}>
      <div className="fb-sheet">
        {fbDone ? (
          <div className="fb-success">
            <div className="fb-success-icon">🙏</div>
            <div className="fb-success-txt">Thank you, Vighnesh will read this!</div>
            <div className="fb-success-sub">Your feedback helps MicroSage improve.</div>
          </div>
        ) : (
          <>
            <div className="fb-title">Rate MicroSage</div>
            <div className="fb-sub">Your honest feedback helps improve the tool for everyone.</div>
            <div className="stars">
              {RATINGS.map(r => (
                <button key={r} className={`star-btn ${fbRating===r?"sel":""}`} onClick={() => setFbRating(r)}>
                  {"⭐".repeat(Math.floor(r))}{r%1?"+":""} {r}
                </button>
              ))}
            </div>
            <textarea className="fb-textarea" placeholder="What did you like? What should we improve? (optional)" value={fbComment} onChange={e => setFbComment(e.target.value)} />
            <button className="fb-submit" onClick={submitFeedback} disabled={!fbRating || fbLoading}>
              {fbLoading ? "Submitting..." : "Submit Feedback"}
            </button>
            <button className="fb-cancel" onClick={() => setFbOpen(false)}>Cancel</button>
          </>
        )}
      </div>
    </div>
  ) : null;

  const [gram,     setGram]     = useState("");
  const [shape,    setShape]    = useState("");
  const [site,     setSite]     = useState("");
  const [age,      setAge]      = useState("");
  const [immuno,   setImmuno]   = useState(false);
  const [selSymp,  setSelSymp]  = useState([]);

  useEffect(() => {
    if (!site) { setSymptoms([]); setSelSymp([]); return; }
    setSymptoms(FALLBACK_SYMPTOMS[site] || []);
    setSelSymp([]);
    fetchSymptoms(site).then(s => { if (s.length) setSymptoms(s); });
  }, [site]);

  const toggleSymp = s => setSelSymp(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  const canAnalyze = !!(gram || shape || site || age || selSymp.length);

  const handleAnalyze = async () => {
    setError(""); setScreen("loading");
    try {
      const data = await analyzeCase({
        gram: gram||null, shape: shape||null,
        site: site||null, age_group: age||null,
        immunocompromised: immuno, symptoms: selSymp,
        arrangement:null, oxygen:null, spore:null,
        capsule:null, hemolysis:null, motility:null,
      });
      setResults(data.results); setNote(data.analysis_note);
      setExpanded(0); setScreen("results");
    } catch(e) {
      setError(e.message || "Something went wrong. Please try again.");
      setScreen("form");
    }
  };

  const reset = () => {
    setGram(""); setShape(""); setSite(""); setAge("");
    setImmuno(false); setSelSymp([]); setSymptoms([]);
    setResults(null); setError(""); setScreen("form");
  };

  return (
    <>
      <style>{S}</style>
      <div className="glow" />
      <FeedbackModal />
      <div className="wrap">

        {/* ── LANDING ── */}
        {screen === "landing" && (
          <div className="land">
            <div className="hero">
              <div className="logomark">🔬</div>
              <div className="brand">Micro<em>Sage</em></div>
              <div className="tagline">Think Like a Microbiologist</div>
              <p className="hero-desc">
                Clinical decision support for medical students and healthcare professionals.
                Enter what you observe — MicroSage explains the reasoning.
              </p>
              <button className="start-btn" onClick={() => setScreen("form")}>
                Start Analysis <span className="arr">→</span>
              </button>
            </div>

            <div className="stats">
              <div className="stat"><div className="stat-n">30</div><div className="stat-l">Organisms</div></div>
              <div className="stat"><div className="stat-n">6</div><div className="stat-l">Sites</div></div>
              <div className="stat"><div className="stat-n">Free</div><div className="stat-l">Always</div></div>
            </div>

            <div className="feats">
              {[
                ["🧠","Teach Me Mode","Not just what — but why. Every result explained clearly."],
                ["💊","Antibiotic Guidance","First line, second line and resistance warnings per organism."],
                ["🎯","Confidence Indicator","Know how strongly your findings support each result."],
                ["👶","Age Sensitivity","Neonatal, pediatric, adult and elderly patterns respected."],
              ].map(([ic,title,desc]) => (
                <div key={title} className="feat">
                  <div className="feat-ic">{ic}</div>
                  <div><h4>{title}</h4><p>{desc}</p></div>
                </div>
              ))}
            </div>

            <div className="land-foot">
              For educational &amp; decision-support purposes only.<br />
              Laboratory confirmation is always required.<br />
              Built by <strong>Vighnesh.S.Samal</strong> · Jawetz · Murray · CLSI · EUCAST
            </div>
            <button className="fb-btn" onClick={() => setFbOpen(true)}>💬 Give Feedback</button>
          </div>
        )}

        {/* ── FORM ── */}
        {screen === "form" && (
          <>
            <div className="hdr">
              <div className="hdr-brand">
                <div className="hdr-mark">🔬</div>
                <div className="hdr-name">Micro<em>Sage</em></div>
              </div>
              <button className="hdr-btn" onClick={() => setScreen("landing")}>← Home</button>
            </div>

            <div className="form-wrap">
              <div className="form-intro">
                <div className="form-title">Case Details</div>
                <div className="form-sub">Fill in what you know. Every field is optional — more detail gives better results.</div>
              </div>

              {/* GRAM */}
              <div className="qblock">
                <div className="qlabel">Gram Reaction</div>
                <p className="qdesc">What colour did the organism appear under gram stain?</p>
                <div className="gram-grid">
                  {GRAM_OPTIONS.map(o => (
                    <div key={o.value}
                      className={`gram-card ${gram===o.value?"sel":""}`}
                      onClick={() => setGram(gram===o.value?"":o.value)}>
                      <div className="gram-card-lbl">{o.label}</div>
                      <div className="gram-card-dsc">{o.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHAPE */}
              <div className="qblock">
                <div className="qlabel">Shape</div>
                <p className="qdesc">What was the shape of the organism?</p>
                <div className="shape-row">
                  {SHAPE_OPTIONS.map(o => (
                    <button key={o.value}
                      className={`shape-btn ${shape===o.value?"sel":""}`}
                      onClick={() => setShape(shape===o.value?"":o.value)}>
                      <span className="shape-ic">{o.icon}</span>
                      <span className="shape-lbl">{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="divider" />

              {/* SITE */}
              <div className="qblock">
                <div className="qlabel">Site of Infection</div>
                <p className="qdesc">Where is the infection located?</p>
                <div className="site-grid">
                  {SITE_OPTIONS.map(o => (
                    <button key={o.value}
                      className={`site-btn ${site===o.value?"sel":""}`}
                      onClick={() => setSite(site===o.value?"":o.value)}>
                      <span className="site-em">{o.icon}</span>
                      <span className="site-lbl">{o.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AGE */}
              <div className="qblock">
                <div className="qlabel">Patient Age Group</div>
                <div className="age-row">
                  {AGE_OPTIONS.map(o => (
                    <button key={o.value}
                      className={`age-btn ${age===o.value?"sel":""}`}
                      onClick={() => setAge(age===o.value?"":o.value)}>
                      <span className="age-lbl">{o.label}</span>
                      <span className="age-sub">{o.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* IMMUNOCOMPROMISED */}
              <div className="qblock">
                <div className="qlabel">
                  Immunocompromised?
                  <span className="qhint">HIV, chemo, transplant etc.</span>
                </div>
                <div className="immuno-row">
                  <button className={`immuno-btn ${immuno?"sel":""}`}   onClick={() => setImmuno(true)}>Yes</button>
                  <button className={`immuno-btn ${!immuno?"sel":""}`}  onClick={() => setImmuno(false)}>No</button>
                </div>
              </div>

              <hr className="divider" />

              {/* SYMPTOMS */}
              <div className="qblock">
                <div className="qlabel">Symptoms Present</div>
                {!site
                  ? <div className="symp-hint">Select a site of infection above to see relevant symptoms</div>
                  : <div className="symp-grid">
                      {symptoms.map(s => (
                        <button key={s}
                          className={`symp-chip ${selSymp.includes(s)?"sel":""}`}
                          onClick={() => toggleSymp(s)}>{s}</button>
                      ))}
                    </div>
                }
              </div>

              {error && <div className="err">⚠️ {error}</div>}

              <button className="analyze-btn" onClick={handleAnalyze} disabled={!canAnalyze}>
                🔬 Analyze Case
              </button>
            </div>
          </>
        )}

        {/* ── LOADING ── */}
        {screen === "loading" && (
          <div className="load">
            <div className="load-orb">🔬</div>
            <div>
              <div className="load-txt">Analyzing clinical inputs...</div>
              <div className="load-mono">scoring 30 organisms_</div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && results && (
          <>
            <div className="hdr">
              <div className="hdr-brand">
                <div className="hdr-mark">🔬</div>
                <div className="hdr-name">Micro<em>Sage</em></div>
              </div>
              <button className="hdr-btn" onClick={() => setScreen("form")}>← Edit</button>
            </div>

            <div className="res-wrap">
              <div className="res-hdr">
                <div className="res-title">Analysis Results</div>
                <div className="res-sub">Top 3 most likely organisms</div>
                {note && <div className="anote"><span>ℹ️</span><span>{note}</span></div>}
              </div>

              {results.map((org, i) => {
                const rc   = RANK_COLORS[i];
                const cc   = CONFIDENCE_CONFIG[org.confidence] || CONFIDENCE_CONFIG.Low;
                const open = expanded === i;
                return (
                  <div key={org.name} className="org-card">
                    <div className="card-hdr" onClick={() => setExpanded(open ? -1 : i)}>
                      <div className="rank-pill" style={{background:`${rc}18`,borderColor:`${rc}40`,color:rc}}>
                        <span className="rank-n">{i+1}</span>
                        <span className="rank-l">{["1st","2nd","3rd"][i]}</span>
                      </div>
                      <div className="org-info">
                        <div className="org-name">{org.name}</div>
                        <div className="conf-pill" style={{background:cc.bg,borderColor:cc.border,color:cc.text}}>
                          <div className="conf-dot" style={{background:cc.dot}} />
                          {org.confidence} Confidence
                        </div>
                        <div className="pbar">
                          <div className="pbar-fill" style={{width:`${org.percentage}%`,background:rc}} />
                        </div>
                      </div>
                      <div className="pct-txt" style={{color:rc}}>{org.percentage}%</div>
                      <div className={`chev ${open?"open":""}`}>▼</div>
                    </div>

                    {open && (
                      <div className="exp-body">

                        <div>
                          <div className="csec-title">🧠 Teach Me</div>
                          <div className="teach-box">{org.teach_me}</div>
                        </div>

                        <div>
                          <div className="csec-title">💡 Clinical Pearl</div>
                          <div className="pearl-box">{org.clinical_pearl}</div>
                        </div>

                        <div>
                          <div className="csec-title">🔭 Gram Appearance</div>
                          <div className="gram-box">
                            <span style={{fontSize:20}}>🔬</span>
                            <div className="gram-box-txt">{org.gram_appearance}</div>
                          </div>
                        </div>

                        <div>
                          <div className="csec-title">🧫 Culture Media</div>
                          <div className="info-box">
                            <div className="irow">
                              <div className="ilbl">Primary</div>
                              <div className="ival hi">{org.culture_media.primary}</div>
                            </div>
                            <div className="irow">
                              <div className="ilbl">Secondary</div>
                              <div className="ival">{org.culture_media.secondary}</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="csec-title">🧪 Confirmatory Tests</div>
                          <div className="tests">
                            {org.confirmatory_tests.map((t,j) => (
                              <div key={j} className="trow">
                                <span className="tdot">◆</span><span>{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="csec-title">💊 Antibiotic Guidance</div>
                          <div className="info-box">
                            <div className="irow">
                              <div className="ilbl">First Line</div>
                              <div className="ival hi">{org.antibiotics.first_line}</div>
                            </div>
                            <div className="irow">
                              <div className="ilbl">Second Line</div>
                              <div className="ival">{org.antibiotics.second_line}</div>
                            </div>
                            <div className="irow" style={{background:"rgba(248,113,113,0.05)"}}>
                              <div className="ilbl" style={{color:"#f87171"}}>⚠️ Resistance Warning</div>
                              <div className="ival warn">{org.antibiotics.resistance_warning}</div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="csec-title">📊 Confidence Reasoning</div>
                          <div className="conf-reason">{org.confidence_reason}</div>
                        </div>

                        {(org.matched_inputs?.length > 0 || org.mismatched_inputs?.length > 0) && (
                          <div>
                            <div className="csec-title">🎯 Input Matching</div>
                            <div className="match-grid">
                              <div className="match-col">
                                <div className="match-col-title" style={{color:"#4ade80"}}>✓ Supporting</div>
                                {(org.matched_inputs||[]).slice(0,6).map((m,j) => (
                                  <div key={j} className="match-item">
                                    <span style={{color:"#4ade80",flexShrink:0}}>•</span><span>{m}</span>
                                  </div>
                                ))}
                                {!org.matched_inputs?.length && <div className="match-item">None</div>}
                              </div>
                              <div className="match-col">
                                <div className="match-col-title" style={{color:"#f87171"}}>✗ Contradicting</div>
                                {(org.mismatched_inputs||[]).slice(0,4).map((m,j) => (
                                  <div key={j} className="match-item">
                                    <span style={{color:"#f87171",flexShrink:0}}>•</span><span>{m}</span>
                                  </div>
                                ))}
                                {!org.mismatched_inputs?.length &&
                                  <div className="match-item" style={{color:"#4ade80"}}>None — full match</div>}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}

              <button className="new-btn" onClick={reset}>🔬 New Analysis</button>
              <button className="fb-btn" onClick={() => setFbOpen(true)}>💬 Give Feedback</button>

              <div className="foot">
                For educational &amp; decision-support purposes only.<br />
                Laboratory confirmation is always required.<br />
                Built by <strong>Vighnesh.S.Samal</strong> · Jawetz · Murray · CLSI · EUCAST
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
