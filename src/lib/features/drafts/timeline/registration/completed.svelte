<script lang="ts">
  import LateRegistrants from '$lib/features/drafts/draftees/late-registrants/index.svelte';
  import RegisteredDraftees from '$lib/features/drafts/draftees/registered/index.svelte';

  interface Props {
    draftId: string;
    studentCount: number;
    lateRegistrantsCount: number;
  }

  const { draftId, studentCount, lateRegistrantsCount }: Props = $props();
</script>

<div class="space-y-4">
  <div class="prose dark:prose-invert">
    <p>
      <strong>{studentCount}</strong> students registered for this draft.
    </p>
  </div>
  <div class="flex items-center justify-center">
    <RegisteredDraftees {draftId} variant="primary">No students have registered.</RegisteredDraftees
    >
  </div>
  <div class="prose dark:prose-invert">
    <p>
      <strong>{lateRegistrantsCount}</strong> students registered for this draft after registration closed.
    </p>
  </div>
  <div class="flex items-center justify-center">
    <LateRegistrants {draftId} variant="accent">No late registrants.</LateRegistrants>
  </div>
</div>
