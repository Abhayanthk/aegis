"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    className={className}
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const MOCK_REPOS = [
  { name: "stage", fullName: "aryanpatel99/stage", date: "Aug 23" },
  { name: "ci-cd-test", fullName: "aryanpatel99/ci-cd-test", date: "Aug 21" },
  { name: "TIL", fullName: "aryanpatel99/TIL", date: "Aug 20" },
  { name: "karta", fullName: "aryanpatel99/karta", date: "Aug 14" },
  { name: "VengeanceUI", fullName: "aryanpatel99/VengeanceUI", date: "Jul 27" },
];

export function AddProjectFlow() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Track which repo is currently importing
  const [importingRepo, setImportingRepo] = useState<string | null>(null);

  const filteredRepos = MOCK_REPOS.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImport = async (repoName: string) => {
    setImportingRepo(repoName);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect after "importing"
    router.push("/projects");
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* GitHub Account Dropdown */}
        <button className="flex-1 flex items-center justify-between h-10 px-3.5 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] transition-colors text-[14px]">
          <div className="flex items-center gap-3">
            <GithubIcon className="h-4 w-4 text-[var(--ds-ink)]" />
            <span className="font-medium text-[var(--ds-ink)]">aryanpatel99</span>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--ds-ink-tertiary)]" />
        </button>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-ink-tertiary)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="pl-10 h-10 text-[14px] border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] focus-visible:ring-1 focus-visible:ring-[var(--ds-primary)]/40 transition-colors placeholder:text-[var(--ds-ink-tertiary)]"
          />
        </div>
      </div>

      {/* Repository List Container */}
      <div className="flex flex-col rounded-[var(--ds-rounded-lg)] border border-[var(--ds-hairline)] bg-black overflow-hidden">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <div
              key={repo.fullName}
              className="flex items-center justify-between p-4 border-b border-[var(--ds-hairline)] last:border-b-0 hover:bg-[var(--ds-surface-1)] transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Repo Icon (Placeholder N) */}
                <div className="flex items-center justify-center h-8 w-8 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] shrink-0">
                  <span className="text-[12px] font-medium text-[var(--ds-ink)]">N</span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-[14px] font-medium text-[var(--ds-ink)] tracking-tight">
                    {repo.name}
                  </span>
                  <span className="text-[13px] text-[var(--ds-ink-subtle)]">
                    · {repo.date}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleImport(repo.fullName)}
                disabled={importingRepo === repo.fullName}
                className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0"
              >
                {importingRepo === repo.fullName ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Import"
                )}
              </Button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-[13px] text-[var(--ds-ink-subtle)]">
            No repositories found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
