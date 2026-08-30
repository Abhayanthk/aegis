"use client";

import { useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";

export function AuthWidget() {
  const [tab, setTab] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tab toggle */}
      <div className="flex items-center rounded-[var(--ds-rounded-lg)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] p-1 gap-0.5">
        <button
          type="button"
          onClick={() => setTab("sign-in")}
          className={`px-4 py-1.5 rounded-[var(--ds-rounded-md)] text-[13px] font-medium transition-all duration-150 ${
            tab === "sign-in"
              ? "bg-[var(--ds-surface-3)] text-[var(--ds-ink)] shadow-sm"
              : "text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)]"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setTab("sign-up")}
          className={`px-4 py-1.5 rounded-[var(--ds-rounded-md)] text-[13px] font-medium transition-all duration-150 ${
            tab === "sign-up"
              ? "bg-[var(--ds-surface-3)] text-[var(--ds-ink)] shadow-sm"
              : "text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)]"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Clerk widget */}
      <div className="w-full">
        {tab === "sign-in" ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl="/projects"
            signUpUrl="/?tab=sign-up"
          />
        ) : (
          <SignUp
            routing="hash"
            fallbackRedirectUrl="/projects"
            signInUrl="/?tab=sign-in"
          />
        )}
      </div>
    </div>
  );
}
