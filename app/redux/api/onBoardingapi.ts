

import { baseApi } from "./baseApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingRequest {
  primaryGoal:    "SAVE_FOR_GOAL" | "PAY_OFF_DEBT" | "BUILD_EMERGENCY_FUND" | "TRACK_SPENDING" | "GROW_WEALTH";
  employmentType: "SALARIED" | "FREELANCE" | "BUSINESS_OWNER" | "STUDENT" | "OTHER";
  dependents:     "JUST_ME" | "SUPPORTING_FAMILY" | "HAVE_KIDS" | "BOTH";
  cityTier:       "METRO" | "TIER_2" | "TIER_3";
  incomeRange:    "BELOW_30K" | "RANGE_30K_60K" | "RANGE_60K_1L" | "RANGE_1L_2L" | "ABOVE_2L";
}

export interface UserOnboardingProfileDto {
  id:             string;
  primaryGoal:    string | null;
  employmentType: string | null;
  dependents:     string | null;
  cityTier:       string | null;
  incomeRange:    string | null;
  skipped:        boolean;
  completedAt:    string | null;
  createdAt:      string;
}

export interface TransactionClarificationDto {
  id:                string;
  clarificationType: "RECURRING_P2P" | "UNCONFIRMED_SALARY" | "LOW_CONFIDENCE_CATEGORY";
  questionText:      string;
  options:           string[];
  status:            "PENDING" | "RESOLVED" | "SKIPPED";
  transactionId:     string | null;
  createdAt:         string;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // Phase 1 — Profile
    // Returns 204 (null data) if not yet done → show modal
    // Returns 200 with profile if done → skip modal
    getOnboardingProfile: builder.query<UserOnboardingProfileDto | null, void>({
      query: () => ({ url: "/onboarding/profile", method: "GET" }),
      // 204 has no body — RTK parses it as undefined; normalise to null
      transformResponse: (res: any) => res ?? null,
      // A 204 from the server will cause fetchBaseQuery to throw unless we handle it.
      // We use transformErrorResponse to treat 204 as a successful null.
      transformErrorResponse: (err: any) => {
        if (err.status === 204) return null;
        return err;
      },
      providesTags: ["Onboarding"],
    }),

    saveOnboardingProfile: builder.mutation<UserOnboardingProfileDto, OnboardingRequest>({
      query: (body) => ({ url: "/onboarding/profile", method: "POST", body }),
      invalidatesTags: ["Onboarding"],
    }),

    skipOnboardingProfile: builder.mutation<void, void>({
      query: () => ({ url: "/onboarding/profile/skip", method: "POST" }),
      invalidatesTags: ["Onboarding"],
    }),

    // Phase 2 — Clarification cards
    getPendingClarifications: builder.query<TransactionClarificationDto[], void>({
      query: () => ({ url: "/clarifications/pending", method: "GET" }),
      transformResponse: (res: any) => res ?? [],
      providesTags: ["Clarifications"],
    }),
resolveClarification: builder.mutation<TransactionClarificationDto, { id: string; answer: string }>({
  query: ({ id, answer }) => ({
    url: `/clarifications/${id}/resolve`,
    method: "POST",
    body: { answer },
  }),
  invalidatesTags: ["Clarifications", "AIAnalysis"], 
}),

    skipClarification: builder.mutation<void, string>({
      query: (id) => ({ url: `/clarifications/${id}/skip`, method: "POST" }),
      invalidatesTags: ["Clarifications"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetOnboardingProfileQuery,
  useSaveOnboardingProfileMutation,
  useSkipOnboardingProfileMutation,
  useGetPendingClarificationsQuery,
  useResolveClarificationMutation,
  useSkipClarificationMutation,
} = onboardingApi;