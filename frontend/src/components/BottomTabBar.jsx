import React from "react";
import { Users, Bell, Scale, UserCircle } from "lucide-react";

const TABS = [
  { id: "groups",   label: "Groups",   Icon: Users },
  { id: "activity", label: "Activity", Icon: Bell },
  { id: "balances", label: "Balances", Icon: Scale },
  { id: "profile",  label: "Profile",  Icon: UserCircle },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
  return (
    <nav
      aria-label="Main navigation"
      className="bottom-tab-bar fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t md:hidden"
      style={{
        background: "var(--tab-bar-bg)",
        borderColor: "var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        height: "calc(56px + env(safe-area-inset-bottom))",
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            aria-label={label}
            aria-selected={isActive}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-transform active:scale-90"
            style={{ color: isActive ? "var(--accent)" : "var(--text-tertiary)" }}
          >
            <div
              className="flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: isActive ? "var(--accent-light)" : "transparent",
                padding: isActive ? "4px 12px" : "4px 12px",
              }}
            >
              <Icon
                className="transition-all duration-200"
                style={{
                  width: isActive ? 22 : 20,
                  height: isActive ? 22 : 20,
                  strokeWidth: isActive ? 2.2 : 1.8,
                }}
              />
            </div>
            <span
              className="transition-all duration-200"
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
