/* Plan limits: -1 means unlimited, and the test accounts send 999999. Neither is shown as a number. */
export const isUnlimited = (n: number | null | undefined) => n === -1 || (typeof n === 'number' && n >= 99999);
export const fmtLimit = (n: number | null | undefined) => (isUnlimited(n) ? 'Unlimited' : (n ?? 0).toLocaleString());
