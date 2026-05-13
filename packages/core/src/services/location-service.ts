/**
 * Detailed address components returned from reverse geocoding.
 */
export interface AddressDetails {
  city: string;
  district?: string;
  village?: string;
  postcode?: string;
  fullAddress: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  city_district?: string;
  suburb?: string;
  district?: string;
  village?: string;
  neighbourhood?: string;
  postcode?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  display_name?: string;
}

/**
 * Fetches detailed address components from latitude and longitude.
 * Uses the free Nominatim OpenStreetMap API.
 */
export async function getDetailedAddress(lat: number, lon: number): Promise<AddressDetails> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'id',
          'User-Agent': 'Bananasbindery-App',
        },
      }
    );
    const data = (await res.json()) as NominatimResponse;
    
    const addr = data.address || {};
    
    return {
      city: addr.city || addr.town || addr.city_district || 'Jakarta',
      district: addr.suburb || addr.district || '',
      village: addr.village || addr.neighbourhood || '',
      postcode: addr.postcode || '',
      fullAddress: data.display_name || '',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      city: 'Jakarta',
      fullAddress: '',
    };
  }
}

/**
 * Legacy support for simple city detection.
 */
export async function getCityFromCoords(lat: number, lon: number): Promise<string> {
  const details = await getDetailedAddress(lat, lon);
  return details.city;
}
