import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only');

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(200),
  slug,
  category_id: z.string().uuid('Pick a category').nullable().optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(10_000_000),
  mrp: z
    .union([z.coerce.number().min(0).max(10_000_000), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  unit: z.string().trim().min(1).max(12).default('PCS'),
  moq: z.coerce.number().int().min(1, 'Minimum order must be at least 1').max(10_000),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(10_000_000),
  part_no: z.string().trim().max(40).optional().default(''),
  description: z.string().max(20_000).optional().default(''),
  images: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  is_active: z.coerce.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  slug,
  description: z.string().max(2000).optional().default(''),
  image_url: z.string().trim().max(500).optional().default(''),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.coerce.boolean().default(true),
});

export const settingsSchema = z.object({
  store_name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(30),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'WhatsApp number must be digits only, with country code'),
  email: z.string().trim().email('Enter a valid email address'),
  address: z.string().trim().max(200).optional().default(''),
  gst_default_rate: z.coerce.number().min(0).max(0.5),
  gst_charger_rate: z.coerce.number().min(0).max(0.5),
  store_open: z.coerce.boolean().default(true),
});

export const contentBlockSchema = z.object({
  key: z.string().trim().min(1).max(60),
  type: z.string().trim().min(1).max(40),
  position: z.coerce.number().int().min(0).max(999).default(0),
  is_active: z.coerce.boolean().default(true),
  data: z.record(z.any()),
});

/** Turns a Zod error into a field -> message map the forms can render. */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
