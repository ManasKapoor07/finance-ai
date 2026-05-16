import { baseApi } from "./baseApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalStatus   = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type GoalSource   = "MANUAL" | "AI_EXTRACTED";
export type PlanStatus   = "ACTIVE" | "COMPLETED" | "ABANDONED";
export type PlanFrequency = "WEEKLY" | "MONTHLY";
export type CheckinStatus = "PENDING" | "DONE" | "SKIPPED";

export interface GoalDto {
  id:                  string;
  name:                string;
  targetAmount:        number | null;
  currentSaved:        number;
  monthlyContribution: number | null;
  targetDate:          string | null;
  monthsLeft:          number;
  progressPercent:     number;
  status:              GoalStatus;
  source:              GoalSource;
  createdAt:           string;
  updatedAt:           string;
}

export interface WeekTaskDto {
  id:            string;
  weekNumber:    number;
  weekStart:     string;
  weekEnd:       string;
  savingTarget:  number | null;
  actions:       string[];
  tip:           string | null;
  checkinStatus: CheckinStatus;
  savedAmount:   number | null;
  checkinNote:   string | null;
  checkedInAt:   string | null;
  isCurrent:     boolean;
}

export interface GoalPlanDto {
  id:                string;
  goalId:            string;
  goalName:          string;
  frequency:         PlanFrequency;
  status:            PlanStatus;
  totalWeeks:        number;
  weeklySavingTarget: number | null;
  startDate:         string;
  endDate:           string;
  summary:           string;
  progressPct:       number;
  weeks:             WeekTaskDto[];
  createdAt:         string;
  updatedAt:         string;
}

export interface CreateGoalRequest {
  name:         string;
  targetAmount?: number | null;
  currentSaved?: number;
  targetDate?:   string | null;
  statementId?:  string | null;
  source?:       "MANUAL" | "AI_EXTRACTED";
}

export interface UpdateGoalRequest {
  goalId:        string;
  name?:         string;
  targetAmount?: number | null;
  currentSaved?: number;
  targetDate?:   string | null;
}

export interface UpdateSavedRequest {
  goalId:      string;
  currentSaved: number;
}

export interface CheckInRequest {
  planId:      string;
  taskId:      string;
  savedAmount?: number;
  note?:        string;
  status:       "DONE" | "SKIPPED";
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const goalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Goals ────────────────────────────────────────────────────────────────

    getGoals: builder.query<GoalDto[], void>({
      query: () => ({ url: "/goals", method: "GET" }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ["Goals"],
    }),

    getActiveGoals: builder.query<GoalDto[], void>({
      query: () => ({ url: "/goals/active", method: "GET" }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ["Goals"],
    }),

    createGoal: builder.mutation<GoalDto, CreateGoalRequest>({
      query: (body) => ({ url: "/goals", method: "POST", body }),
      transformResponse: (res: any) => res.data ?? res,
      invalidatesTags: ["Goals"],
    }),

    updateGoal: builder.mutation<GoalDto, UpdateGoalRequest>({
      query: ({ goalId, ...body }) => ({
        url: `/goals/${goalId}`, method: "PATCH", body,
      }),
      transformResponse: (res: any) => res.data ?? res,
      invalidatesTags: ["Goals"],
    }),

    updateSaved: builder.mutation<GoalDto, UpdateSavedRequest>({
      query: ({ goalId, currentSaved }) => ({
        url: `/goals/${goalId}/saved`, method: "PATCH", body: { currentSaved },
      }),
      transformResponse: (res: any) => res.data ?? res,
      invalidatesTags: ["Goals"],
    }),

    cancelGoal: builder.mutation<void, string>({
      query: (goalId) => ({ url: `/goals/${goalId}`, method: "DELETE" }),
      invalidatesTags: ["Goals", "Plans"],
    }),

    // ── Plans ────────────────────────────────────────────────────────────────

    getPlans: builder.query<GoalPlanDto[], void>({
      query: () => ({ url: "/plans", method: "GET" }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ["Plans"],
    }),

    getPlan: builder.query<GoalPlanDto, string>({
      query: (planId) => ({ url: `/plans/${planId}`, method: "GET" }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ["Plans"],
    }),

    getActivePlanForGoal: builder.query<GoalPlanDto | null, string>({
      query: (goalId) => ({ url: `/plans/goal/${goalId}/active`, method: "GET" }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ["Plans"],
    }),

    checkIn: builder.mutation<GoalPlanDto, CheckInRequest>({
      query: ({ planId, ...body }) => ({
        url: `/plans/${planId}/checkin`, method: "POST", body,
      }),
      transformResponse: (res: any) => res.data ?? res,
      invalidatesTags: ["Plans", "Goals"],
    }),

    abandonPlan: builder.mutation<void, string>({
      query: (planId) => ({ url: `/plans/${planId}`, method: "DELETE" }),
      invalidatesTags: ["Plans"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetGoalsQuery,
  useGetActiveGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useUpdateSavedMutation,
  useCancelGoalMutation,
  useGetPlansQuery,
  useGetPlanQuery,
  useGetActivePlanForGoalQuery,
  useCheckInMutation,
  useAbandonPlanMutation,
} = goalsApi;