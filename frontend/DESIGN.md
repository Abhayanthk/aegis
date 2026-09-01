# Design System & Development Guidelines

## 1. Purpose

This document defines the design and development rules for the project.

The goal is to build a **consistent, polished, responsive interface** while keeping the codebase:

* Simple
* Reusable
* Maintainable
* Accessible
* Performant
* Free from unnecessary abstractions
* Consistent with `global.css`
* Based on the already-installed **Coss UI components**

> **Core principle:** Use existing design tokens and components before creating anything new.

---

# 2. Source of Truth

`global.css` is the **single source of truth for the visual design system**.

Do not introduce independent styling systems that conflict with it.

Before creating a component or page, check:

1. Existing CSS variables
2. Existing typography
3. Existing spacing
4. Existing colors
5. Existing radius values
6. Existing shadows
7. Existing component styles
8. Existing Coss UI components

Do not create new values when an existing token already solves the problem.

### Priority

Use styles in this order:

1. Existing Coss UI component
2. Existing project component
3. Existing CSS variable / design token
4. Tailwind utility classes
5. Small custom CSS only when genuinely necessary

---

# 3. Coss UI First

Coss UI components are already installed in the project and should be treated as the **primary component library**.

Before creating a basic UI element, check whether Coss UI already provides it.

Prefer existing components for:

* Buttons
* Inputs
* Textareas
* Selects
* Dialogs
* Drawers
* Dropdowns
* Tooltips
* Tabs
* Cards
* Badges
* Alerts
* Navigation
* Forms
* Command menus
* Tables
* Pagination
* Popovers
* Menus
* Accordions

### Example

Do not create:

```tsx
function CustomButton() {
  return (
    <button className="...">
      Submit
    </button>
  )
}
```

if the project already has a Coss UI `Button`.

Use:

```tsx
<Button>Submit</Button>
```

and customize it through the existing API when necessary.

---

# 4. Do Not Recreate Existing Components

Never create a component simply because a UI element appears more than once.

First determine whether:

* Coss UI already provides it
* An existing project component provides it
* A small composition of existing components solves it

Avoid creating wrappers that provide little or no additional value.

### Bad

```tsx
<PrimaryButton>
  <Button>
    Save
  </Button>
</PrimaryButton>
```

### Good

```tsx
<Button>Save</Button>
```

---

# 5. Avoid Repetitive Components

Do not create separate components for trivial visual differences.

### Avoid

```text
BlueButton.tsx
GreenButton.tsx
RedButton.tsx
SmallButton.tsx
LargeButton.tsx
```

Prefer a single reusable component with variants when a reusable abstraction is actually needed.

```tsx
<Button variant="outline" size="sm">
  Edit
</Button>
```

However, **do not create a custom component just to wrap one existing Coss UI component**.

---

# 6. Component Abstraction Rules

A component should exist when it provides meaningful value.

Create a component when at least one of these is true:

* It is reused across multiple pages
* It represents a meaningful UI pattern
* It contains non-trivial logic
* It improves readability of a complex page
* It has its own state or behavior
* It represents a domain-specific concept

Do not create a component for:

* A single `<div>`
* A single heading
* A single paragraph
* A simple icon + text combination
* A one-off layout
* A direct Coss UI wrapper with no additional behavior

### Prefer composition

Instead of creating:

```tsx
<CustomCard
  title="..."
  description="..."
  buttonText="..."
/>
```

when the layout is only used once, prefer composing existing components:

```tsx
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>

  <CardContent>
    ...
  </CardContent>

  <CardFooter>
    <Button>...</Button>
  </CardFooter>
</Card>
```

This keeps the implementation explicit and easy to modify.

---

# 7. Keep Components Small

Components should do one job.

Avoid large components containing:

* Layout
* Data fetching
* Complex state
* Form logic
* Animations
* Multiple unrelated UI sections

all in one file.

If a component becomes difficult to understand, extract the **meaningful** piece rather than splitting every few lines into tiny components.

### Good

```text
DashboardPage
├── DashboardHeader
├── StatsGrid
├── RecentActivity
└── ActivityTable
```

### Bad

```text
DashboardPage
├── DashboardTopDiv
├── DashboardTitleDiv
├── DashboardDescriptionDiv
├── DashboardButtonWrapper
├── DashboardButtonIcon
├── DashboardButtonText
...
```

---

# 8. Prefer Simple Code

Do not over-engineer basic UI.

Avoid unnecessary:

* Abstraction layers
* Utility functions
* Configuration objects
* Generic components
* Custom hooks
* Context providers
* State management
* Design-system wrappers

If 10 lines of straightforward JSX solve the problem, do not write 100 lines of abstraction.

> **Simple code is preferred over clever code.**

---

# 9. Styling

