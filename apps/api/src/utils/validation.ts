import { z } from "zod";

/**
 * Standard 36-char hexadecimal UUID regex (8-4-4-4-12).
 * Compatible with all RFC 4122 versions (v1-v7) as well as PostgreSQL UUID columns,
 * preventing strict Zod rejection of custom or seed hex UUIDs.
 */
export const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const uuidSchema = (message = "Invalid UUID") =>
  z.string().regex(uuidRegex, message);

export const optionalUuid = z
  .union([uuidSchema(), z.literal("")])
  .optional()
  .transform((val) => (val === "" || val === undefined ? undefined : val));

export const nullableUuid = z
  .union([uuidSchema(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val === null || val === undefined ? null : val));
