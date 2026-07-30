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
