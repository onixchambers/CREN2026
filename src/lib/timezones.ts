export interface TimezoneItem {
  tz: string;
  name: string;
  country: string;
  iso: string;
  flag: string;
  utcOffset: string;
}

export const TIMEZONES: TimezoneItem[] = [
  // México
  { tz: "America/Mexico_City", name: "México - Ciudad de México / Centro", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-6" },
  { tz: "America/Cancun", name: "México - Cancún / Quintana Roo", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-5" },
  { tz: "America/Tijuana", name: "México - Tijuana / Baja California", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-8" },
  { tz: "America/Monterrey", name: "México - Monterrey / Nuevo León", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-6" },
  { tz: "America/Hermosillo", name: "México - Hermosillo / Sonora", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-7" },
  { tz: "America/Mazatlan", name: "México - Mazatlán / Sinaloa", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-7" },
  { tz: "America/Merida", name: "México - Mérida / Yucatán", country: "México", iso: "MX", flag: "🇲🇽", utcOffset: "UTC-6" },

  // América Latina y Caribe
  { tz: "America/Guatemala", name: "Guatemala - Ciudad de Guatemala", country: "Guatemala", iso: "GT", flag: "🇬🇹", utcOffset: "UTC-6" },
  { tz: "America/El_Salvador", name: "El Salvador - San Salvador", country: "El Salvador", iso: "SV", flag: "🇸🇻", utcOffset: "UTC-6" },
  { tz: "America/Tegucigalpa", name: "Honduras - Tegucigalpa", country: "Honduras", iso: "HN", flag: "🇭🇳", utcOffset: "UTC-6" },
  { tz: "America/Managua", name: "Nicaragua - Managua", country: "Nicaragua", iso: "NI", flag: "🇳🇮", utcOffset: "UTC-6" },
  { tz: "America/Costa_Rica", name: "Costa Rica - San José", country: "Costa Rica", iso: "CR", flag: "🇨🇷", utcOffset: "UTC-6" },
  { tz: "America/Panama", name: "Panamá - Ciudad de Panamá", country: "Panamá", iso: "PA", flag: "🇵🇦", utcOffset: "UTC-5" },
  { tz: "America/Bogota", name: "Colombia - Bogotá", country: "Colombia", iso: "CO", flag: "🇨🇴", utcOffset: "UTC-5" },
  { tz: "America/Lima", name: "Perú - Lima", country: "Perú", iso: "PE", flag: "🇵🇪", utcOffset: "UTC-5" },
  { tz: "America/Guayaquil", name: "Ecuador - Quito / Guayaquil", country: "Ecuador", iso: "EC", flag: "🇪🇨", utcOffset: "UTC-5" },
  { tz: "America/Caracas", name: "Venezuela - Caracas", country: "Venezuela", iso: "VE", flag: "🇻🇪", utcOffset: "UTC-4" },
  { tz: "America/La_Paz", name: "Bolivia - La Paz", country: "Bolivia", iso: "BO", flag: "🇧🇴", utcOffset: "UTC-4" },
  { tz: "America/Santiago", name: "Chile - Santiago", country: "Chile", iso: "CL", flag: "🇨🇱", utcOffset: "UTC-4" },
  { tz: "America/Argentina/Buenos_Aires", name: "Argentina - Buenos Aires", country: "Argentina", iso: "AR", flag: "🇦🇷", utcOffset: "UTC-3" },
  { tz: "America/Montevideo", name: "Uruguay - Montevideo", country: "Uruguay", iso: "UY", flag: "🇺🇾", utcOffset: "UTC-3" },
  { tz: "America/Asuncion", name: "Paraguay - Asunción", country: "Paraguay", iso: "PY", flag: "🇵🇾", utcOffset: "UTC-4" },
  { tz: "America/Sao_Paulo", name: "Brasil - São Paulo / Rio", country: "Brasil", iso: "BR", flag: "🇧🇷", utcOffset: "UTC-3" },
  { tz: "America/Santo_Domingo", name: "República Dominicana - Santo Domingo", country: "Rep. Dominicana", iso: "DO", flag: "🇩🇴", utcOffset: "UTC-4" },
  { tz: "America/Puerto_Rico", name: "Puerto Rico - San Juan", country: "Puerto Rico", iso: "PR", flag: "🇵🇷", utcOffset: "UTC-4" },
  { tz: "America/Havana", name: "Cuba - La Habana", country: "Cuba", iso: "CU", flag: "🇨🇺", utcOffset: "UTC-5" },
  { tz: "America/Port_of_Spain", name: "Trinidad y Tobago - Puerto España", country: "Trinidad y Tobago", iso: "TT", flag: "🇹🇹", utcOffset: "UTC-4" },
  { tz: "America/Jamaica", name: "Jamaica - Kingston", country: "Jamaica", iso: "JM", flag: "🇯🇲", utcOffset: "UTC-5" },

  // Norteamérica
  { tz: "America/New_York", name: "Estados Unidos - Nueva York / Este", country: "Estados Unidos", iso: "US", flag: "🇺🇸", utcOffset: "UTC-5" },
  { tz: "America/Chicago", name: "Estados Unidos - Chicago / Centro", country: "Estados Unidos", iso: "US", flag: "🇺🇸", utcOffset: "UTC-6" },
  { tz: "America/Denver", name: "Estados Unidos - Denver / Montaña", country: "Estados Unidos", iso: "US", flag: "🇺🇸", utcOffset: "UTC-7" },
  { tz: "America/Los_Angeles", name: "Estados Unidos - Los Ángeles / Pacífico", country: "Estados Unidos", iso: "US", flag: "🇺🇸", utcOffset: "UTC-8" },
  { tz: "America/Phoenix", name: "Estados Unidos - Phoenix / Arizona", country: "Estados Unidos", iso: "US", flag: "🇺🇸", utcOffset: "UTC-7" },
  { tz: "America/Toronto", name: "Canadá - Toronto / Este", country: "Canadá", iso: "CA", flag: "🇨🇦", utcOffset: "UTC-5" },
  { tz: "America/Vancouver", name: "Canadá - Vancouver / Pacífico", country: "Canadá", iso: "CA", flag: "🇨🇦", utcOffset: "UTC-8" },

  // Europa, Asia y África
  { tz: "Europe/Madrid", name: "España - Madrid / Barcelona", country: "España", iso: "ES", flag: "🇪🇸", utcOffset: "UTC+1" },
  { tz: "Europe/London", name: "Reino Unido - Londres", country: "Reino Unido", iso: "GB", flag: "🇬🇧", utcOffset: "UTC+0" },
  { tz: "Europe/Paris", name: "Francia - París", country: "Francia", iso: "FR", flag: "🇫🇷", utcOffset: "UTC+1" },
  { tz: "Europe/Berlin", name: "Alemania - Berlín", country: "Alemania", iso: "DE", flag: "🇩🇪", utcOffset: "UTC+1" },
  { tz: "Europe/Rome", name: "Italia - Roma", country: "Italia", iso: "IT", flag: "🇮🇹", utcOffset: "UTC+1" },
  { tz: "Europe/Lisbon", name: "Portugal - Lisboa", country: "Portugal", iso: "PT", flag: "🇵🇹", utcOffset: "UTC+0" },
  { tz: "Europe/Amsterdam", name: "Países Bajos - Ámsterdam", country: "Países Bajos", iso: "NL", flag: "🇳🇱", utcOffset: "UTC+1" },
  { tz: "Asia/Tokyo", name: "Japón - Tokio", country: "Japón", iso: "JP", flag: "🇯🇵", utcOffset: "UTC+9" },
  { tz: "Asia/Dubai", name: "Emiratos Árabes - Dubái", country: "Emiratos Árabes", iso: "AE", flag: "🇦🇪", utcOffset: "UTC+4" },
  { tz: "UTC", name: "Tiempo Universal Coordinado (UTC)", country: "Global", iso: "UN", flag: "🌐", utcOffset: "UTC+0" }
];
