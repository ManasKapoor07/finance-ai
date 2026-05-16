"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Loader2,
  Building2,
  LayoutGrid,
} from "lucide-react";

import { useGetStatementIdsQuery } from "../../redux/api/authApi";

interface StatementIdWithBank {
  id: string;
  bankName: string;
  periodFrom: string;
  periodTo: string;
}

const BANK_THEMES: Record<
  string,
  {
    from: string;
    to: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  HDFC: {
    from: "#004c8f",
    to: "#0070cc",
    bg: "#e8f1fb",
    text: "#004c8f",
    border: "#b3d1f5",
  },

  ICICI: {
    from: "#b5151b",
    to: "#e8292f",
    bg: "#fdeaea",
    text: "#b5151b",
    border: "#f5b3b5",
  },

  AXIS: {
    from: "#97144d",
    to: "#c41e68",
    bg: "#fce8f2",
    text: "#97144d",
    border: "#f0b3d1",
  },

  SBI: {
    from: "#2d6a2d",
    to: "#3d9e3d",
    bg: "#e8f5e8",
    text: "#2d6a2d",
    border: "#b3ddb3",
  },

  PNB: {
    from: "#e47200",
    to: "#f59e0b",
    bg: "#fef3e2",
    text: "#c25f00",
    border: "#fcd9a0",
  },

  OTHER: {
    from: "#4f46e5",
    to: "#7c3aed",
    bg: "#eef2ff",
    text: "#4338ca",
    border: "#c7d2fe",
  },
};

const getTheme = (bank: string) =>
  BANK_THEMES[bank?.toUpperCase()] ?? BANK_THEMES.OTHER;

const baseCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const formatRange = (from: string, to: string) => {
  const start = new Date(from);
  const end = new Date(to);

  return `${start.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} - ${end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
};

export default function StatementsPage() {
  const {
    data: statements = [],
    isLoading,
    isError,
  } = useGetStatementIdsQuery();

  const grouped: Record<string, StatementIdWithBank[]> = {};

  statements.forEach((s: StatementIdWithBank) => {
    const key = s.bankName?.toUpperCase() || "OTHER";

    grouped[key] = [...(grouped[key] ?? []), s];
  });

  const banks = Object.keys(grouped);
  const total = statements.length;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Loader2
              size={24}
              color="#fff"
              className="animate-spin"
            />
          </div>

          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            Loading statements...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: 24,
        }}
      >
        <div
          style={{
            ...baseCard,
            padding: "48px",
            textAlign: "center",
            maxWidth: 420,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <LayoutGrid size={28} color="#ef4444" />
          </div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Failed to load statements
          </h2>

          <p
            style={{
              fontSize: 14,
              color: "#64748b",
            }}
          >
            Something went wrong. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "42px 32px",
      }}
    >
      {/* Header */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
          marginBottom: 42,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#4f46e5",
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              borderRadius: 999,
              padding: "5px 12px",
              marginBottom: 14,
            }}
          >
            <Sparkles size={12} />
            AI Financial Workspace
          </span>

          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            Bank Statements
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#94a3b8",
            }}
          >
            Your uploaded statements organized beautifully
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Statements", value: total },
            { label: "Banks", value: banks.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                ...baseCard,
                padding: "14px 24px",
                textAlign: "center",
                minWidth: 100,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94a3b8",
                  marginBottom: 4,
                }}
              >
                {label}
              </p>

              <p
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}

      {!total && (
        <div
          style={{
            ...baseCard,
            padding: "80px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 22,
              background:
                "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <LayoutGrid size={30} color="#fff" />
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            No Statements Yet
          </h2>

          <p
            style={{
              fontSize: 14,
              color: "#94a3b8",
              maxWidth: 360,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Upload your first statement to unlock AI insights,
            spending analysis, and smart financial summaries.
          </p>
        </div>
      )}

      {/* Sections */}

      {banks.map((bank) => {
        const theme = getTheme(bank);
        const bankStatements = grouped[bank];

        return (
          <section
            key={bank}
            style={{ marginBottom: 44 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={18} color="#fff" />
              </div>

              <div>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {bank} Bank
                </h2>

                <p
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                  }}
                >
                  {bankStatements.length} statement
                  {bankStatements.length > 1 ? "s" : ""}
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(to right, #e2e8f0, transparent)",
                  marginLeft: 4,
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {bankStatements.map((statement, index) => (
                <StatementCard
                  key={statement.id}
                  statement={statement}
                  index={index}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StatementCard({
  statement,
  theme,
}: {
  statement: StatementIdWithBank;
  index: number;
  theme: ReturnType<typeof getTheme>;
}) {

  const period = formatRange(
    statement.periodFrom,
    statement.periodTo
  );

  return (
    <Link
      href={`/dashboard/${statement.id}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: `1px solid ${theme.border}`,
          padding: 20,
          cursor: "pointer",
          transition: "all 0.18s ease",
          minHeight: 185,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;

          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = `0 12px 34px ${theme.from}18`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;

          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* top */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 6px 18px ${theme.from}25`,
            }}
          >
            <Building2 size={19} color="#fff" />
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.text,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            Ready
          </span>
        </div>

        {/* content */}

        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 750,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {statement.bankName} Bank
          </h3>

          <p
            style={{
              marginTop: 7,
              fontSize: 13.5,
              color: "#64748b",
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {period}
          </p>
        </div>

        {/* footer */}

        <div
          style={{
            marginTop: 24,
            paddingTop: 14,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            Open dashboard
          </span>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowUpRight
              size={15}
              color={theme.text}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}