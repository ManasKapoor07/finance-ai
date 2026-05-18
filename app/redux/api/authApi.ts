import { baseApi } from "./baseApi";

export interface StatementIdWithBank {
  id: string;
  bankName: string;
  periodFrom?: string;
  periodTo?: string;
}
export interface MoneyPersonality {
  archetype: string;
  description: string;
  trait: string;
}
 
export interface SpendingPulse {
  status: "STABLE" | "UNSTABLE" | "FAIR";
  summary: string;
  stabilityScore: number;  // 0–100, maps to the score ring
}
 
export interface ProjectionCard {
  headline: string;
  impact: string;
  timeframe: string;
  type: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}
 
export interface BehavioralSignal {
  label: string;
  observation: string;
  emotion: string;
  intensity: number;  // 0–10
}
 
export interface HiddenPattern {
  title: string;
  insight: string;
  category: string;
}
 
export interface AIAnalysisResponse {
  summary: string;
  moneyPersonality: MoneyPersonality;
  spendingPulse: SpendingPulse;
  risks: string[];
  positiveHabits: string[];
  recommendations: string[];
  nextActions: string[];
  projections: ProjectionCard[];
  behavioralSignals: BehavioralSignal[];
  hiddenPatterns: HiddenPattern[];
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

export interface MonthlyOverviewItem {
  month: string;
  debit: number;
  credit: number;
}

export interface TransactionDto {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  balance: number | null;
  category: string | null;
  subCategory: string | null;
}

export interface DashboardSummaryDto {
  totalBalance: number;
  totalSpending: number;
  totalIncome: number;
  savings: number;
  balanceChangePercent: number;
  spendingChangePercent: number;
  incomeChangePercent: number;
  monthlyOverview: MonthlyOverviewItem[];
  spendingByCategory: Record<string, number>;
  recentTransactions: TransactionDto[];
}

export interface PagedTransactionResponse {
  content: TransactionDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface StatementDetailDto {
  id: string;
  bankName: string;
  periodFrom?: string;
  periodTo?: string;
  uploadedAt?: string;
  transactionCount?: number;
  totalDebit?: number;
  totalCredit?: number;
}

/** Matches actual API response shape */
export interface RecurringChargeDto {
  merchant: string;
  rawDescription: string;
  avgAmount: number;
  totalSpent: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  category: string | null;
  variancePct: number;
  estimatedMonthly: number;
  estimatedAnnual: number;
}

export interface TransactionQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  dir?: "asc" | "desc";
  type?: "DEBIT" | "CREDIT";
  category?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Auth ──────────────────────────────────────────────────────────────────
    signup: builder.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),

    // ── Statements ────────────────────────────────────────────────────────────
    getStatementIds: builder.query<StatementIdWithBank[], void>({
      query: () => ({ url: "/statements/ids", method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Dashboard"],
    }),
    getStatements: builder.query<StatementDetailDto[], void>({
      query: () => ({ url: "/statements", method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Dashboard"],
    }),
    getStatementById: builder.query<StatementDetailDto, string>({
      query: (id) => ({ url: `/statements/${id}`, method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
    }),
    uploadStatement: builder.mutation<any, { file: File; password?: string; bankName?: string }>({
      query: ({ file, password, bankName }) => {
        const form = new FormData();
        form.append("file", file);
        if (password) form.append("password", password);
        if (bankName) form.append("bankName", bankName);
        return { url: "/statements/upload", method: "POST", body: form };
      },
      invalidatesTags: ["Dashboard"],
    }),

    // ── Dashboard ─────────────────────────────────────────────────────────────
    getDashboard: builder.query<DashboardSummaryDto, void>({
      query: () => ({ url: "/dashboard", method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Dashboard"],
      keepUnusedDataFor: 300,
    }),
    getStatementDashboard: builder.query<DashboardSummaryDto, string>({
      query: (statementId) => ({ url: `/dashboard?statementId=${statementId}`, method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Dashboard"],
    }),

    // ── Transactions ──────────────────────────────────────────────────────────
    getTransactions: builder.query<PagedTransactionResponse, TransactionQueryParams>({
      query: ({ page = 0, size = 20, sort = "date", dir = "desc", type, category } = {}) => {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort, dir });
        if (type) params.append("type", type);
        if (category) params.append("category", category);
        return { url: `/transactions?${params}`, method: "GET" };
      },
      transformResponse: (response: any) => response.data ?? response,
    }),

    // ── Weekly Spend ──────────────────────────────────────────────────────────
    getWeeklySpend: builder.query<{ data: WeeklySpendItem[] }, void>({
      query: () => ({ url: "/weekly-spend", method: "GET" }),
      transformResponse: (response: any) => ({ data: response.data ?? [] }),
      keepUnusedDataFor: 300,
    }),

    // ── Recurring Charges ─────────────────────────────────────────────────────
    getRecurringCharges: builder.query<RecurringChargeDto[], void>({
      query: () => ({ url: "/recurring", method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
    }),

    // ── Financial Profile ─────────────────────────────────────────────────────
    analyzeFinancialProfile: builder.mutation<any, string>({
      query: (statementId) => ({ url: `/financial-profiles/${statementId}/analyze`, method: "POST" }),
    }),

    // ── Chat ──────────────────────────────────────────────────────────────────
    sendChatMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({ url: "/chat/send", method: "POST", body }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: ["Chat"],
    }),
    confirmGoal: builder.mutation<ChatResponse, { chatId: string; body: ConfirmGoalRequest }>({
      query: ({ chatId, body }) => ({ url: `/chat/${chatId}/confirm-goal`, method: "POST", body }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: ["Goals", "Chat"],
    }),
    listChats: builder.query<ChatListItem[], string>({
      query: (statementId) => ({ url: `/chat/list?statementId=${statementId}`, method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Chat"],
    }),
    getChatHistory: builder.query<ChatMessageDto[], string>({
      query: (chatId) => ({ url: `/chat/${chatId}/history`, method: "GET" }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ["Chat"],
    }),

    getAIAnalysis: builder.query<AIAnalysisResponse, void>({
        query: () => "/ai/analysis",
        providesTags: ["AIAnalysis"],
}),
 
      refreshAIAnalysis: builder.mutation<AIAnalysisResponse, void>({
        query: () => ({ url: "/ai/analysis/refresh", method: "POST" }),
        invalidatesTags: ["AIAnalysis"],
      }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetStatementIdsQuery,
  useGetStatementsQuery,
  useGetStatementByIdQuery,
  useUploadStatementMutation,
  useGetDashboardQuery,
  useGetStatementDashboardQuery,
  useGetTransactionsQuery,
  useGetWeeklySpendQuery,
  useGetRecurringChargesQuery,
  useAnalyzeFinancialProfileMutation,
  useSendChatMessageMutation,
  useConfirmGoalMutation,
  useListChatsQuery,
  useRefreshAIAnalysisMutation,
  useGetAIAnalysisQuery,
  useGetChatHistoryQuery,
} = authApi;