Use the project's existing design tokens from `global.css`.

Do not randomly introduce:

```css
#123456
#abcdef
14px
19px
27px
13px
```

when equivalent design tokens already exist.

Prefer:

```tsx
className="bg-background text-foreground"
```

over hard-coded colors.

Use semantic tokens wherever possible:

```text
background
foreground
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
accent
accent-foreground
destructive
border
input
ring
```

Use the exact tokens available in `global.css`.

---

# 10. Typography

Typography must follow the definitions established in `global.css`.

Do not introduce arbitrary font families or font sizes without a strong reason.

Use the project's typography scale consistently.

Recommended hierarchy:

```text
Display
↓
Heading
↓
Subheading
↓
Body
↓
Caption / Metadata
```

Typography should communicate hierarchy before decorative styling is added.

---

# 11. Spacing

Use consistent spacing based on the project's existing spacing system.

Prefer predictable spacing such as:

```tsx
gap-2
gap-4
gap-6
gap-8
```

rather than arbitrary values everywhere.

Avoid excessive spacing.

A polished interface usually benefits more from **consistent rhythm** than from large amounts of whitespace.

---

# 12. Layout

Use modern CSS layout primitives:

* Flexbox
* CSS Grid
* Container queries when appropriate
* Responsive utilities

Prefer:

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```

over complicated custom CSS unless the layout genuinely requires it.

Keep layouts responsive by default.

Do not design desktop first and attempt to repair mobile afterward.

---

# 13. Responsive Design

Every page must work across:

* Mobile
* Tablet
* Laptop
* Desktop
* Large screens

Use progressive enhancement.

Example:

```tsx
className="
  px-4
  sm:px-6
  lg:px-8
"
```

Avoid hard-coded widths that unnecessarily break smaller screens.

Prefer:

```tsx
max-w-7xl mx-auto
```

over:

```tsx
width: 1420px;
```

when a responsive container is appropriate.

---

# 14. Icons

Use the project's existing icon library.

Do not create SVG icons manually when an existing icon is available.

Icons should:

* Have consistent sizing
* Align with surrounding text
* Include accessible labels when they are interactive
* Not be used purely for decoration when they create visual clutter

Example:

```tsx
<Button size="icon" aria-label="Close">
  <X />
</Button>
```

---

# 15. Images

Images should always have meaningful `alt` text when they convey information.

Decorative images should use an empty alt attribute:

```tsx
alt=""
```

Use appropriate:

* Aspect ratios
* Object positioning
* Responsive sizing
* Loading behavior

Avoid unnecessary image transformations in CSS.

---

# 16. Accessibility

Accessibility is required, not optional.

Use semantic HTML wherever possible.

Prefer:

```tsx
<button>
```

over:

```tsx
<div onClick={...}>
```

Use:

* Proper heading hierarchy
* Labels for form controls
* Keyboard-accessible interactions
* Visible focus states
* Appropriate ARIA attributes when necessary
* Sufficient color contrast

Do not use ARIA as a replacement for semantic HTML.

---

# 17. Forms

Use existing Coss UI form-related components whenever available.

Forms should have:

* Clear labels
* Helpful descriptions
* Validation feedback
* Disabled/loading states
* Accessible error messages

Avoid manually rebuilding common form primitives.

---

# 18. States

Every interactive component should consider its relevant states.

At minimum, when applicable:

```text
Default
Hover
Focus
Active
Disabled
Loading
Error
Empty
```

Do not add elaborate animations to compensate for missing interaction states.

---

# 19. Animation

Animation should improve the experience, not distract from it.

Prefer subtle transitions for:

* Hover
* Focus
* Opening/closing
* Page transitions
* Element entrance

Avoid unnecessary animation on every element.

Do not add animation libraries for simple transitions that CSS can handle.

Use existing project animation utilities when available.

Respect reduced-motion preferences where appropriate.

---

# 20. Data and Logic

Keep UI components focused on UI.

Avoid putting large data-processing operations directly inside JSX.

Prefer:

```tsx
const filteredProjects = projects.filter(...)
```

before the return statement rather than deeply nested expressions inside JSX.

Do not introduce global state when local state is sufficient.

Use server-side data fetching where appropriate for Next.js.

---

# 21. Next.js Practices

Follow the existing Next.js architecture.

Use Server Components by default.

Only use:

```tsx
"use client";
```

when client-side functionality is actually required.

Client components are appropriate for:

* Interactive state
* Browser APIs
* Event-driven UI
* Client-side hooks
* Animations requiring client state

Do not mark entire pages as client components unnecessarily.

---

# 22. File Organization

Organize components by meaningful responsibility.

Example:

```text
components/
├── ui/
│   └── Coss UI components
│
├── layout/
│   ├── Header.tsx
│   └── Footer.tsx
│
├── navigation/
│   └── ...
│
└── sections/
    └── ...
