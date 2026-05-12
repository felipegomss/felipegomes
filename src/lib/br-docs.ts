function randomDigits(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10));
}

function calcCheckDigit(digits: number[], weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += digits[i] * weights[i];
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function generateCpf(): string {
  const base = randomDigits(9);
  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcCheckDigit(base, w1);
  const d2 = calcCheckDigit([...base, d1], w2);
  const all = [...base, d1, d2].join("");
  return `${all.slice(0, 3)}.${all.slice(3, 6)}.${all.slice(6, 9)}-${all.slice(9)}`;
}

export function generateCnpj(): string {
  const base = [...randomDigits(8), 0, 0, 0, 1];
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcCheckDigit(base, w1);
  const d2 = calcCheckDigit([...base, d1], w2);
  const all = [...base, d1, d2].join("");
  return `${all.slice(0, 2)}.${all.slice(2, 5)}.${all.slice(5, 8)}/${all.slice(8, 12)}-${all.slice(12)}`;
}

export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").padStart(8, "0").slice(0, 8);
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatPhoneBr(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return raw;
}
