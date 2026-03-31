<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import * as Card from '$lib/components/ui/card';
  import DraftedDraftees from '$lib/features/drafts/draftees/drafted/index.svelte';
  import { createFetchDraftAssignmentsQuery } from '$lib/queries/fetch-draft-assignments';
  import { Empty } from '$lib/components/ui/empty';

  import FinalizeForm from './finalize-form.svelte';

  interface Props {
    draftId: string;
    isReview: boolean;
  }

  const { draftId, isReview }: Props = $props();

  const query = $derived(createFetchDraftAssignmentsQuery(draftId, assignments => (assignments.filter(({ round }) => (round === null)))));
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else}
  <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
    <div class="prose max-w-none dark:prose-invert">
      <h3>{isReview ? 'Review Phase' : 'Lottery Phase'}</h3>
      {#if isReview}
        <p>
          Lottery assignment has completed. <strong>{query.data.length}</strong> students were assigned
          during randomization.
        </p>
        <p>
          Review the results below. When ready, finalize to dispatch emails and synchronize official
          student lab assignments.
        </p>
        <FinalizeForm {draftId} />
      {:else}
        <p>
          The lottery phase has completed. <strong>{query.data.length}</strong> students were assigned
          during final lottery randomization.
        </p>
      {/if}
    </div>
    <div class="min-w-0 space-y-2">
      <Card.Root variant="soft">
        <Card.Header>
          <Card.Title>
            {isReview ? 'Lottery Results' : 'Eligible for Lottery'} ({query.data.length})
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <p class="prose max-w-none dark:prose-invert">
            {query.data.length} students were assigned via lottery.
          </p>
        </Card.Content>
      </Card.Root>
      <div class="flex justify-center">
        <DraftedDraftees {draftId} />
      </div>
    </div>
  </div>
{/if}
