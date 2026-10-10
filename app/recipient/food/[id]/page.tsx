"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Utensils,
  Navigation,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ClaimModal } from "@/components/ClaimModal";
import { MapViewDynamic } from "@/components/MapView";

type Detail = {
  listing: {
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
    status: string;
    allergenNotes: string | null;
    packagingType: string | null;
    notes: string | null;
  };
  providerOrganisation: string;
  distanceKm: number | null;
  myClaim: { id: string; quantity: number; status: string } | null;
};

export default function FoodDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${params.id}`);
      const json = await res.json();
      if (json.success && json.data.listing) {
        setData(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-80" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-10 text-center text-sm text-stone-500">
        This listing is no longer available.{" "}
        <Link href="/recipient/food" className="font-semibold text-green-700">
          Back to discovery
        </Link>
      </div>
    );
  }

  const l = data.listing;
  const verified = session?.user?.verificationStatus === "VERIFIED";
  const claimable =
    ["AVAILABLE", "PARTIALLY_RESERVED"].includes(l.status) &&
    l.availableQuantity > 0 &&
    new Date(l.pickupDeadline).getTime() > Date.now();
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${l.latitude},${l.longitude}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/recipient/food"
        className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Discover food
      </Link>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-stone-900">{l.foodName}</h1>
              <StatusBadge status={l.status} size="md" />
            </div>
            <p className="mt-0.5 text-sm text-stone-500">
              by {data.providerOrganisation}
            </p>
          </div>
          {data.distanceKm != null && (
            <span className="badge badge-available">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {data.distanceKm} km away
            </span>
          )}
        </div>

        <p className="mt-4 leading-relaxed text-stone-600">{l.description}</p>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Utensils className="mt-0.5 h-4 w-4 text-green-700" aria-hidden />
            <div>
              <dt className="font-medium text-stone-700">Quantity</dt>
              <dd className="mt-0.5 text-stone-600">
                {l.availableQuantity} of {l.totalQuantity} {l.unit.toLowerCase()} available
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 text-stone-400" aria-hidden />
            <div>
              <dt className="font-medium text-stone-700">Prepared</dt>
              <dd className="mt-0.5 text-stone-600">
                {new Date(l.preparedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-stone-700">Pickup deadline</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-stone-600">
              {new Date(l.pickupDeadline).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              <CountdownTimer deadline={l.pickupDeadline} expiredLabel="Window closed" />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-stone-700">Pickup location</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-stone-600">
              <MapPin className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              {l.pickupAddress}
            </dd>
          </div>
          {l.allergenNotes && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-stone-700">Allergen notes</dt>
              <dd className="mt-0.5 flex items-start gap-1.5 text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {l.allergenNotes}
              </dd>
            </div>
          )}
          {l.packagingType && (
            <div>
              <dt className="font-medium text-stone-700">Packaging</dt>
              <dd className="mt-0.5 text-stone-600">{l.packagingType}</dd>
            </div>
          )}
          {l.notes && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-stone-700">Notes</dt>
              <dd className="mt-0.5 text-stone-600">{l.notes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5">
          <MapViewDynamic
            center={{ latitude: l.latitude, longitude: l.longitude }}
            markers={[
              {
                id: l.id,
                latitude: l.latitude,
                longitude: l.longitude,
                label: l.foodName,
                sublabel: l.pickupAddress,
              },
            ]}
            height="200px"
            zoom={15}
          />
        </div>
      </div>

      {/* Actions */}
      {data.myClaim ? (
        <div className="card bg-green-50 p-5 ring-green-600/20">
          <p className="font-bold text-green-900">
            You reserved {data.myClaim.quantity} {l.unit.toLowerCase()} —{" "}
            {data.myClaim.status.toLowerCase().replace(/_/g, " ")}
          </p>
          <Link
            href={`/recipient/qr?claim=${data.myClaim.id}`}
            className="btn-primary mt-3"
          >
            Show pickup QR
          </Link>
        </div>
      ) : !verified ? (
        <div className="card flex items-start gap-3 bg-amber-50 p-5 ring-amber-600/20">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <p className="text-sm text-amber-900">
            Your organisation must be verified by an administrator before you
            can claim food.
          </p>
        </div>
      ) : claimable ? (
        <div className="flex gap-3">
          <button onClick={() => setClaiming(true)} className="btn-primary flex-1">
            Claim food
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            Directions
          </a>
        </div>
      ) : (
        <p className="card p-5 text-center text-sm text-stone-500">
          This listing is {l.status.toLowerCase().replace(/_/g, " ")} and can no
          longer be claimed.
        </p>
      )}

      {claiming && (
        <ClaimModal
          food={{
            id: l.id,
            foodName: l.foodName,
            category: l.category,
            totalQuantity: l.totalQuantity,
            availableQuantity: l.availableQuantity,
            unit: l.unit,
            preparedAt: l.preparedAt,
            pickupDeadline: l.pickupDeadline,
            pickupAddress: l.pickupAddress,
            providerOrganisation: data.providerOrganisation,
            distanceKm: data.distanceKm,
            status: l.status,
          }}
          onClose={() => setClaiming(false)}
          onClaimed={(claimId) => {
            setClaiming(false);
            window.location.href = `/recipient/qr?claim=${claimId}`;
          }}
        />
      )}

    </div>
  );
}
