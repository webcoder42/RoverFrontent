export const FREE_PLAN = {
  name: "Free",
  totalChatbots: 1,
  bookingAgency: 0,
  databaseAccess: false,
  databaseCollections: 0,
  apiRequests: "0",
  trainingStorage: 0.5,
  ragModel: false,
  emailSupport: false,
  emailLimit: 0,
  apiAccess: true,
};

export const PLAN_LIMITS: Record<string, { label: string; limit: string }[]> = {
  Free: [
    { label: "Chatbots", limit: "1" },
    { label: "Booking Agencies", limit: "Not available" },
    { label: "Database", limit: "Not available" },
    { label: "Storage", limit: "0.5 GB" },
    { label: "RAG Model", limit: "Not available" },
    { label: "Email Support", limit: "Not available" },
    { label: "Script API", limit: "Available" },
  ],
};
