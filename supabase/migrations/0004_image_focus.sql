-- ----------------------------------------------------------------------------
--  Image framing
--
--  Category tiles are shown in several shapes — a square thumbnail in the admin
--  list, wide tiles on the home page, a different crop on the categories page.
--  A plain object-cover crop cuts whatever happens to be in the middle, which is
--  often not the product.
--
--  Storing the focal point (and a zoom factor) lets every one of those shapes
--  crop sensibly around the part of the photo that actually matters, without
--  re-uploading anything. Shape: { "x": 50, "y": 50, "zoom": 1 } — x and y are
--  percentages, so they map straight onto CSS object-position.
-- ----------------------------------------------------------------------------

alter table public.categories add column if not exists image_focus jsonb;
