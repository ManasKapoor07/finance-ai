import { baseApi } from "./baseApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersonalizationValue =
  | "EXTREMELY_PERSONALIZED"
  | "MOSTLY_PERSONALIZED"
  | "SOMEWHAT_GENERIC"
  | "VERY_GENERIC";

export interface FeedbackRequest {
  firstImpression:  string;
  accurateInsight:  string;
  personalization:  PersonalizationValue;
  wantedInsights:   string[];
  describeToFriend: string;
  holyShitInsight:  string;
  contactEmail:     string;
  contactOk:        boolean;
}

export interface FeedbackSubmitResponse {
  id: string;
}

export interface FeedbackAnalytics {
  totalResponses:           number;
  personalizationBreakdown: Record<PersonalizationValue, number>;
  topWantedInsights:        Record<string, number>;
  contactOptIns:            number;
  recentDescriptions:       string[];
  recentHolyShit:           string[];
}

// ─── Injected slice ───────────────────────────────────────────────────────────

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /** POST /api/feedback — submit one response, returns the new UUID */
    submitFeedback: builder.mutation<FeedbackSubmitResponse, FeedbackRequest>({
      query: (body) => ({ url: "/feedback", method: "POST", body }),
      transformResponse: (response: any) => response.data ?? response,
    }),

    /** GET /api/feedback/analytics — aggregate stats (internal/admin only) */
    getFeedbackAnalytics: builder.query<FeedbackAnalytics, void>({
      query: () => ({ url: "/feedback/analytics", method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Feedback"],
    }),
  }),
});

export const {
  useSubmitFeedbackMutation,
  useGetFeedbackAnalyticsQuery,
} = feedbackApi;