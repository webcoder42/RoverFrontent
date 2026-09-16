import { Database, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MAPPING_LABELS,
  type ProductMapping,
} from "@/lib/productMapping";

interface DetectedCatalogColumnsProps {
  mapping: ProductMapping;
  catalogFields?: string[];
  connected: boolean;
  onMappingChange: (mapping: ProductMapping) => void;
  className?: string;
}

const BUILT_INS = [
  { key: "titleField", labelKey: "titleLabel" },
  { key: "priceField", labelKey: "priceLabel" },
  { key: "categoryField", labelKey: "categoryLabel" },
  { key: "imageField", labelKey: "imageLabel" },
  { key: "descriptionField", labelKey: "descriptionLabel" },
] as const;

/**
 * Editable column mapping for the connected collection.
 * Auto-detected columns are prefilled, but the user decides which DB column
 * feeds each field — and can add their own extra fields.
 */
export function DetectedCatalogColumns({
  mapping,
  catalogFields = [],
  connected,
  onMappingChange,
  className,
}: DetectedCatalogColumnsProps) {
  const custom = mapping.customFields ?? [];
  const hasColumns = connected && catalogFields.length > 0;

  const setField = (key: string, value: string) =>
    onMappingChange({ ...mapping, [key]: value });

  const ColumnPicker = ({
    value,
    onValue,
  }: {
    value: string;
    onValue: (v: string) => void;
  }) =>
    hasColumns ? (
      <select
        value={value}
        onChange={(e) => onValue(e.target.value)}
        className="h-8 min-w-0 flex-1 rounded-lg border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">— Not mapped —</option>
        {catalogFields.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    ) : (
      <input
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={connected ? "Type a column name" : "e.g. price (type after connecting)"}
        className="h-8 min-w-0 flex-1 rounded-lg border border-border/70 bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    );

  return (
    <div className={cn("rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Database className="h-3.5 w-3.5 text-primary" /> Fields to fetch from your collection
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Only the columns you map here are fetched. Click{" "}
        <span className="font-semibold text-foreground">"Test &amp; Auto-Detect Columns"</span> to
        fill these automatically — then change any of them to match your collection. You can also
        rename each field yourself.
      </p>

      <div className="space-y-2">
        {BUILT_INS.map((row) => (
          <div
            key={row.key}
            className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2"
          >
            <input
              value={(mapping[row.labelKey] as string) || DEFAULT_MAPPING_LABELS[row.labelKey]}
              onChange={(e) => setField(row.labelKey, e.target.value)}
              className="h-8 w-32 shrink-0 rounded-lg border border-border/70 bg-card px-2 text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <ColumnPicker
              value={mapping[row.key] || ""}
              onValue={(v) => setField(row.key, v)}
            />
          </div>
        ))}
      </div>

      {custom.length > 0 && (
        <div className="space-y-2">
          <span className="block text-[11px] font-semibold text-foreground/80">
            Extra fields to fetch
          </span>
          {custom.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={c.label}
                onChange={(e) => {
                  const next = custom.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  );
                  onMappingChange({ ...mapping, customFields: next });
                }}
                placeholder="Field name (shown in chat)"
                className="h-8 w-32 shrink-0 rounded-lg border border-border/70 bg-card px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <ColumnPicker
                value={c.field}
                onValue={(v) => {
                  const next = custom.map((x, j) =>
                    j === i ? { ...x, field: v } : x,
                  );
                  onMappingChange({ ...mapping, customFields: next });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  onMappingChange({
                    ...mapping,
                    customFields: custom.filter((_, j) => j !== i),
                  })
                }
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          onMappingChange({
            ...mapping,
            customFields: [...custom, { label: "", field: "" }],
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add field to fetch
      </button>

      {hasColumns && (
        <p className="text-[10px] text-muted-foreground">
          {catalogFields.length} columns detected in this collection.
        </p>
      )}
    </div>
  );
}