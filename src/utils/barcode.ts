/**
 * Looks a packaged food up in Open Food Facts directly from the app (the API allows cross-origin
 * calls and needs no key), so barcode logging works without the NutriStep server.
 * Values are per 100 g, matching the server's /api/barcode-lookup response shape.
 */
export interface BarcodeProduct {
  barcode: string;
  product_name: string;
  brand: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  image_url: string | null;
}

const round1 = (n: unknown) => Math.round(Number(n ?? 0) * 10) / 10;

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct> {
  if (!/^\d{6,14}$/.test(barcode)) throw new Error('Enter the 8–13 digit number printed under the barcode.');
  let res: Response;
  try {
    res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  } catch {
    throw new Error('Barcode lookup needs an internet connection.');
  }
  const data = res.ok ? await res.json() : null;
  if (!data || data.status !== 1 || !data.product) {
    throw new Error('That barcode is not in the Open Food Facts database. Try Manual entry instead.');
  }
  const p = data.product;
  const n = p.nutriments || {};
  return {
    barcode,
    product_name: p.product_name || p.generic_name || 'Packaged food',
    brand: p.brands || 'Unknown brand',
    serving_size: p.serving_size || '100 g',
    calories: Math.round(Number(n['energy-kcal_100g'] ?? n['energy-kcal_serving'] ?? 0)),
    protein_g: round1(n.proteins_100g ?? n.proteins_serving),
    carbs_g: round1(n.carbohydrates_100g ?? n.carbohydrates_serving),
    fat_g: round1(n.fat_100g ?? n.fat_serving),
    fiber_g: round1(n.fiber_100g),
    sodium_mg: Math.round(Number(n.sodium_100g ?? 0) * 1000),
    image_url: p.image_front_small_url || p.image_url || null,
  };
}
