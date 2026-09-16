export type FlowDataSourceKind = "none" | "db-read" | "db-write" | "api" | "agent";

export interface FlowStepDataSpec {
  kind: FlowDataSourceKind;
  label: string;
  detail: string;
}

// Where the E-Commerce journey hits the database / external payments.
// keys match the step ids used by the admin Flow Builder demo.
export const ECOMMERCE_STEP_SPEC: Record<string, FlowStepDataSpec> = {
  start: {
    kind: "none",
    label: "No DB call",
    detail:
      "The merged entry point. The customer opens the shop, taps \u201corder now\u201d, or just types a product/category name. On \u201corder now\u201d the bot renders the service categories — if a name resolves to one product, that product is pre-filled and the browse step is skipped.",
  },
  category: {
    kind: "none",
    label: "Pick a category",
    detail:
      "Path A: the customer picks a category from the menu (e.g. \u201cElectronics\u201d). The engine sets that category as the service and moves to the products step. No DB query happens yet — the catalog is fetched in the next step.",
  },
  products: {
    kind: "db-read",
    label: "Read product catalog",
    detail:
      "Selection step with fetchProducts: true — the bot queries the connected product collection (searchProductsFromCollection) filtered by the chosen category and renders the product names as tappable options/cards. Also reached directly (Path B) when the category itself \u2014 or a name that matches several products \u2014 is typed.",
  },
  cart: {
    kind: "db-read",
    label: "Resolve product & price",
    detail:
      "Tapping a product (or typing an exact name = Path B, no category step at all) triggers an exact DB lookup. A single match shows the full product card (name, price, description) with an \u201cOrder\u201d button; multiple matches show a picklist. The resolved name + price are stored in flowState so the next step only asks for quantity.",
  },
  checkout: {
    kind: "db-write",
    label: "Collect order details",
    detail:
      "Shipping & billing fields (full name, phone, email, address) are collected into the conversation flowState. No Order write yet — the DB row is persisted only at the confirm step.",
  },
  payment: {
    kind: "api",
    label: "Stripe / PayPal / Paddle",
    detail:
      "The customer picks Cash on Delivery or Pay Online. Online payment issues a checkout session / payment link; COD keeps the order unpaid until delivery. \u201cSkip Payment (Pay Later)\u201d stores Pay Later.",
  },
  confirm: {
    kind: "db-write",
    label: "Write Order + send emails",
    detail:
      "On CONFIRM the collected data is saved as an Order (status confirmed for COD, pending for online), the chatbot orderCount increments, and customer confirmation + owner notification emails are sent. Order Confirmed = receipt/tracking reference.",
  },
  support: {
    kind: "agent",
    label: "Live agent handoff",
    detail:
      "After the order completes, the bot offers a live support path that hands the conversation to a human agent through the inbox/support channel.",
  },
};

export interface EcommerceFlowField {
  name: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
  fetchProducts?: boolean;
  allowSkip?: boolean;
  displayStyle?: "cards" | "chips";
}

export interface EcommerceFlowStep {
  id: string;
  title: string;
  type: "selection" | "form" | "confirmation";
  fields: EcommerceFlowField[];
}

// Multi-category flow format the engine executes (flowManager.ts CategoryFlows)
// — one identical order pipeline per category, so both entry paths converge here.
export type EcommerceCategoryFlows = Record<string, { steps: EcommerceFlowStep[] }>;

// Builds the per-category order pipeline. Each category gets:
//   browse (DB catalog) -> quantity -> checkout -> payment -> confirm
// Path A (category menu) enters at browse with the category pre-set; Path B
// (direct product name) pre-fills the product so browse is auto-skipped and the
// customer jumps straight to quantity. Same steps, one merged flow.
export function buildEcommerceFlow(categories: string[]): EcommerceCategoryFlows {
  const flows: EcommerceCategoryFlows = {};
  for (const category of categories) {
    flows[category] = {
      steps: [
        {
          id: "browse",
          title: `Browse ${category}`,
          type: "selection",
          fields: [
            {
              name: "productChoice",
              label: `Choose a ${category} product`,
              type: "text",
              options: [],
              required: true,
              fetchProducts: true,
              displayStyle: "chips",
            },
          ],
        },
        {
          id: "quantity",
          title: "Quantity",
          type: "form",
          fields: [{ name: "quantity", label: "Quantity", type: "number", required: true }],
        },
        {
          id: "checkout",
          title: "Shipping & Billing Details",
          type: "form",
          fields: [
            { name: "fullName", label: "Full Name", type: "text", required: true },
            { name: "phone", label: "Phone Number", type: "tel", required: true },
            { name: "email", label: "Email Address", type: "email", required: false },
            { name: "address", label: "Shipping Address", type: "text", required: true },
          ],
        },
        {
          id: "payment",
          title: "Payment Method",
          type: "selection",
          fields: [
            {
              name: "paymentMethod",
              label: "Payment Method",
              type: "text",
              options: ["Cash on Delivery", "Pay Online (Stripe / PayPal / Paddle)"],
              required: true,
              allowSkip: true,
            },
          ],
        },
        {
          id: "confirm",
          title: "Confirm Order",
          type: "confirmation",
          fields: [],
        },
      ],
    };
  }
  return flows;
}

// Sample trainingFlow JSON — copy this into a chatbot's
// knowledge.trainingFlow. Both order paths converge into these category flows.
export const ECOMMERCE_TRAINING_FLOW: EcommerceCategoryFlows = buildEcommerceFlow([
  "Electronics",
  "Fashion",
  "General",
]);
