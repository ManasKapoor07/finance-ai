"use client";

import {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  DollarSign,
  Target,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const topNav = [
    // {
    //   label: "Dashboard",
    //   icon: LayoutDashboard,
    //   href: "/dashboard",
    // },
    {
      label: "Statements",
      icon: CreditCard,
      href: "/dashboard/statements",
    },
    {
      label: "Message",
      icon: MessageSquare,
      href: "/dashboard/message",
    },
    // {
    //   label: "Payment",
    //   icon: DollarSign,
    //   href: "/dashboard/payment",
    // },
    {
      label: "Goals",
      icon: Target,
      href: "/dashboard/goals",
    },
    // {
    //   label: "Investment",
    //   icon: TrendingUp,
    //   href: "/dashboard/investment",
    // },
    // {
    //   label: "Settings",
    //   icon: Settings,
    //   href: "/dashboard/settings",
    // },
  ];

  const bottomNav = [
    { label: "Support", icon: HelpCircle },
    { label: "Log Out", icon: LogOut },
  ];

  return (
    <aside
      style={{
        width: "220px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #f5f5f5",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "9px",
            background: "linear-gradient(135deg,#4f6ef7,#7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          M
        </div>

        <span
          style={{
            fontWeight: 800,
            fontSize: "15px",
          }}
        >
          MoneyLens
        </span>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {topNav.map(({ label, icon: Icon, href }) => {
          // Exact match for dashboard root, startsWith for sub-routes
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : href
              ? pathname.startsWith(href)
              : false;

          return (
            <button
              key={label}
              onClick={() => href && router.push(href)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "none",
                cursor: href ? "pointer" : "default",
                background: active ? "#4f6ef7" : "transparent",
                color: active ? "#fff" : "#6b7280",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#f5f7ff";
                  (e.currentTarget as HTMLButtonElement).style.color = "#4f6ef7";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
                }
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #f5f5f5",
        }}
      >
        {bottomNav.map(({ label, icon: Icon }) => (
          <button
            key={label}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: "13px",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
              (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}