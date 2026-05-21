const alphabet = {
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*_-+=?"
};

function pick(chars: string) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return chars[values[0] % chars.length];
}

export function securePassword(options: {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}) {
  const groups = [
    options.lowercase ? alphabet.lowercase : "",
    options.uppercase ? alphabet.uppercase : "",
    options.numbers ? alphabet.numbers : "",
    options.symbols ? alphabet.symbols : ""
  ].filter(Boolean);

  const pool = groups.join("");
  if (!pool) {
    return "";
  }

  const required = groups.map(pick);
  const remaining = Array.from({ length: Math.max(0, options.length - required.length) }, () =>
    pick(pool)
  );
  const combined = [...required, ...remaining];

  for (let i = combined.length - 1; i > 0; i -= 1) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = random[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.slice(0, options.length).join("");
}

export function uuid() {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  browserCrypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
