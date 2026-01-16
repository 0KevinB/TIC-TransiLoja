import { z } from 'zod';

// This schema is designed to parse route data from Firestore,
// handling the migration from old camelCase fields to the new GTFS-compliant snake_case fields.
export const RouteSchema = z.preprocess(
  (data: any) => {
    // This function normalizes the incoming data before validation.
    const normalized = {
      ...data,
      route_short_name: data.route_short_name || data.shortName,
      route_long_name: data.route_long_name || data.name,
      route_desc: data.route_desc || data.description,
      route_color: (data.route_color || data.color || 'FF0000').replace('#', ''),
      route_text_color: (data.route_text_color || data.textColor || 'FFFFFF').replace('#', ''),
      route_type: data.route_type ?? (data.type === 'bus' ? 3 : (typeof data.type === 'number' ? data.type : 3)),
      custom_stop_ids: data.custom_stop_ids || data.stopIds || [],
    };
    return normalized;
  },
  z.object({
    route_id: z.string(), // This will be added from the document ID
    route_short_name: z.string().min(1, { message: "Short name is required" }),
    route_long_name: z.string().min(1, { message: "Long name is required" }),
    route_desc: z.string().optional(),
    route_color: z.string().length(6, { message: "Color must be a 6-character hex code" }).optional(),
    route_text_color: z.string().length(6, { message: "Text color must be a 6-character hex code" }).optional(),
    route_type: z.number().min(0).max(12),
    agency_id: z.string().optional().nullable(),
    custom_stop_ids: z.array(z.string()),
  })
);
