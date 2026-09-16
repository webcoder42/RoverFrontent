import { useState } from "react";
import { ChevronDown, Plus, PlusCircle, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ProductMapping, type CustomFieldRow } from "@/lib/productMapping";

type FieldKey = "titleField" | "priceField" | "categoryField" | "imageField";

const ROWS: Array<{ key: FieldKey; label: string; fallback: string }> = [
  { key: "titleField", label: "Title / Name Field", fallback: "name" },
  { key: "priceField", label: "Price Field", fallback: "price" },
  { key: "categoryField", label: "Category Field", fallback: "category" },
  { key: "imageField", label: "Image URL Field", fallback: "image" },
];

interface FieldSelectProps {
  value: string;
  fallback: string;
  fields: string[];
  onChange: (value: string) => void;
}

function FieldSelect({ value, fallback, fields, onChange }: FieldSelectProps) {
  const current = value || fallback;
  const inFields = fields.length > 0 && fields.includes(current);
  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-lg border border-border bg-card px-2 pr-7 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {!inFields && (
          <option value={current}>{(current || fallback || "").slice(0, 40)} (manual)</option>
        )}
        {fields.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

interface ProductFieldMappingProps {
  mapping: ProductMapping;
  onMappingChange: (mapping: ProductMapping) => void;
  catalogFields?: string[];
  className?: string;
}

export function ProductFieldMapping({
  mapping,
  onMappingChange,
  catalogFields = [],
  className,
}: ProductFieldMappingProps) {
  const fields = catalogFields;
  const hasFields = fields.length > 0;
  const customFields: CustomFieldRow[] = mapping.customFields ?? [];

  const [newLabel, setNewLabel] = useState("");
  const [newField, setNewField] = useState("");

  const updateCustom = (index: number, patch: Partial<CustomFieldRow>) => {
    const next = customFields.map((cf, i) => (i === index ? { ...cf, ...patch } : cf));
    onMappingChange({ ...mapping, customFields: next });
  };

  const removeCustom = (index: number) => {
    onMappingChange({
      ...mapping,
      customFields: customFields.filter((_, i) => i !== index),
    });
  };

  const addCustom = () => {
    const label = newLabel.trim();
    const field = newField.trim();
    if (!label || !field) return;
    onMappingChange({
      ...mapping,
      customFields: [...customFields, { label, field }],
    });
    setNewLabel("");
    setNewField("");
  };

  return (
    <div
      className={cn("rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3", className)}
    >
      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Product Column / Key Mappings
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {ROWS.map((row) => (
          <div key={row.key}>
            <span className="text-[11px] font-medium text-muted-foreground block mb-1">
              {row.label}
            </span>
            {hasFields ? (
              <FieldSelect
                value={mapping[row.key] || ""}
                fallback={row.fallback}
                fields={fields}
                onChange={(v) => onMappingChange({ ...mapping, [row.key]: v })}
              />
            ) : (
              <input
                value={mapping[row.key] || row.fallback}
                onChange={(e) => onMappingChange({ ...mapping, [row.key]: e.target.value })}
                className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
                placeholder={row.fallback}
              />
            )}
          </div>
        ))}
      </div>

      {customFields.length > 0 && (
        <div className="border-t border-primary/10 pt-3 space-y-2">
          <span className="text-[11px] font-semibold text-foreground/80 block">
            Custom Columns ({customFields.length})
          </span>
          <div className="grid gap-2 md:grid-cols-2">
            {customFields.map((cf, i) => (
              <div key={i} className="rounded-lg border border-border/70 bg-card p-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-foreground block truncate">
                    {cf.label || "(no name)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCustom(i)}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    title="Remove column"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {hasFields ? (
                  <FieldSelect
                    value={cf.field}
                    fallback={cf.field || ""}
                    fields={fields}
                    onChange={(v) => updateCustom(i, { field: v })}
                  />
                ) : (
                  <input
                    value={cf.field}
                    onChange={(e) => updateCustom(i, { field: e.target.value })}
                    className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
                    placeholder="collection key"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-primary/10 pt-3">
        <span className="text-[11px] font-semibold text-foreground/80 block mb-2">
          Add New Column
        </span>
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <span className="text-[10px] font-medium text-muted-foreground block mb-1">
              Column Name
            </span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
              placeholder="e.g. SKU, Stock, Color"
            />
          </div>
          <div>
            <span className="text-[10px] font-medium text-muted-foreground block mb-1">
              Collection Key
            </span>
            {hasFields ? (
              <FieldSelect value={newField} fallback="" fields={fields} onChange={setNewField} />
            ) : (
              <input
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
                placeholder="collection key"
              />
            )}
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addCustom}
              disabled={!newLabel.trim() || !newField.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-primary px-3 text-xs font-semibold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          <PlusCircle className="mr-1 inline h-3 w-3" />
          Extra product fields (like SKU, stock, size) — these will be attached to every order item.
        </p>
      </div>
    </div>
  );
}
