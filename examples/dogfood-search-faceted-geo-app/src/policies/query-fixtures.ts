/**
 * Canonical faceted + geo query fixtures + sample documents for the
 * dogfood app.
 *
 * The 3 fixture sets exercise the faceted-advanced + geo axes canonical
 * production workloads —
 *  - `FIXTURE_CATEGORIES` — e-commerce product categories with nested
 *    (category > subcategory) + hierarchical (dept > cat > subcat) +
 *    distinct brand + refined color filter.
 *  - `FIXTURE_RESTAURANTS` — restaurant listings with lat/lng across a
 *    Tokyo bounding box; cuisine + price-range facets.
 *  - `FIXTURE_EVENTS` — event venues combining facet (category /
 *    venue-type) + geo (city cluster) queries, driven side-by-side.
 *
 * Each fixture is small enough to inspect by eye in tests but wide
 * enough to catch off-by-one drift in count / hierarchy / distance
 * computations. All lat/lng anchor around real production landmarks
 * (Tokyo Station 35.6812,139.7671; Shibuya 35.6595,139.7005; Osaka
 * 34.7024,135.4959) so the geo distances stay physically plausible.
 */

import type {
  BoundingBox,
  FacetedDocument,
  GeoDocument,
  Polygon,
} from '../adapters/interface.js';

/** A facet query fixture — 1 facet request under test. */
export interface FacetQueryFixture {
  id: string;
  kind: 'nested' | 'hierarchy' | 'distinct' | 'refined';
  outerField?: string;
  innerField?: string;
  field?: string;
  value?: string;
  separator?: string;
}

/** A geo query fixture — 1 geo request under test. */
export interface GeoQueryFixture {
  id: string;
  kind: 'bounding-box' | 'radius' | 'polygon';
  bbox?: BoundingBox;
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  polygon?: Polygon;
}

/** A named fixture set with faceted + geo docs and query lists. */
export interface FixtureSet {
  id: string;
  label: string;
  facetedDocuments: readonly FacetedDocument[];
  geoDocuments: readonly GeoDocument[];
  facetQueries: readonly FacetQueryFixture[];
  geoQueries: readonly GeoQueryFixture[];
}

/**
 * Categories — 6 e-commerce products spanning 3 outer categories x 2
 * inner subcategories. Also carries a hierarchical `dept_path`
 * (electronics > audio > headphones) so the same doc drives both nested
 * + hierarchy facet queries.
 */
export const FIXTURE_CATEGORIES: FixtureSet = {
  id: 'categories',
  label: 'categories (nested + hierarchy + distinct + refined)',
  facetedDocuments: [
    {
      id: 'sku-headphones-sony',
      facets: {
        category: 'electronics',
        subcategory: 'audio',
        brand: 'sony',
        color: 'black',
        dept_path: 'electronics > audio > headphones',
      },
    },
    {
      id: 'sku-headphones-bose',
      facets: {
        category: 'electronics',
        subcategory: 'audio',
        brand: 'bose',
        color: 'white',
        dept_path: 'electronics > audio > headphones',
      },
    },
    {
      id: 'sku-laptop-apple',
      facets: {
        category: 'electronics',
        subcategory: 'laptop',
        brand: 'apple',
        color: 'silver',
        dept_path: 'electronics > computer > laptop',
      },
    },
    {
      id: 'sku-tshirt-nike',
      facets: {
        category: 'apparel',
        subcategory: 'top',
        brand: 'nike',
        color: 'black',
        dept_path: 'apparel > men > tshirt',
      },
    },
    {
      id: 'sku-sneaker-adidas',
      facets: {
        category: 'apparel',
        subcategory: 'shoe',
        brand: 'adidas',
        color: 'white',
        dept_path: 'apparel > men > shoe',
      },
    },
    {
      id: 'sku-mug-generic',
      facets: {
        category: 'home',
        subcategory: 'kitchen',
        brand: 'generic',
        color: 'black',
        dept_path: 'home > kitchen > mug',
      },
    },
  ],
  geoDocuments: [],
  facetQueries: [
    {
      id: 'q-nested-cat-sub',
      kind: 'nested',
      outerField: 'category',
      innerField: 'subcategory',
    },
    {
      id: 'q-hier-dept-path',
      kind: 'hierarchy',
      field: 'dept_path',
      separator: '>',
    },
    { id: 'q-distinct-brand', kind: 'distinct', field: 'brand' },
    { id: 'q-refined-color-black', kind: 'refined', field: 'color', value: 'black' },
  ],
  geoQueries: [],
};

/**
 * Restaurants — 5 Tokyo restaurants across Shibuya + Shinjuku + Ginza.
 * Anchors on real landmarks so bounding-box + radius queries are
 * physically reasonable (radius 1km around Shibuya Station should hit
 * ~2 restaurants; a Tokyo bbox should hit all 5; a Shinjuku polygon
 * should hit 1).
 */
