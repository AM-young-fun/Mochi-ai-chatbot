// EEA, United Kingdom and Switzerland.
const consentCountries = new Set([
  "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
  "GB", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MT",
  "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
]);

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  const knownCountry = country && /^[A-Z]{2}$/.test(country) && country !== "XX";
  const consentRegion = knownCountry ? (consentCountries.has(country) ? "required" : "optional") : "unknown";
  return Response.json(
    { consentRegion },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
