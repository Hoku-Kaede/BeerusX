/* CSV parsing + recurring detection — runs 100% in-browser, no data leaves device */

export type Tx = { id: string; date: Date; merchantRaw: string; merchant: string; amount: number; category: string };
export type Sub = {
  id: string;
  merchant: string;
  category: string;
  amount: number; // last amount
  medianAmount: number;
  frequency: "weekly" | "monthly" | "yearly" | "unknown";
  intervalDays: number;
  charges: number;
  lastDate: Date;
  nextDate: Date;
  monthly: number;
  yearly: number;
  hikePct: number;
  forgotten: boolean;
  forgottenReason?: string;
  status: "unknown" | "keep" | "cancel";
  reminder?: string; // ISO date
};

export function normalizeMerchant(raw: string): string {
  let s = raw.toUpperCase().trim();
  s = s.replace(/PAYMENT|PURCHASE|RECURRING|DEBIT|CREDIT|SUBSCRIPTION/gi, " ");
  s = s.replace(/[#*]/g, " ");
  s = s.replace(/\b\d{2,}\b/g, " ");
  s = s.replace(/\b[A-Z0-9]{6,}\b/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  // collapse trailing descriptors
  s = s.replace(/\s+(COM|INC|LTD|LLC|CORP|CO)\s*$/g, "");
  return s || raw.toUpperCase().trim();
}

export function categorize(merchant: string): string {
  const m = merchant.toLowerCase();
  if (/netflix|spotify|hulu|disney|prime|hbo|youtube|apple|peloton|patreon|twitch/.test(m)) return "Entertainment";
  if (/gym|fitness|myfitnesspal|strava|headspace/.test(m)) return "Health";
  if (/google|icloud|dropbox|notion|slack|zoom|adobe|figma|github|heroku/.test(m)) return "Productivity";
  if (/amazon|walmart|target/.test(m)) return "Shopping";
  if (/shell|exxon|bp|uber|lyft/.test(m)) return "Transport";
  if (/bank|chase|amex|visa|insurance/.test(m)) return "Finance";
  return "Other";
}

function parseAmount(v: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[$,]/g, "").trim());
  return isNaN(n) ? 0 : n;
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  // ISO, MM/DD/YYYY, DD-MM-YYYY
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  const parts = s.split(/[\/.-]/).map(Number);
  if (parts.length === 3) {
    // assume MM/DD/YYYY or DD/MM/YYYY — try both, pick valid
    const [a, b, c] = parts;
    const y = c < 100 ? 2000 + c : c;
    d = new Date(y, a - 1, b);
    if (!isNaN(d.getTime())) return d;
    d = new Date(y, b - 1, a);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** Split CSV respecting quotes */
export function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function parseCSV(text: string): Tx[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error("CSV needs a header row plus at least one transaction.");
  const header = splitRow(lines[0]).map(h => h.toLowerCase());
  const find = (...names: string[]) => {
    for (const n of names) {
      const i = header.findIndex(h => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const di = find("date"), mi = find("description", "merchant", "payee", "name", "memo"), ai = find("amount", "value", "debit", "charge");
  if (di < 0 || mi < 0 || ai < 0) throw new Error("Could not find date / description / amount columns. Expected headers like: date, description, amount");

  const txs: Tx[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    const d = parseDate(cols[di]);
    const desc = cols[mi];
    const amt = parseAmount(cols[ai]);
    if (!d || !desc || !amt) continue;
    // only keep charges (negative debit or positive charge depending on bank) — keep magnitude, filter $0
    const abs = Math.abs(amt);
    if (abs < 0.01) continue;
    const merchant = normalizeMerchant(desc);
    txs.push({ id: `${i}-${d.toISOString()}`, date: d, merchantRaw: desc, merchant, amount: abs, category: categorize(merchant) });
  }
  return txs.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function detectRecurring(txs: Tx[]): Sub[] {
  const byMerchant = new Map<string, Tx[]>();
  for (const t of txs) {
    const k = t.merchant;
    if (!byMerchant.has(k)) byMerchant.set(k, []);
    byMerchant.get(k)!.push(t);
  }

  const subs: Sub[] = [];
  for (const [merchant, list] of byMerchant.entries()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.date.getTime() - b.date.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(Math.round((sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / 86400000));
    }
    const medI = median(intervals);
    if (medI < 5 || medI > 400) continue;
    // regularity: at least 60% of intervals within ±20% of median (or ±7 days for monthly)
    const ok = intervals.filter(i => Math.abs(i - medI) <= Math.max(7, medI * 0.2)).length;
    if (intervals.length >= 2 && ok / intervals.length < 0.6) continue;

    let frequency: Sub["frequency"] = "unknown";
    if (medI >= 5 && medI <= 10) frequency = "weekly";
    else if (medI >= 25 && medI <= 40) frequency = "monthly";
    else if (medI >= 330 && medI <= 400) frequency = "yearly";
    else continue; // not recognizable recurring

    const amounts = sorted.map(t => t.amount).sort((a, b) => a - b);
    const medA = median(amounts);
    const last = sorted[sorted.length - 1];
    const hikePct = ((last.amount - medA) / Math.max(0.01, medA)) * 100;
    const monthly = frequency === "weekly" ? medA * 4.33 : frequency === "monthly" ? medA : medA / 12;
    const yearly = monthly * 12;

    const nextDate = new Date(last.date.getTime() + medI * 86400000);
    let forgotten = false, forgottenReason: string | undefined;
    if (hikePct > 20) { forgotten = true; forgottenReason = `Price hiked ${hikePct.toFixed(0)}% (now $${last.amount})`; }
    else if (frequency === "monthly" && list.length <= 3 && new Date().getTime() - last.date.getTime() > 60 * 86400000) { forgotten = true; forgottenReason = "Charged only a few times — check if still used"; }
    else if (last.amount > medA * 1.5) { forgotten = true; forgottenReason = "Amount jumped vs usual"; }

    subs.push({
      id: merchant.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      merchant: prettyName(merchant),
      category: last.category,
      amount: last.amount,
      medianAmount: medA,
      frequency,
      intervalDays: medI,
      charges: list.length,
      lastDate: last.date,
      nextDate,
      monthly, yearly,
      hikePct, forgotten, forgottenReason,
      status: "unknown",
    });
  }
  return subs.sort((a, b) => b.monthly - a.monthly);
}

export function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function prettyName(m: string) {
  return m.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/, " ");
}

export function cancelGuideUrl(merchant: string): string {
  const m = merchant.toLowerCase();
  const map: [RegExp, string][] = [
    [/netflix/, "https://help.netflix.com/en/node/953"],
    [/spotify/, "https://support.spotify.com/us/article/cancel-any-plan/"],
    [/hulu/, "https://help.hulu.com/s/article/how-to-cancel"],
    [/disney/, "https://help.disneyplus.com/"],
    [/prime|amazon/, "https://www.amazon.com/gp/css/homepage.html"],
    [/icloud|apple/, "https://support.apple.com/en-us/HT202039"],
    [/google|youtube/, "https://pay.google.com/"],
    [/dropbox/, "https://help.dropbox.com/"],
    [/notion/, "https://www.notion.so/help/billing"],
    [/slack/, "https://slack.com/help/articles/360002038823"],
    [/zoom/, "https://support.zoom.com/"],
    [/adobe/, "https://helpx.adobe.com/"],
    [/figma/, "https://help.figma.com/"],
    [/patreon/, "https://patreon.com/about/billing"],
    [/twitch/, "https://help.twitch.tv/"],
    [/peloton/, "https://support.onepeloton.com/"],
  ];
  for (const [re, url] of map) if (re.test(m)) return url;
  return `https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(merchant)}+subscription`;
}

/* ---------- Sample data ---------- */
export const SAMPLE_CSV = [
  "date,description,amount",
  "2025-01-05,Netflix,15.99",
  "2025-02-05,Netflix,15.99",
  "2025-03-05,Netflix,17.99",
  "2025-04-05,Netflix,17.99",
  "2025-05-05,Netflix,17.99",
  "2025-06-05,Netflix,17.99",
  "2025-01-10,Spotify,11.99",
  "2025-02-10,Spotify,11.99",
  "2025-03-10,Spotify,11.99",
  "2025-04-10,Spotify,11.99",
  "2025-05-10,Spotify,11.99",
  "2025-06-10,Spotify,11.99",
  "2025-01-12,Amazon Prime,14.99",
  "2025-04-12,Amazon Prime,14.99",
  "2024-12-01,Apple iCloud,9.99",
  "2025-01-01,Apple iCloud,9.99",
  "2025-02-01,Apple iCloud,9.99",
  "2025-03-01,Apple iCloud,9.99",
  "2025-04-01,Apple iCloud,9.99",
  "2025-05-01,Apple iCloud,9.99",
  "2025-06-01,Apple iCloud,9.99",
  "2025-01-15,Gym — Planet Fitness,29.99",
  "2025-02-15,Gym — Planet Fitness,29.99",
  "2025-03-15,Gym — Planet Fitness,29.99",
  "2025-04-15,Gym — Planet Fitness,29.99",
  "2025-05-15,Gym — Planet Fitness,29.99",
  "2024-11-20,Notion,48.00",
  "2025-11-20,Notion,48.00",
  "2025-01-03,Walmart Grocery,64.20",
  "2025-01-18,Uber Trip,18.40",
  "2025-02-03,Walmart Grocery,52.10",
  "2025-02-19,Uber Trip,22.90",
  "2025-03-03,Walmart Grocery,71.80",
  "2025-03-22,Uber Trip,15.20",
  "2025-04-03,Walmart Grocery,48.90",
  "2025-04-25,Uber Trip,19.60",
  "2025-05-03,Walmart Grocery,59.30",
  "2025-05-30,Uber Trip,24.10",
  "2025-01-07,Hulu,17.99",
  "2025-02-07,Hulu,17.99",
  "2025-03-07,Hulu,17.99",
  "2025-06-01,Dropbox,11.99",
  "2025-05-01,Dropbox,11.99",
  "2025-04-01,Dropbox,11.99",
].join("\n");
