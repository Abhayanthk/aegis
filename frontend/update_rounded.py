import re
import glob

# 1. Update pull-requests/page.tsx
pr_file = "app/(dashboard)/pull-requests/page.tsx"
with open(pr_file, "r") as f:
    pr_content = f.read()

# Replace rounded-[var(--ds-rounded-md)] with rounded-[var(--ds-rounded-xl)] 
# ONLY on lines that have border-[var(--ds-hairline)] bg-[var(--ds-canvas)]
lines = pr_content.split("\n")
for i, line in enumerate(lines):
    if "border-[var(--ds-hairline)]" in line and "bg-[var(--ds-canvas)]" in line and "overflow-hidden" in line or "py-20" in line:
        lines[i] = line.replace("rounded-[var(--ds-rounded-md)]", "rounded-[var(--ds-rounded-xl)]")
        
with open(pr_file, "w") as f:
    f.write("\n".join(lines))

# 2. Update github/page.tsx
gh_file = "app/(dashboard)/github/page.tsx"
with open(gh_file, "r") as f:
    gh_content = f.read()

lines = gh_content.split("\n")
for i, line in enumerate(lines):
    if "border border-[var(--ds-hairline)]" in line and ("bg-[var(--ds-canvas)]" in line or "bg-[var(--ds-surface-2)]" in line) and "h-10 w-10" not in line:
        lines[i] = line.replace("rounded-[var(--ds-rounded-md)]", "rounded-[var(--ds-rounded-xl)]")

with open(gh_file, "w") as f:
    f.write("\n".join(lines))

# 3. Update _components/projects/project-card.tsx
pc_file = "app/(dashboard)/_components/projects/project-card.tsx"
with open(pc_file, "r") as f:
    pc_content = f.read()

pc_content = pc_content.replace("rounded-[8px]", "rounded-[var(--ds-rounded-xl)]")
with open(pc_file, "w") as f:
    f.write(pc_content)

print("Updates completed successfully.")
