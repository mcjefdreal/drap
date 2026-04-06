<script lang="ts" module>
  import type { Student } from '$lib/features/drafts/types';

  export interface Props {
    draftees: Student[];
    lateRegistrants: Student[];
  }
</script>

<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
  import { SvelteMap } from 'svelte/reactivity';

  import * as Empty from '$lib/components/ui/empty';

  import DrafteesSheetTable from './table.svelte';

  const { draftees, lateRegistrants }: Props = $props();
  type StudentRecord = Props['draftees'][number];

  const students = $derived.by(() => {
    const lateIds = new Set(lateRegistrants.map(student => student.id));
    const studentsById = new SvelteMap<string, StudentRecord>();

    for (const student of draftees) studentsById.set(student.id, student);
    for (const student of lateRegistrants)
      if (!studentsById.has(student.id)) studentsById.set(student.id, student);

    return Array.from(studentsById.values()).map(student => ({
      ...student,
      isLate: lateIds.has(student.id),
    }));
  });
</script>

{#if students.length > 0}
  <DrafteesSheetTable {students} />
{:else}
  <Empty.Root>
    <Empty.Media variant="icon">
      <UsersIcon class="size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>No Draftees Yet</Empty.Title>
      <Empty.Description>
        Registered and late draftees will appear here once available.
      </Empty.Description>
    </Empty.Header>
  </Empty.Root>
{/if}
