import { baseApi } from "./baseApi";

export interface StatementIdWithBank {
  id: string;
  bankName: string;
}

export interface ChatMessageDto {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  planLimitError?: string | null;
}

export interface SuggestedGoalDto {
  name: string;
  targetAmount: number | null;
  currentSaved: number | null;
  targetDate: string | null;
}

export interface WeekTaskDto {
  id: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  savingTarget: number | null;
  savedAmount: number | null;
  actions: string[];
  tip: string | null;
  checkinStatus: "PENDING" | "DONE" | "SKIPPED";
  checkinNote: string | null;
  checkedInAt: string | null;
  isCurrent: boolean;
}

export interface GoalPlanDto {
  id: string;
  goalId: string;
  goalName: string;
  summary: string;
  totalWeeks: number;
  weeklySavingTarget: number | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  startDate: string;
  endDate: string;
  progressPct: number;
  weeks: WeekTaskDto[];
  createdAt: string;
  frequency?: "WEEKLY" | "MONTHLY";
}

export interface ChatResponse {
  planLimitError: any;
  chatId: string;
  reply: string;
  history: ChatMessageDto[];
  newChat: boolean;
  suggestedGoal: SuggestedGoalDto | null;
  createdPlan: GoalPlanDto | null;
  planOfferPending: boolean;
  pendingPlanGoalName: string | null;
}

export interface ChatRequest {
  statementId: string;
  chatId?: string | null;
  message: string;
}

export interface ConfirmGoalRequest {
  name: string;
  targetAmount: number | null;
  currentSaved: number | null;
  targetDate: string | null;
}

export interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface WeeklySpendItem {
  label: string;
  rangeFrom: string;
  rangeTo: string;
  debit: number;
  credit: number;
  txCount: number;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),

    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),

    // ← fixed return type to StatementIdWithBank[]
    getStatementIds: builder.query<StatementIdWithBank[], void>({
      query: () => ({ url: "/statements/ids", method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
    }),

    getStatements: builder.query<any, void>({
      query: () => ({ url: "/statements", method: "GET" }),
    }),

    getStatementById: builder.query<any, string>({
      query: (id) => ({ url: `/statements/${id}`, method: "GET" }),
    }),

    getDashboard: builder.query<any, string>({
      query: (statementId) => ({ url: `/dashboard/${statementId}`, method: "GET" }),
    }),

    getTransactions: builder.query<any, {
      statementId: string;
      page?: number;
      size?: number;
      sort?: string;
      dir?: "asc" | "desc";
      type?: "DEBIT" | "CREDIT";
      category?: string;
    }>({
      query: ({ statementId, page = 0, size = 20, sort = "date", dir = "desc", type, category }) => {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort, dir });
        if (type)     params.append("type", type);
        if (category) params.append("category", category);
        return { url: `/statements/${statementId}/transactions?${params}`, method: "GET" };
      },
    }),

    getRecurringCharges: builder.query<any, string>({
      query: (statementId) => ({ url: `/statements/${statementId}/recurring`, method: "GET" }),
    }),

    uploadStatement: builder.mutation<any, { file: File; password?: string; bankName?: string }>({
      query: ({ file, password, bankName }) => {
        const form = new FormData();
        form.append("file", file);
        if (password) form.append("password", password);
        if (bankName) form.append("bankName", bankName);
        return { url: "/statements/upload", method: "POST", body: form };
      },
    }),

    analyzeFinancialProfile: builder.mutation<any, string>({
      query: (statementId) => ({
        url: `/financial-profiles/${statementId}/analyze`,
        method: "POST",
      }),
    }),

    getWeeklySpend: builder.query<{ data: WeeklySpendItem[] }, string>({
      query: (statementId) => ({ url: `/statements/${statementId}/weekly-spend`, method: "GET" }),
      transformResponse: (response: any) => ({ data: response.data ?? [] }),
    }),

    // ── Chat ──────────────────────────────────────────────────────────────────

    sendChatMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({ url: "/chat/send", method: "POST", body }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: ["Chat"],
    }),

    confirmGoal: builder.mutation<ChatResponse, { chatId: string; body: ConfirmGoalRequest }>({
      query: ({ chatId, body }) => ({
        url: `/chat/${chatId}/confirm-goal`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: ["Goals", "Chat"],
    }),

    listChats: builder.query<ChatListItem[], string>({
      query: (statementId) => ({
        url: `/chat/list?statementId=${statementId}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Chat"],
    }),

    getChatHistory: builder.query<ChatMessageDto[], string>({
      query: (chatId) => ({ url: `/chat/${chatId}/history`, method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Chat"],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetStatementIdsQuery,
  useGetStatementsQuery,
  useGetStatementByIdQuery,
  useGetDashboardQuery,
  useGetTransactionsQuery,
  useGetRecurringChargesQuery,
  useUploadStatementMutation,
  useAnalyzeFinancialProfileMutation,
  useGetWeeklySpendQuery,
  useSendChatMessageMutation,
  useConfirmGoalMutation,
  useListChatsQuery,
  useGetChatHistoryQuery,
} = authApi;