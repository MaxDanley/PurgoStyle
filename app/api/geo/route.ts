import { NextResponse } from "next/server";

// US state/region codes to display names (Vercel returns e.g. TX, CA)
const US_REGION_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington DC",
};

/**
 * Returns visitor location from Vercel geo headers for "Ships to [location]" display.
 * GET /api/geo -> { region: "Texas", country: "US" } or { region: null, country: null } if unavailable.
 */
export async function GET(req: Request) {
  try {
    const country = req.headers.get("x-vercel-ip-country") || null;
    const regionCode = req.headers.get("x-vercel-ip-country-region") || null;
    const city = req.headers.get("x-vercel-ip-city") || null;

    let region: string | null = null;
    if (country === "US" && regionCode) {
      region = US_REGION_NAMES[regionCode.toUpperCase()] || regionCode;
    } else if (regionCode) {
      region = regionCode;
    } else if (city) {
      region = city;
    }

    return NextResponse.json({ region, country });
  } catch {
    return NextResponse.json({ region: null, country: null });
  }
}
