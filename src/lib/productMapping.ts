export interface CustomFieldRow {
  label: string;
  field: string;
}

export interface ProductMapping {
  titleField: string;
  priceField: string;
  categoryField: string;
  imageField: string;
  descriptionField: string;
  titleLabel?: string;
  priceLabel?: string;
  categoryLabel?: string;
  imageLabel?: string;
  descriptionLabel?: string;
  customFields?: CustomFieldRow[];
}

export const DEFAULT_MAPPING_LABELS: Record<
  "titleLabel" | "priceLabel" | "categoryLabel" | "imageLabel" | "descriptionLabel",
  string
> = {
  titleLabel: "Name / Title",
  priceLabel: "Price",
  categoryLabel: "Category",
  imageLabel: "Image URL",
  descriptionLabel: "Description / Details",
};

const GUESSES: Record<
  "titleField" | "priceField" | "categoryField" | "imageField" | "descriptionField",
  string[]
> = {
  titleField: ["title", "name", "product", "productname", "producttitle", "prodname", "item"],
  priceField: ["price", "cost", "sellingprice", "productprice", "sale", "amount", "priceusd"],
  categoryField: ["category", "cat", "categories", "type", "productcategory", "subcategory"],
  imageField: [
    "image",
    "img",
    "picture",
    "photo",
    "images",
    "imageurl",
    "imageurls",
    "thumbnail",
    "pic",
  ],
  descriptionField: ["description", "desc", "details"],
};

export function guessMapping(fields: string[], mapping: ProductMapping): ProductMapping {
  if (!fields.length) return mapping;
  const lower = fields.map((f) => f.toLowerCase());
  const next: ProductMapping = { ...mapping };
  (Object.keys(GUESSES) as Array<keyof typeof GUESSES>).forEach((key) => {
    const current = (mapping[key] || "").trim();
    if (current && fields.includes(current)) return;
    const cands = GUESSES[key];
    const hit = cands.map((c) => c.toLowerCase()).find((c) => lower.includes(c));
    let found = hit !== undefined ? fields[lower.indexOf(hit)] : undefined;
    if (!found) {
      const hitField = fields.find((f) => {
        const fl = f.toLowerCase();
        return cands.some((c) => {
          const cl = c.toLowerCase();
          return fl.includes(cl) || cl.includes(fl);
        });
      });
      found = hitField;
    }
    if (found) next[key] = found;
  });
  return next;
}
