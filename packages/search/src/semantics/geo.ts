import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type GeoState =
  | 'idle'
  | 'bbox-filtered'
  | 'radius-filtered'
  | 'polygon-filtered'
  | 'isochrone-resolved';

export interface GeoDocument {
  id: string;
  lat: number;
  lng: number;
  attributes?: Record<string, string | number>;
}

export interface GeoSession {
  target: SearchTarget;
  indexId: string;
  documents: GeoDocument[];
  state: GeoState;
  history: AxisStep<GeoState>[];
}

export interface BoundingBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface Polygon {
  vertices: Array<{ lat: number; lng: number }>;
}

export function startGeoSession(input: {
  target: SearchTarget;
  indexId: string;
}): GeoSession {
  if (input.indexId.length === 0) {
    throw new Error('startGeoSession: indexId must not be empty');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    documents: [],
    state: 'idle',
    history: [],
  };
}

export function seedGeoDocuments(session: GeoSession, docs: GeoDocument[]): void {
  for (const d of docs) {
    if (!isValidLatLng(d.lat, d.lng)) {
      throw new Error(`seedGeoDocuments: invalid lat/lng for ${d.id}`);
    }
    session.documents.push({ id: d.id, lat: d.lat, lng: d.lng, attributes: { ...d.attributes } });
  }
}

export function filterBoundingBox(
  session: GeoSession,
  bbox: BoundingBox,
): { step: AxisStep<GeoState>; hits: GeoDocument[] } {
  if (bbox.swLat > bbox.neLat || bbox.swLng > bbox.neLng) {
    throw new Error('filterBoundingBox: sw must be south-west of ne');
  }
  const hits = session.documents.filter(
    (d) =>
      d.lat >= bbox.swLat &&
      d.lat <= bbox.neLat &&
      d.lng >= bbox.swLng &&
      d.lng <= bbox.neLng,
  );
  session.state = 'bbox-filtered';
  const step = emit(session, 'geo.bounding_box_filtered', {
    hitCount: hits.length,
    swLat: bbox.swLat,
    neLat: bbox.neLat,
  });
  return { step, hits };
}

export function filterRadius(
  session: GeoSession,
  input: { centerLat: number; centerLng: number; radiusMeters: number },
): { step: AxisStep<GeoState>; hits: Array<GeoDocument & { distanceMeters: number }> } {
  if (!isValidLatLng(input.centerLat, input.centerLng)) {
    throw new Error('filterRadius: invalid center lat/lng');
  }
  if (input.radiusMeters <= 0) {
    throw new Error('filterRadius: radiusMeters must be positive');
  }
  const scored = session.documents
    .map((d) => ({
      ...d,
      distanceMeters: haversineMeters(input.centerLat, input.centerLng, d.lat, d.lng),
    }))
    .filter((d) => d.distanceMeters <= input.radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  session.state = 'radius-filtered';
  const step = emit(session, 'geo.radius_filtered', {
    hitCount: scored.length,
    radiusMeters: input.radiusMeters,
  });
  return { step, hits: scored };
}

export function filterPolygon(
  session: GeoSession,
  polygon: Polygon,
): { step: AxisStep<GeoState>; hits: GeoDocument[] } {
  if (polygon.vertices.length < 3) {
    throw new Error('filterPolygon: polygon must have at least 3 vertices');
  }
  const hits = session.documents.filter((d) => pointInPolygon(d.lat, d.lng, polygon.vertices));
  session.state = 'polygon-filtered';
  const step = emit(session, 'geo.polygon_filtered', {
    hitCount: hits.length,
    vertexCount: polygon.vertices.length,
  });
  return { step, hits };
}

export function resolveIsochrone(
  session: GeoSession,
  input: {
    centerLat: number;
    centerLng: number;
    travelTimeMinutes: number;
    avgSpeedKmh?: number;
  },
): { step: AxisStep<GeoState>; hits: Array<GeoDocument & { travelTimeMinutes: number }> } {
  if (input.travelTimeMinutes <= 0) {
    throw new Error('resolveIsochrone: travelTimeMinutes must be positive');
  }
  const speedKmh = input.avgSpeedKmh ?? 30;
  const radiusMeters = (speedKmh * 1000 * input.travelTimeMinutes) / 60;
  const scored = session.documents
    .map((d) => {
      const distance = haversineMeters(input.centerLat, input.centerLng, d.lat, d.lng);
      return {
        ...d,
        travelTimeMinutes: (distance / (speedKmh * 1000)) * 60,
      };
    })
    .filter((d) => d.travelTimeMinutes <= input.travelTimeMinutes)
    .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);
  session.state = 'isochrone-resolved';
  const step = emit(session, 'geo.isochrone_resolved', {
    hitCount: scored.length,
    travelTimeMinutes: input.travelTimeMinutes,
    avgSpeedKmh: speedKmh,
    approximateRadiusMeters: radiusMeters,
  });
  return { step, hits: scored };
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dPhi = toRadians(lat2 - lat1);
  const dLambda = toRadians(lng2 - lng1);
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function pointInPolygon(lat: number, lng: number, vertices: Polygon['vertices']): boolean {
  // ray casting from the point along +lng direction
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];
    if (!vi || !vj) continue;
    const intersect =
      vi.lat > lat !== vj.lat > lat &&
      lng < ((vj.lng - vi.lng) * (lat - vi.lat)) / (vj.lat - vi.lat) + vi.lng;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function emit(
  session: GeoSession,
  neutralEvent: AxisStep<GeoState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<GeoState> {
  const step: AxisStep<GeoState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