```

Do not create deeply nested folder structures without a real organizational benefit.

---

# 23. Naming

Use clear and predictable names.

Good:

```text
Header
Footer
ProjectCard
ProjectGrid
ContactForm
NavigationMenu
```

Avoid:

```text
MainThing
Box
ThingWrapper
Section2
NewComponent
TempCard
```

Component names should describe what they represent, not how they are implemented.

---

# 24. Reusability vs Over-Abstraction

There is a difference between **reusable code** and **over-engineered code**.

### Reusable

```tsx
<ProjectCard project={project} />
```

when multiple pages use project cards.

### Over-engineered

```tsx
<UniversalContentRenderer
  type="card"
  variant="project"
  layout="responsive"
  theme="default"
  interactive
  animated
/>
```

when the project only needs one simple card.

Always choose the simplest abstraction that solves the current problem.

---

# 25. Avoid Premature Design Systems

Do not build a new design system on top of Coss UI.

The project already has:

* `global.css`
* Design tokens
* Coss UI
* Tailwind utilities

Use them.

Only introduce a new abstraction when a recurring problem demonstrates that it is necessary.

---

# 26. Avoid Magic Values

Avoid unexplained arbitrary values.

### Avoid

```tsx
className="mt-[37px] w-[863px] text-[19px]"
```

unless there is a specific design requirement.

Prefer existing tokens and responsive utilities.

If an arbitrary value is genuinely required, keep it local and document it only when the reason is not obvious.

---

# 27. Avoid Duplicate Logic

If the same logic appears multiple times, consider extracting it.

For example:

```tsx
const formatDate = ...
```

can be shared if several components need the same formatting.

But do not extract every repeated line automatically.

The goal is to remove **meaningful duplication**, not all textual repetition.

---

# 28. Error Handling

Errors should be:

* Understandable
* Recoverable where possible
* Visually consistent
* Accessible

Avoid exposing raw technical errors to users.

Use existing alert, toast, dialog, or form-error components where appropriate.

---

# 29. Loading States

Loading states should preserve the layout whenever possible.

Prefer skeletons or existing loading components rather than abruptly replacing the entire page.

Avoid unnecessary custom loaders.

Use the existing Coss UI patterns whenever available.

---

# 30. Empty States

Empty states should clearly explain:

1. What is empty
2. Why it may be empty
3. What the user can do next

Keep them concise.

Do not create a complicated empty-state component for a one-off page.

---

# 31. Code Quality Checklist

Before considering a component complete, check:

### Design

* [ ] Uses `global.css` design tokens
* [ ] Uses existing Coss UI components
* [ ] Does not introduce unnecessary colors
* [ ] Typography is consistent
* [ ] Spacing is consistent
* [ ] Responsive behavior works
* [ ] Dark/light theme works where applicable

### Code

* [ ] No unnecessary component wrappers
* [ ] No duplicated logic
* [ ] No unnecessary state
* [ ] No unnecessary `"use client"`
* [ ] No huge component files
* [ ] No unexplained magic values
* [ ] Names are meaningful
* [ ] Components have a clear responsibility

### Accessibility

* [ ] Semantic HTML is used
* [ ] Interactive elements are keyboard accessible
* [ ] Form controls have labels
* [ ] Images have appropriate alt text
* [ ] Focus states are preserved
* [ ] Color is not the only way information is communicated

### UX

* [ ] Hover states are intentional
* [ ] Focus states are visible
* [ ] Loading states exist where needed
* [ ] Error states exist where needed
* [ ] Empty states exist where needed
* [ ] Animations are purposeful

---

# 32. Decision Rule

When implementing any new UI, follow this order:

```text
Need a UI element
        ↓
Does Coss UI already provide it?
        ↓
      YES
        ↓
Use it directly
        ↓
      NO
        ↓
Does an existing project component solve it?
        ↓
      YES
        ↓
Reuse it
        ↓
      NO
        ↓
Can existing components be composed?
        ↓
      YES
        ↓
Compose them
        ↓
      NO
        ↓
Create the smallest meaningful component
```

---

# 33. Golden Rule

> **Do not write code that the project already has.**

Before adding a component, utility, style, hook, or abstraction, look for an existing solution.

The preferred implementation is:

**Coss UI → existing component → composition → small custom component → custom abstraction only when necessary.**

Keep the UI visually refined, but keep the implementation boring.

A simple 20-line component that is easy to understand is better than a clever 150-line abstraction that nobody wants to touch.

---

# 34. Final Standard

Every implementation should aim for:

**Consistent design + Coss UI + simple React/Next.js + minimal abstraction + accessible UX + maintainable code.**

The project should feel like **one coherent design system**, not a collection of independently designed pages.
