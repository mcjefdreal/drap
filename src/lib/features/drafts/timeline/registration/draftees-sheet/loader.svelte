<script lang="ts" module>
  export interface Props {
    draftId: string;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Empty from '$lib/components/ui/empty';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import { createFetchDraftLateRegistrantsQuery } from '$lib/queries/fetch-draft-late-registrants';

  import DrafteesSheetContent from './content.svelte';

  const { draftId }: Props = $props();

  const drafteesQuery = $derived(createFetchDrafteesQuery(draftId));
  const lateQuery = $derived(createFetchDraftLateRegistrantsQuery(draftId));
</script>

{#if drafteesQuery.isPending || lateQuery.isPending}
  <Empty.Root>
    <Empty.Media>
      <Loader2Icon class="size-5 animate-spin text-muted-foreground" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title>Loading Draftees</Empty.Title>
      <Empty.Description>Fetching registered and late draftees.</Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else if drafteesQuery.isError || lateQuery.isError}
  <Empty.Root>
    <Empty.Media variant="icon">
      <UsersIcon class="size-5" />
    </Empty.Media>
    <Empty.Header>
      <Empty.Title class="text-destructive">Failed to Load Draftees</Empty.Title>
      <Empty.Description>Please try again in a moment.</Empty.Description>
    </Empty.Header>
  </Empty.Root>
{:else}
  <DrafteesSheetContent draftees={drafteesQuery.data} lateRegistrants={lateQuery.data} />
{/if}
