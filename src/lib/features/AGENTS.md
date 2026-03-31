# Feature Module Conventions

Feature modules live in `$lib/features/<feature>/`. The main pattern is to wrap related resources and actions within a feature namespace such that implementing new logic or searching existing logic is a simple end-to-end depth-first traversal of the project structure (requiring minimal hopping between sibling subsystems).

## Component Types

### Orchestrator (`*/index.svelte`)

- Conditional rendering based on state
- Imports child components and forwards props
- **Prefer nested conditionals** when deriving UI from state machine conditions

Example (draft state machine uses nested conditionals):

```svelte
{#if draft.activePeriodEnd !== null}
  <!-- Finalized state -->
  <SummaryPhase {draft} />
{:else if draft.currRound === null}
  <!-- Review state (lottery already ran) -->
  <LotteryPhase {draft} />
{:else if draft.currRound === 0}
  <!-- Registration state -->
  <RegistrationPhase {draft} />
{:else if draft.currRound > draft.maxRounds}
  <!-- Intervention / lottery setup state -->
  <LotteryPhase {draft} />
{:else}
  <!-- Regular rounds state -->
  <RegularPhase {draft} />
{/if}
```

### Form (`*-form.svelte`)

- Self-contained with `use:enhance`
- Absolute action paths (e.g., `/dashboard/drafts/{draftId}/?/start`)
- Runtime assertions over non-null assertions

### Presentation

- Display-only, receives data via props
- Uses `$derived` for computed values

### Dialog Wrapper (`*-dialog.svelte`)

- Wraps a form or query-backed component behind a dialog trigger
- Prefer relying on the primitive's default presence/lazy-mount behavior
- Parent forwards props to child content

### Drawer Wrapper (`*/index.svelte` or `*-drawer.svelte`)

- Wraps on-demand content behind a drawer trigger
- Prefer relying on the drawer/dialog primitive's default presence/lazy-mount behavior
- Only add local `{#if open}` gating when the primitive does not lazy-mount by default, or when the child has a separate lifecycle requirement

### Tabs / Always-Mounted Content

- `Tabs.Content` stays mounted by default in `bits-ui`
- Gate query-heavy or state-heavy tab panels explicitly when they should only initialize while active
- Prefer behavior like `{#if activeTab === '<id>'}` inside the tab content over changing the shared tabs wrapper

## Dialog Pattern

For dialogs containing forms, split into two components:

```
feature/
├── init-dialog.svelte   # Dialog wrapper (manages open state)
└── init-form.svelte     # Form content (mounted when dialog opens)
```

### Dialog Wrapper (`init-dialog.svelte`)

This component manages dialog composition and, when needed, open state for closing behavior. The underlying dialog primitive already lazy-mounts/presence-manages the content, so an extra `{#if open}` wrapper is usually unnecessary unless the child needs the `open` value for some other reason.

```svelte
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import InitForm, { type Props as FormProps } from './init-form.svelte';

  // Forward all props the child form needs
  type Props = FormProps;
  const props: Props = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]}>Create Draft</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Draft</Dialog.Title>
    </Dialog.Header>
    <!-- Dialog content is presence-managed by the primitive -->
    <InitForm {...props} />
  </Dialog.Content>
</Dialog.Root>
```

### Form Content (`init-form.svelte`)

This component manages all form or query state. It is kept separate so the wrapper can place it behind an on-demand surface. For dialogs and drawers, the primitive usually provides the lazy mount; for tabs, add an explicit gate in the orchestrator when the panel should not initialize while inactive.

```svelte
<script lang="ts" module>
  import type { schema } from '$lib/server/database/drizzle';

  export interface Props {
    labs: Pick<schema.Lab, 'id' | 'name'>[];
  }
</script>

<script lang="ts">
  import { enhance } from '$app/forms';

  const { labs }: Props = $props();
</script>

<form method="post" action="/dashboard/drafts/?/init" use:enhance>
  <!-- form fields -->
</form>
```

## Props Pattern

Use `Pick<schema.*, 'field1' | 'field2'>` for prop typing:

```ts
export interface Draft extends Pick<schema.Draft, 'id' | 'currRound' | 'maxRounds'> {
  activePeriodEnd: Date | null;
}

interface Props {
  draft: Draft;
  students: Student[];
}

const { draft, students }: Props = $props();
```

## Barrel Exports

Export components from `index.js` (or `index.ts` if type aliases are also exported):

```ts
// src/lib/features/drafts/index.js
export { default as DraftTimeline } from './index.svelte';
export { default as DraftTable } from './draft-table.svelte';
export { default as InitDialog } from './init-dialog.svelte';
```

## Form Action Paths

Always use absolute paths with explicit IDs:

```svelte
<form method="post" action="/dashboard/drafts/{draftId}/?/start">
  <input type="hidden" name="draft" value={draftId} />
</form>
```

## On-Demand Query Surfaces

- For drawers and dialogs, prefer relying on the primitive's presence/lazy-mount behavior instead of duplicating it with local `{#if open}` wrappers
- For tabs, explicitly gate query-heavy children because inactive `Tabs.Content` remains mounted
- Tests should assert request timing and visible behavior, not the presence of a specific local gating pattern

## Directory Namespacing

Prefer directory-based namespacing over filename prefixes:

**Prefer:**

```
table/
  active/
    index.svelte        # Table UI
    update-form.svelte  # Submit form (descriptive name)
    archive-form.svelte # Per-row action form
```

**Avoid:**

```
table/
  active.svelte
  active-update-form.svelte
  active-archive-form.svelte
```

## Import Paths

Within `$lib/features/*/`, always use:

- `./sibling.svelte` for same-directory imports
- `$lib/features/<feature>/path` for cross-directory imports
- **Never** use `../` parent traversal
