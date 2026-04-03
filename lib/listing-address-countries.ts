/** Common countries for host address form (ISO 3166-1 alpha-2 → label). */
export const LISTING_ADDRESS_COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "PT", label: "Portugal" },
  { code: "NL", label: "Netherlands" },
  { code: "BR", label: "Brazil" },
  { code: "MX", label: "Mexico" },
  { code: "IN", label: "India" },
  { code: "ID", label: "Indonesia" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "TH", label: "Thailand" },
  { code: "NZ", label: "New Zealand" },
] as const;

export function countryLabelFromCode(code: string): string {
  const row = LISTING_ADDRESS_COUNTRIES.find((c) => c.code === code);
  return row?.label ?? code;
}
