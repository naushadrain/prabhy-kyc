import { ensureSession } from "@/api/session/sessionClient";
import { buildSignatureForBody } from "@/api/session/signature";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const USER_LOGIN_ID = import.meta.env.VITE_USER_LOGIN_ID as string;

export type CatalogueItem = { value: string; data: string; additional_value?: string };

// Catalogue type codes for motor vehicle registration
const CATALOGUE = {
  VEHICLE_CATEGORY: "01",     // Top-level vehicle category
  VEHICLE_SUB_CATEGORY: "05", // Sub-category (Car, SUV, Bus, Truck...)
  AGE_BAND: "41",             // Vehicle age-band — requires id + additional_field1
  ZONE_ABBR: "27",            // Zones abbreviation (vehicle_reg: "y")
  ZONE_LOT: "28",             // Lot number for zone (vehicle_reg: "y")
  VEHICLE_KIND: "29",         // Vehicle kind (vehicle_reg: "y")
  EMBOSSED_STATE: "31",       // State for embossed (vehicle_reg: "e")
  EMBOSSED_LOT: "32",         // Lot number for embossed (vehicle_reg: "e")
  EMBOSSED_KIND: "33",        // Vehicle kind for embossed (vehicle_reg: "e")
} as const;

async function fetchMotorCatalogue(
  catalogueType: string,
  id?: string,
  additional_field1?: string
): Promise<CatalogueItem[]> {
  if (!API_BASE_URL || !USER_LOGIN_ID) {
    throw new Error("Missing env vars");
  }

  const processKey = await ensureSession();
  const { unixTs, signature } = buildSignatureForBody("");
  const basicToken = btoa(`${USER_LOGIN_ID}:${processKey}`);

  const qs = new URLSearchParams({ catalogue_type: catalogueType });
  if (id) qs.set("id", id);
  if (additional_field1) qs.set("additional_field1", additional_field1);
  const url = `${API_BASE_URL}/v1/catalogue/getcatalogue?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "X-Basic-Authorization": `Basic ${basicToken}`,
      "verify-signature": `${unixTs}.${signature}`,
      "split-signature": `${unixTs}.${signature}`,
      Accept: "*/*",
    },
  });

  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!res.ok || data?.error_list?.length) {
    throw new Error(data?.error_list?.[0]?.error_message || `Catalogue fetch failed (${res.status})`);
  }

  return Array.isArray(data?.catalogue_list) ? data.catalogue_list : [];
}

/** Vehicle categories (top-level, catalogue_type=01) — id optional */
export const getVehicleCategories = (id?: string) =>
  fetchMotorCatalogue(CATALOGUE.VEHICLE_CATEGORY, id);

/** Vehicle sub-categories (catalogue_type=05, e.g. Car, SUV) — id varies by page */
export const getVehicleSubCategories = (id: string) =>
  fetchMotorCatalogue(CATALOGUE.VEHICLE_SUB_CATEGORY, id);

/** Vehicle age bands (catalogue_type=41) — id = class, additional_field1 = vehicle age */
export const getVehicleAgeBands = (id: string, additional_field1: string) =>
  fetchMotorCatalogue(CATALOGUE.AGE_BAND, id, additional_field1);

/** Zone system — zone abbreviations (Ba, Ja, Na...) */
export const getZoneAbbreviations = () => fetchMotorCatalogue(CATALOGUE.ZONE_ABBR);

/** Zone system — lot numbers */
export const getZoneLotNumbers = () => fetchMotorCatalogue(CATALOGUE.ZONE_LOT);

/** Vehicle kind / symbol (Pa, Cha, Ka...) */
export const getVehicleKinds = () => fetchMotorCatalogue(CATALOGUE.VEHICLE_KIND);

/** Embossed system — states (STATE 1, STATE 2...) */
export const getEmbossedStates = () => fetchMotorCatalogue(CATALOGUE.EMBOSSED_STATE);

/** Embossed system — lot numbers */
export const getEmbossedLotNumbers = () => fetchMotorCatalogue(CATALOGUE.EMBOSSED_LOT);

/** Embossed system — vehicle kind (catalogue 33) */
export const getEmbossedVehicleKinds = () => fetchMotorCatalogue(CATALOGUE.EMBOSSED_KIND);
