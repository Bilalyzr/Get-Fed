import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared Zod schemas — used by BOTH frontend forms and backend route handlers.
// Backend validation is authoritative (PRD §10/§15/§77).
// ---------------------------------------------------------------------------

export const COORDINATE_BOUNDS = {
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
};

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s\-()+]+$/, "Enter a valid phone number"),
  organisationName: z
    .string()
    .trim()
    .min(2, "Organisation name must be at least 2 characters")
    .max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  role: z.enum(["PROVIDER", "RECIPIENT"], {
    errorMap: () => ({ message: "Choose PROVIDER or RECIPIENT" }),
  }),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const foodCategories = [
  "COOKED_MEALS",
  "BAKERY",
  "PACKAGED",
  "PRODUCE",
  "DAIRY",
  "BEVERAGES",
  "OTHER",
] as const;

export const foodUnits = ["PORTIONS", "KG", "PACKETS"] as const;

/**
 * Business-rule validation for listings (PRD §15):
 *   quantity > 0
 *   pickupDeadline > now
 *   availableFrom <= pickupDeadline
 *   preparedAt <= now
 */
export const createListingSchema = z
  .object({
    foodName: z.string().trim().min(2, "Food name is required").max(120),
    description: z.string().trim().min(5, "Describe the food briefly").max(2000),
    category: z.enum(foodCategories),
    totalQuantity: z.coerce
      .number({ invalid_type_error: "Quantity must be a number" })
      .int("Quantity must be a whole number")
      .positive("Quantity must be greater than 0")
      .max(100_000),
    unit: z.enum(foodUnits),
    preparedAt: z.coerce.date(),
    availableFrom: z.coerce.date(),
    pickupDeadline: z.coerce.date(),
    pickupAddress: z.string().trim().min(5, "Pickup address is required").max(300),
    pickupLocationName: z.string().trim().max(150).optional().or(z.literal("")),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    allergenNotes: z.string().trim().max(500).optional().or(z.literal("")),
    packagingType: z.string().trim().max(100).optional().or(z.literal("")),
    image: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const now = Date.now();
    if (data.preparedAt.getTime() > now + 5 * 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preparedAt"],
        message: "Prepared time cannot be in the future.",
      });
    }
    if (data.pickupDeadline.getTime() <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupDeadline"],
        message: "Pickup deadline must be in the future.",
      });
    }
    if (data.availableFrom.getTime() > data.pickupDeadline.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availableFrom"],
        message: "Available from must be before the pickup deadline.",
      });
    }
    if (data.availableFrom.getTime() < data.pickupDeadline.getTime() - 7 * 24 * 60 * 60 * 1000) {
      // Available window longer than 7 days is almost certainly a mistake.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availableFrom"],
        message: "Available window cannot start more than 7 days before the deadline.",
      });
    }
  });

export const updateListingSchema = z.object({
  foodName: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(5).max(2000).optional(),
  category: z.enum(foodCategories).optional(),
  preparedAt: z.coerce.date().optional(),
  availableFrom: z.coerce.date().optional(),
  pickupDeadline: z.coerce.date().optional(),
  pickupAddress: z.string().trim().min(5).max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  notes: z.string().trim().max(1000).optional(),
  allergenNotes: z.string().trim().max(500).optional(),
  packagingType: z.string().trim().max(100).optional(),
  image: z.string().trim().max(300).optional(),
});

export const createClaimSchema = z.object({
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0")
    .max(100_000),
});

export const qrVerifySchema = z.object({
  // Signed envelope produced by /api/claims/:id/qr (base64url(JSON).hmac).
  payload: z.string().min(20, "Invalid QR payload"),
});

export const recipientPreferenceSchema = z.object({
  maxDistanceKm: z.coerce.number().min(0.5).max(100),
  minimumQuantity: z.coerce.number().int().min(1).max(100_000),
  maximumQuantity: z.coerce.number().int().min(1).max(100_000),
  availableFrom: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format")
    .optional()
    .or(z.literal("")),
  availableUntil: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format")
    .optional()
    .or(z.literal("")),
});

export const discoverQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  maxDistanceKm: z.coerce.number().min(0.1).max(200).optional(),
  minQuantity: z.coerce.number().int().min(1).optional(),
  category: z.enum(foodCategories).optional(),
  withinHours: z.coerce.number().min(0.1).max(168).optional(),
  sort: z.enum(["deadline", "distance", "quantity", "newest"]).default("deadline"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type DiscoverQuery = z.infer<typeof discoverQuerySchema>;