export const FIXTURE_RESTAURANTS: FixtureSet = {
  id: 'restaurants',
  label: 'restaurants (bounding-box + radius + polygon)',
  facetedDocuments: [
    {
      id: 'rest-shibuya-ramen',
      facets: { cuisine: 'ramen', priceRange: 'low', neighborhood: 'shibuya' },
    },
    {
      id: 'rest-shibuya-sushi',
      facets: { cuisine: 'sushi', priceRange: 'mid', neighborhood: 'shibuya' },
    },
    {
      id: 'rest-shinjuku-izakaya',
      facets: { cuisine: 'izakaya', priceRange: 'mid', neighborhood: 'shinjuku' },
    },
    {
      id: 'rest-ginza-sushi',
      facets: { cuisine: 'sushi', priceRange: 'high', neighborhood: 'ginza' },
    },
    {
      id: 'rest-akihabara-curry',
      facets: { cuisine: 'curry', priceRange: 'low', neighborhood: 'akihabara' },
    },
  ],
  geoDocuments: [
    // Shibuya Station cluster (35.6595, 139.7005)
    {
      id: 'rest-shibuya-ramen',
      lat: 35.6595,
      lng: 139.7005,
      attributes: { cuisine: 'ramen' },
    },
    {
      id: 'rest-shibuya-sushi',
      lat: 35.66,
      lng: 139.702,
      attributes: { cuisine: 'sushi' },
    },
    // Shinjuku Station cluster (35.6896, 139.7006)
    {
      id: 'rest-shinjuku-izakaya',
      lat: 35.6896,
      lng: 139.7006,
      attributes: { cuisine: 'izakaya' },
    },
    // Ginza cluster (35.6716, 139.7659)
    {
      id: 'rest-ginza-sushi',
      lat: 35.6716,
      lng: 139.7659,
      attributes: { cuisine: 'sushi' },
    },
    // Akihabara cluster (35.6984, 139.7731)
    {
      id: 'rest-akihabara-curry',
      lat: 35.6984,
      lng: 139.7731,
      attributes: { cuisine: 'curry' },
    },
  ],
  facetQueries: [
    { id: 'q-distinct-cuisine', kind: 'distinct', field: 'cuisine' },
    { id: 'q-refined-cuisine-sushi', kind: 'refined', field: 'cuisine', value: 'sushi' },
  ],
  geoQueries: [
    {
      id: 'q-bbox-tokyo',
      kind: 'bounding-box',
      // Broad Tokyo bbox — includes all 5 restaurants.
      bbox: {
        swLat: 35.5,
        swLng: 139.5,
        neLat: 35.8,
        neLng: 139.85,
      },
    },
    {
      id: 'q-radius-shibuya-1km',
      kind: 'radius',
      // 1km around Shibuya Station — should hit both Shibuya restaurants.
      centerLat: 35.6595,
      centerLng: 139.7005,
      radiusMeters: 1000,
    },
    {
      id: 'q-polygon-shinjuku',
      kind: 'polygon',
      // Tight polygon around Shinjuku Station only.
      polygon: {
        vertices: [
          { lat: 35.685, lng: 139.6955 },
          { lat: 35.685, lng: 139.706 },
          { lat: 35.694, lng: 139.706 },
          { lat: 35.694, lng: 139.6955 },
        ],
      },
    },
  ],
};

/**
 * Events — 4 event venues combining facet (venue-type) + geo (city
 * cluster) queries. Exercises the interleaved facet-then-geo lifecycle
 * so the harness can drive both sessions in one bucket.
 */
export const FIXTURE_EVENTS: FixtureSet = {
  id: 'events',
  label: 'events (facet + geo interleaved)',
  facetedDocuments: [
    {
      id: 'event-tokyo-concert',
      facets: { venueType: 'concert-hall', category: 'music', city: 'tokyo' },
    },
    {
      id: 'event-tokyo-conference',
      facets: { venueType: 'conference-center', category: 'business', city: 'tokyo' },
    },
    {
      id: 'event-osaka-festival',
      facets: { venueType: 'outdoor', category: 'festival', city: 'osaka' },
    },
    {
      id: 'event-kyoto-temple',
      facets: { venueType: 'temple', category: 'culture', city: 'kyoto' },
    },
  ],
  geoDocuments: [
    // Tokyo Station (35.6812, 139.7671)
    { id: 'event-tokyo-concert', lat: 35.6812, lng: 139.7671 },
    { id: 'event-tokyo-conference', lat: 35.6836, lng: 139.7726 },
    // Osaka (34.7024, 135.4959)
    { id: 'event-osaka-festival', lat: 34.7024, lng: 135.4959 },
    // Kyoto (35.0116, 135.7681)
    { id: 'event-kyoto-temple', lat: 35.0116, lng: 135.7681 },
  ],
  facetQueries: [
    { id: 'q-distinct-city', kind: 'distinct', field: 'city' },
    { id: 'q-refined-city-tokyo', kind: 'refined', field: 'city', value: 'tokyo' },
  ],
  geoQueries: [
    {
      id: 'q-bbox-kansai',
      kind: 'bounding-box',
      // Kansai bbox — includes Osaka + Kyoto, excludes Tokyo.
      bbox: {
        swLat: 34.5,
        swLng: 135.3,
        neLat: 35.1,
        neLng: 135.9,
      },
    },
    {
      id: 'q-radius-tokyo-5km',
      kind: 'radius',
      centerLat: 35.6812,
      centerLng: 139.7671,
      radiusMeters: 5000,
    },
  ],
};

/** All 3 canonical fixture sets. */
export const ALL_FIXTURES: readonly FixtureSet[] = [
  FIXTURE_CATEGORIES,
  FIXTURE_RESTAURANTS,
  FIXTURE_EVENTS,
];
