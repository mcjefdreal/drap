<script lang="ts" module>
  import Display, { type ExternalProps as DisplayProps } from './display.svelte';

  export interface Props extends DisplayProps {
    draftId: string;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/ui/empty/empty.svelte';
  import { createFetchDraftAssignmentsQuery } from '$lib/queries/fetch-draft-assignments';

  const { draftId, ...displayProps }: Props = $props();
  const { maxRounds } = $derived(displayProps);

  const regularDraftedQuery = $derived(
    createFetchDraftAssignmentsQuery(draftId, assignments =>
      assignments.filter(({ round }) => round !== null && round > 0 && round <= maxRounds),
    ),
  );
  const interventionDraftedQuery = $derived(
    createFetchDraftAssignmentsQuery(draftId, assignments =>
      assignments.filter(({ round }) => round !== null && round === maxRounds + 1),
    ),
  );
  const lotteryDraftedQuery = $derived(
    createFetchDraftAssignmentsQuery(draftId, assignments =>
      assignments.filter(({ round }) => round === null),
    ),
  );
</script>

{#if regularDraftedQuery.isError || interventionDraftedQuery.isError || lotteryDraftedQuery.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else if regularDraftedQuery.isPending || interventionDraftedQuery.isPending || lotteryDraftedQuery.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else}
  <Display
    regularDrafted={regularDraftedQuery.data}
    interventionDrafted={interventionDraftedQuery.data}
    lotteryDrafted={lotteryDraftedQuery.data}
    {...displayProps}
  />
{/if}
