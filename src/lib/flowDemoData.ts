import { ECOMMERCE_TRAINING_FLOW } from "./ecommerceFlow";
import type { EcommerceFlowStep } from "./ecommerceFlow";

// Per-flow demo data for the Flow Builder "Chat Preview" panel.
// Each entry provides: the trainingFlow JSON the widget should simulate, the
// auto-play script (user messages = dummy data), and a chat greeting.
export interface FlowDemoData {
  flowId: string;
  trainingFlow: string;
  script: string[];
  welcome: string;
}

const DEFAULT_PAYMENT_OPTIONS = ["Cash on Delivery", "Pay Online (Stripe / PayPal / Paddle)"];

function singleFlow(steps: EcommerceFlowStep[]): string {
  return JSON.stringify({ steps });
}

function confirmStep(): EcommerceFlowStep {
  return { id: "confirm", title: "Confirm", type: "confirmation", fields: [] };
}

function paymentStep(
  title = "Payment Method",
  options: string[] = ["Cash on Delivery", "Pay Online (Stripe / PayPal / Paddle)"],
): EcommerceFlowStep {
  return {
    id: "payment",
    title,
    type: "selection",
    fields: [
      {
        name: "paymentMethod",
        label: "Payment Method",
        type: "text",
        options,
        required: true,
        allowSkip: true,
      },
    ],
  };
}

function contactFormStep(fieldName: string, label: string): EcommerceFlowStep {
  return {
    id: fieldName,
    title: label,
    type: "form",
    fields: [{ name: fieldName, label, type: "text", required: true }],
  };
}

