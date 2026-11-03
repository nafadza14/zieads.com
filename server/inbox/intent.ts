/*
  Comment intent and priority (spec 7.7).
  Rule based so it is instant, free and explainable. English and Bahasa Indonesia.
  Priority: buying signal (1) > negative or complaint (2) > question (3) > positive (4) > spam (5).
*/

export type Intent = "buying_signal" | "complaint" | "question" | "praise" | "spam" | "other";

const BUY = [
  // price
  /\b(price|pricing|how much|cost|harga|berapa|brp|hrg|pricelist|price ?list|diskon|discount|promo|voucher|cod)\b/i,
  // stock and availability
  /\b(stock|in stock|available|ready|restock|ready stock|stok|tersedia|masih ada|ada ga|ada gak|ada nggak|sold out|habis)\b/i,
  // shipping
  /\b(ship|shipping|deliver|delivery|ongkir|kirim|pengiriman|dikirim|ekspedisi|resi)\b/i,
  // buying and wholesale
  /\b(buy|order|purchase|checkout|wholesale|reseller|bulk|grosir|agen|dropship|beli|pesan|mau order|cara order|link beli)\b/i,
  // asking for a DM
  /\b(dm|inbox|wa|whatsapp|chat admin|nomor admin)\b.*\?|\b(dm me|cek dm|check dm)\b/i,
];
const COMPLAINT = [
  /\b(refund|return|broken|damaged|rusak|kecewa|disappointed|scam|penipu|tipu|complain|komplain|belum (sampai|datang|dikirim|dibalas)|still waiting|not arrived|never arrived|worst|parah|jelek|bad service|lambat|slow response)\b/i,
];
const PRAISE = [/\b(love|great|amazing|awesome|best|keren|mantap|mantul|bagus|suka|enak|top|recommended|rekomen|thank|thanks|makasih|terima kasih)\b/i, /(❤|😍|🔥|👍)/];
const SPAM = [/(follow ?back|f4f|check my (page|profile)|cek (ig|akun) (ku|aku)|promote your|dm for promo|earn \$|crypto|forex|slot gacor|judi|togel)/i, /https?:\/\/\S+/i];

export interface IntentResult {
  intent: Intent;
  priority: number;
  reason: string;
}

export function classifyIntent(text: string, sentiment?: string | null): IntentResult {
  const t = (text || "").trim();
  if (!t) return { intent: "other", priority: 4, reason: "Empty comment" };
  const spammy = SPAM[0].test(t) || (SPAM[1].test(t) && t.length < 60 && !BUY.some((r) => r.test(t)));
  if (spammy) return { intent: "spam", priority: 5, reason: "Looks like self promotion or a link drop" };
  if (BUY.some((r) => r.test(t))) return { intent: "buying_signal", priority: 1, reason: "Asks about price, stock, shipping or ordering" };
  if (COMPLAINT.some((r) => r.test(t)) || sentiment === "negative") return { intent: "complaint", priority: 2, reason: "Negative or a complaint" };
  if (/\?|\b(how|what|when|where|why|can i|is it|bagaimana|gimana|kapan|dimana|di mana|kenapa|apakah|bisa)\b/i.test(t)) return { intent: "question", priority: 3, reason: "A question" };
  if (PRAISE.some((r) => r.test(t)) || sentiment === "positive") return { intent: "praise", priority: 4, reason: "Positive feedback" };
  return { intent: "other", priority: 4, reason: "General comment" };
}
