import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/distance";
import type { DiscoverQuery } from "@/lib/validators";

// ---------------------------------------------------------------------------
// Recipient discovery (PRD §18/§19): server-side filtering + pagination.
// Expired/cancelled/draft listings NEVER appear (PRD §17).
// ---------------------------------------------------------------------------

const DISCOVERABLE_STATUSES = ["AVAILABLE", "PARTIALLY_RESERVED"] as const;

export type DiscoveredListing = {
  id: string;
  foodName: string;
  description: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  preparedAt: string;
  availableFrom: string;
  pickupDeadline: string;
  pickupAddress: string;
  latitude: number;
  longitude: number;
  image: string | null;
  allergenNotes: string | null;
  packagingType: string | null;
  notes: string | null;
  status: string;
  providerOrganisation: string;
  distanceKm: number | null;
  createdAt: string;
};

export async function discoverListings(
  query: DiscoverQuery,
  now = new Date()
): Promise<{ items: DiscoveredListing[]; total: number; page: number; pageSize: number }> {
  const deadlineAfter = query.withinHours
    ? new Date(now.getTime() + query.withinHours * 60 * 60 * 1000)
    : undefined;

  // Server-side filtering first (PRD §49): status, deadline, quantity, category.
  const rows = await prisma.foodListing.findMany({
    where: {
      status: { in: [...DISCOVERABLE_STATUSES] },
      pickupDeadline: { gt: now, ...(deadlineAfter ? { lte: deadlineAfter } : {}) },
      availableQuantity: { gte: query.minQuantity ?? 1 },
      ...(query.category ? { category: query.category } : {}),
    },
    include: { provider: { select: { organisationName: true } } },
    orderBy: { pickupDeadline: "asc" },
    take: 200, // hard cap before client-side geo filtering
  });

  let items = rows.map((row) => ({
    id: row.id,
    foodName: row.foodName,
    description: row.description,
    category: row.category,
    totalQuantity: row.totalQuantity,
    availableQuantity: row.availableQuantity,
    unit: row.unit,
    preparedAt: row.preparedAt.toISOString(),
    availableFrom: row.availableFrom.toISOString(),
    pickupDeadline: row.pickupDeadline.toISOString(),
    pickupAddress: row.pickupAddress,
    latitude: row.latitude,
    longitude: row.longitude,
    image: row.image,
    allergenNotes: row.allergenNotes,
    packagingType: row.packagingType,
    notes: row.notes,
    status: row.status,
    providerOrganisation: row.provider.organisationName,
    distanceKm:
      query.latitude != null && query.longitude != null
        ? Math.round(
            haversineDistanceKm(
              { latitude: query.latitude, longitude: query.longitude },
              { latitude: row.latitude, longitude: row.longitude }
            ) * 10
          ) / 10
        : null,
    createdAt: row.createdAt.toISOString(),
  }));

  // Radius filter when coordinates are known.
  const maxDistance = query.maxDistanceKm ?? (query.latitude != null ? 25 : undefined);
  if (maxDistance != null && query.latitude != null) {
    items = items.filter((i) => (i.distanceKm ?? Infinity) <= maxDistance);
  }

  // Sort per request.
  switch (query.sort) {
    case "distance":
      items.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
      break;
    case "quantity":
      items.sort((a, b) => b.availableQuantity - a.availableQuantity);
      break;
    case "newest":
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      items.sort((a, b) => a.pickupDeadline.localeCompare(b.pickupDeadline));
  }

  const total = items.length;
  const start = (query.page - 1) * query.pageSize;
  return {
    items: items.slice(start, start + query.pageSize),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
