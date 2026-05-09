import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    signup: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    // GET /api/v1/statements
    getStatements: builder.query<any, void>({
      query: () => ({
        url: "/statements",
        method: "GET",
      }),
    }),

    // GET /api/v1/statements/:id
    getStatementById: builder.query<any, string>({
      query: (id) => ({
        url: `/statements/${id}`,
        method: "GET",
      }),
    }),

    uploadStatement: builder.mutation<void, { file: File; password?: string }>({
      query: ({ file, password }) => {
        const formData = new FormData();
        formData.append("file", file);
        // Only append password if provided — backend checks if present
        if (password) formData.append("password", password);
        return {
          url: "/statements/upload",
          method: "POST",
          body: formData,
        };
      },
    }),

  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetStatementsQuery,
  useGetStatementByIdQuery,
  useUploadStatementMutation,
} = authApi;