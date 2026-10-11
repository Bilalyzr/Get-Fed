"use client";

import { useState } from "react";
import { X, Minus, Plus, AlertTriangle } from "lucide-react";
import type { FoodCardData } from "@/components/FoodCard";
import { useToast } from "@/components/Toast";
import { ClickSpark } from "@/components/reactbits";

// ---------------------------------------------------------------------------
// Claim quantity selector modal (PRD §20): partial claims with a quantity
// input bounded by availability. Server confirmation is authoritative
// (PRD §58) — the modal disables submit while the mutation runs.
// ---------------------------------------------------------------------------

export function ClaimModal({
  food,
  onClose,
  onClaimed,
}: {
  food: FoodCardData;
  onClose: () => void;
  onClaimed: (claimId: string) => void;
}) {
  const [quantity, setQuantity] = useState(Math.min(1, food.availableQuantity));
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { toast } = useToast();

  const clamp = (value: number): number =>
    Math.max(1, Math.min(food.availableQuantity, Math.round(value) || 1));

  async function submit() {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/listings/${food.id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const json = await res.json();
      if (!json.success) {
        // Friendly, code-specific messages from the server (PRD §57).
        setServerError(json.message ?? "Your claim could not be completed.");
        toast("error", json.message ?? "Claim failed.");
        return;
      }
      toast("success", json.data.message);
      onClaimed(json.data.claimId);
    } catch {
      setServerError("Network error — please try again.");
      toast("error", "Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Claim ${food.foodName}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Claim food</h2>
            <p className="text-sm text-stone-500">
              {food.foodName} · {food.providerOrganisation}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close claim dialog"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-500"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-600/20">
          <p>
            <strong>{food.availableQuantity}</strong> {food.unit.toLowerCase()}{" "}
            currently available. You will receive a QR code to show at pickup.
          </p>
        </div>

        <label htmlFor="claim-quantity" className="label">
          How many {food.unit.toLowerCase()} do you need?
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => clamp(q - 1))}
            disabled={quantity <= 1 || submitting}
            aria-label="Decrease quantity"
            className="btn-secondary !p-2.5"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <input
            id="claim-quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={food.availableQuantity}
            value={quantity}
            onChange={(e) => setQuantity(clamp(Number(e.target.value)))}
            disabled={submitting}
            className="input w-24 text-center text-lg font-bold"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => clamp(q + 1))}
            disabled={quantity >= food.availableQuantity || submitting}
            aria-label="Increase quantity"
            className="btn-secondary !p-2.5"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-sm text-stone-500">of {food.availableQuantity} available</span>
        </div>

        <input
          type="range"
          min={1}
          max={food.availableQuantity}
          value={quantity}
          onChange={(e) => setQuantity(clamp(Number(e.target.value)))}
          disabled={submitting}
          aria-label="Quantity slider"
          className="mt-4 w-full accent-green-700"
        />

        {serverError && (
          <p
            className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-600/20"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {serverError}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary flex-1">
            Cancel
          </button>
          <ClickSpark sparkColor="#c5d9a8" className="flex-1">
            <button
              type="button"
              onClick={submit}
              disabled={submitting || quantity < 1 || quantity > food.availableQuantity}
              className="btn-primary w-full"
            >
              {submitting ? "Reserving…" : `Reserve ${quantity}`}
            </button>
          </ClickSpark>
        </div>
      </div>
    </div>
  );
}
