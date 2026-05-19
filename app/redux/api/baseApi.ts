import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Auth", "Statements", "Dashboard", "Transactions", "Goals", "AIAnalysis", "Chat", "Plans" , "AIAnalysis" ,"Clarifications", "Onboarding" ,"Feedback"],
  // ── Prevent flicker on navigation ────────────────────────────────────────
  refetchOnMountOrArgChange: false,   // don't refetch just because component remounted
  refetchOnFocus: false,              // don't refetch when tab regains focus
  refetchOnReconnect: false,          // don't refetch on network reconnect
  endpoints: () => ({}),
});