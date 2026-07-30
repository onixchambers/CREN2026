import { COUNTRY_CODES } from "@/lib/countryCodes";

export function getPhonePlaceholder(timezone?: string): string {
  const tz = (timezone || "").toLowerCase();

  if (tz.includes("panama")) {
    return "Ej. 6123-4567";
  }
  if (tz.includes("mexico") || tz.includes("monterrey") || tz.includes("cancun") || tz.includes("tijuana") || tz.includes("merida") || tz.includes("hermosillo") || tz.includes("chihuahua")) {
    return "Ej. 55 1234 5678";
  }
  if (tz.includes("costa_rica")) {
    return "Ej. 8123-4567";
  }
  if (tz.includes("bogota") || tz.includes("colombia")) {
    return "Ej. 300 123 4567";
  }
  if (tz.includes("guatemala")) {
    return "Ej. 5123 4567";
  }
  if (tz.includes("lima") || tz.includes("peru")) {
    return "Ej. 912 345 678";
  }
  if (tz.includes("santiago") || tz.includes("chile")) {
    return "Ej. 9 1234 5678";
  }
  if (tz.includes("buenos_aires") || tz.includes("argentina")) {
    return "Ej. 11 1234-5678";
  }
  if (tz.includes("caracas") || tz.includes("venezuela")) {
    return "Ej. 412 123 4567";
  }
  if (tz.includes("madrid") || tz.includes("spain")) {
    return "Ej. 612 34 56 78";
  }
  if (tz.includes("santo_domingo")) {
    return "Ej. 809 123 4567";
  }

  // Default fallback matching current system default (Panamá / Central America)
  return "Ej. 6123-4567";
}

export function getDefaultCountryCode(timezone?: string): string {
  const tz = (timezone || "").toLowerCase();
  if (tz.includes("panama")) return "+507";
  if (tz.includes("mexico") || tz.includes("monterrey") || tz.includes("cancun") || tz.includes("tijuana") || tz.includes("merida") || tz.includes("hermosillo") || tz.includes("chihuahua")) return "+52";
  if (tz.includes("costa_rica")) return "+506";
  if (tz.includes("bogota") || tz.includes("colombia")) return "+57";
  if (tz.includes("guatemala")) return "+502";
  if (tz.includes("lima") || tz.includes("peru")) return "+51";
  if (tz.includes("santiago") || tz.includes("chile")) return "+56";
  if (tz.includes("buenos_aires") || tz.includes("argentina")) return "+54";
  if (tz.includes("caracas") || tz.includes("venezuela")) return "+58";
  if (tz.includes("madrid") || tz.includes("spain")) return "+34";
  return "+507";
}

export function parsePhone(phone: string | null | undefined, timezone?: string) {
  const defaultCode = getDefaultCountryCode(timezone);
  if (!phone) return { code: defaultCode, number: "" };

  const trimmed = phone.trim();
  const match = COUNTRY_CODES.find(c => trimmed.startsWith(c.code));
  if (match) {
    const number = trimmed.slice(match.code.length).trim();
    return { code: match.code, number };
  }

  if (trimmed.startsWith("+")) {
    const parts = trimmed.split(" ");
    return { code: parts[0], number: parts.slice(1).join(" ") };
  }

  return { code: defaultCode, number: trimmed };
}