export const FLOW_DEMO_DATA: Record<string, FlowDemoData> = {
  ecommerce: {
    flowId: "ecommerce",
    trainingFlow: JSON.stringify(ECOMMERCE_TRAINING_FLOW),
    welcome:
      "Assalam o Alaikum! 👋 Welcome to our store. Type or tap a category to start your order — or just type a product name directly.",
    script: [
      "Electronics",
      "Electronics Pro Edition",
      "Order Now",
      "2",
      "Ali Raza",
      "0300 1234567",
      "ali@example.com",
      "House 12, Street 5, Gulberg III, Lahore",
      "Pay Online (Stripe / PayPal / Paddle)",
      "4242 4242 4242 4242",
      "12/28",
      "123",
      "confirm",
    ],
  },
  service: {
    flowId: "service",
    welcome: "Assalam o Alaikum! 👋 What service would you like to book today?",
    trainingFlow: singleFlow([
      {
        id: "service",
        title: "Choose a Service",
        type: "selection",
        fields: [
          {
            name: "service",
            label: "Service",
            type: "text",
            options: ["Website Design", "SEO & Marketing", "Consultation", "App Development"],
            required: true,
          },
        ],
      },
      {
        id: "slot",
        title: "Pick a Slot",
        type: "selection",
        fields: [
          {
            name: "slot",
            label: "Slot",
            type: "text",
            options: ["Today 3:00 PM", "Tomorrow 10:00 AM", "Friday 4:30 PM"],
            required: true,
          },
        ],
      },
      contactFormStep("fullName", "Full Name"),
      contactFormStep("phone", "Phone Number"),
      paymentStep(),
      confirmStep(),
    ]),
    script: [
      "Website Design",
      "Tomorrow 10:00 AM",
      "Ali Raza",
      "0300 1234567",
      "Pay Online (Stripe / PayPal / Paddle)",
      "confirm",
    ],
  },
  table: {
    flowId: "table",
    welcome: "Welcome to our restaurant! 🍽️ Where would you like to book a table?",
    trainingFlow: singleFlow([
      {
        id: "restaurant",
        title: "Pick a Restaurant",
        type: "selection",
        fields: [
          {
            name: "restaurant",
            label: "Restaurant",
            type: "text",
            options: ["Downtown Grill", "Rooftop Lounge", "Cafe Bistro"],
            required: true,
          },
        ],
      },
      {
        id: "time",
        title: "Date & Time",
        type: "selection",
        fields: [
          {
            name: "slot",
            label: "Time Slot",
            type: "text",
            options: ["Tonight 7:30 PM", "Tonight 9:00 PM", "Tomorrow 8:00 PM"],
            required: true,
          },
        ],
      },
      contactFormStep("guests", "Number of Guests"),
      contactFormStep("request", "Special Request (optional)"),
      paymentStep("Confirm Booking", ["Reserve now", "Pay at restaurant"]),
      confirmStep(),
    ]),
    script: ["Downtown Grill", "Tonight 7:30 PM", "4", "Window seat", "Reserve now", "confirm"],
  },
  ride: {
    flowId: "ride",
    welcome: "Where would you like to go today? 🚗 Tell me your pickup and drop-off.",
    trainingFlow: singleFlow([
      contactFormStep("pickup", "Pickup Location"),
      contactFormStep("dropoff", "Drop-off Location"),
      {
        id: "choose",
        title: "Choose a Ride",
        type: "selection",
        fields: [
          {
            name: "rideType",
            label: "Ride Type",
            type: "text",
            options: ["Go (Rs. 350)", "X (Rs. 520)", "XL (Rs. 780)"],
            required: true,
          },
        ],
      },
      paymentStep("Payment", DEFAULT_PAYMENT_OPTIONS),
      confirmStep(),
    ]),
    script: [
      "DHA Phase 5, Lahore",
      "Minar-e-Pakistan",
      "X (Rs. 520)",
      "Cash on Delivery",
      "confirm",
    ],
  },
  ticket: {
    flowId: "ticket",
    welcome: "Which show or route would you like? 🎬 Pick below.",
    trainingFlow: singleFlow([
      {
        id: "show",
        title: "Pick Movie / Route",
        type: "selection",
        fields: [
          {
            name: "show",
            label: "Show / Route",
            type: "text",
            options: [
              "Inception (IMAX) 8:15 PM",
              "Avatar 3 (3D) 9:30 PM",
              "Karachi to Lahore Bus 10:00 PM",
            ],
            required: true,
          },
        ],
      },
      {
        id: "seat",
        title: "Select Seat",
        type: "selection",
        fields: [
          {
            name: "seat",
            label: "Seat",
            type: "text",
            options: ["A12", "B04", "C19"],
            required: true,
          },
        ],
      },
      paymentStep("Payment", ["Card / Wallet / Bank", "Cash at Counter"]),
      confirmStep(),
    ]),
    script: ["Inception (IMAX) 8:15 PM", "B04", "Card / Wallet / Bank", "confirm"],
  },
  hotel: {
    flowId: "hotel",
    welcome: "Welcome to hotel booking! 🏨 Which hotel would you like to stay at?",
    trainingFlow: singleFlow([
      {
        id: "hotel",
        title: "Select Hotel",
        type: "selection",
        fields: [
          {
            name: "hotel",
            label: "Hotel",
            type: "text",
            options: ["Serene Resorts", "City Heights Hotel", "Lakeview Suites"],
            required: true,
          },
        ],
      },
      contactFormStep("checkIn", "Check-in Date"),
      contactFormStep("checkOut", "Check-out Date"),
      {
        id: "room",
        title: "Room Type",
        type: "selection",
        fields: [
          {
            name: "room",
            label: "Room",
            type: "text",
            options: ["Standard", "Deluxe", "Suite"],
            required: true,
          },
        ],
      },
      paymentStep("Payment", ["Prepay Online", "Pay at Hotel"]),
      confirmStep(),
    ]),
    script: [
      "Serene Resorts",
      "15 June 2026",
      "18 June 2026",
      "Deluxe",
      "Prepay Online",
      "confirm",
    ],
  },
  session: {
    flowId: "session",
    welcome: "Which session would you like to book? 🎓",
    trainingFlow: singleFlow([
      {
        id: "session",
        title: "Choose Session",
        type: "selection",
        fields: [
          {
            name: "session",
            label: "Session",
            type: "text",
            options: ["Career Consultation", "Maths Tutoring", "Fitness Coaching"],
            required: true,
          },
        ],
      },
      {
        id: "slot",
        title: "Pick a Slot",
        type: "selection",
        fields: [
          {
            name: "slot",
            label: "Slot",
            type: "text",
            options: ["Monday 10:00 AM", "Wednesday 3:00 PM", "Friday 5:30 PM"],
            required: true,
          },
        ],
      },
      paymentStep("Book & Pay", DEFAULT_PAYMENT_OPTIONS),
      confirmStep(),
    ]),
    script: [
      "Maths Tutoring",
      "Wednesday 3:00 PM",
      "Pay Online (Stripe / PayPal / Paddle)",
      "confirm",
    ],
  },
};

// Tailwind gradient tone -> concrete hex colors for the widget.
export const FLOW_TONE_HEX: Record<string, { primary: string; secondary: string }> = {
  "from-rose-500 to-purple-600": { primary: "#f43f5e", secondary: "#9333ea" },
  "from-sky-500 to-cyan-500": { primary: "#0ea5e9", secondary: "#06b6d4" },
  "from-orange-500 to-amber-500": { primary: "#f97316", secondary: "#f59e0b" },
  "from-emerald-500 to-teal-500": { primary: "#10b981", secondary: "#14b8a6" },
  "from-fuchsia-500 to-pink-500": { primary: "#d946ef", secondary: "#ec4899" },
  "from-indigo-500 to-violet-500": { primary: "#6366f1", secondary: "#8b5cf6" },
  "from-teal-500 to-emerald-500": { primary: "#14b8a6", secondary: "#10b981" },
};

export function demoDataForFlow(flowId: string): FlowDemoData {
  return (
    FLOW_DEMO_DATA[flowId] || {
      ...FLOW_DEMO_DATA.ecommerce,
      flowId,
      welcome: "Hello! What would you like to order or book today?",
    }
  );
}
