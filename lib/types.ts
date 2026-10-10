// Shared client-side API row types (serialized ISO strings from the API).

export type prismaListingRow = {
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
  createdAt: string;
  updatedAt: string;
  claimCount?: number;
  providerOrganisation?: string;
  distanceKm?: number | null;
};

export type ProviderClaimRow = {
  id: string;
  quantity: number;
  status: string;
  foodName: string;
  unit: string;
  recipientOrg: string;
  recipientName?: string;
  createdAt: string;
  pickupDeadline: string;
  collectedAt?: string | null;
  expired?: boolean;
};
