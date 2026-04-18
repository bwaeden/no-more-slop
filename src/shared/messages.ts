type Variant = (label: string, intent: string) => string;

const VARIANTS: Variant[] = [
  (label, intent) =>
    intent ? `${label} blocked. Back to ${intent}.` : `${label} blocked. Stay focused.`,
  (label, intent) =>
    intent ? `Not now — ${intent} needs you.` : `Not now — ${label} is off.`,
  (label, intent) =>
    intent
      ? `You said you'd ${intent}. Close call on ${label}.`
      : `Close call — ${label} blocked.`,
  (label, intent) =>
    intent ? `${label} → ${intent}. Noted.` : `${label} off limits today.`,
  (label, intent) =>
    intent ? `Hey — weren't you doing ${intent}?` : `Hey — ${label} is blocked.`,
  (label, intent) =>
    intent ? `Nope. You're here to ${intent}.` : `Nope. ${label} is out.`,
  (label, intent) =>
    intent ? `Back to work. ${intent}.` : `Back to work — no ${label}.`,
  (label, intent) =>
    intent
      ? `${label} tried. ${intent} is the job.`
      : `${label} tried. Not today.`,
];

export function pickBlockMessage(label: string, intent: string): string {
  const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  return variant(label, intent.trim());
}
