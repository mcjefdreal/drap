<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftFacultyChoicesQuery } from '$lib/queries/fetch-draft-faculty-choices';

  import Display, { type Props as DisplayProps } from './display.svelte';

  const { draftId, requestedAt }: Pick<DisplayProps, 'draftId' | 'requestedAt'> = $props();
  const query = $derived(createFetchDraftFacultyChoicesQuery(draftId));
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <Display {draftId} {requestedAt} data={query.data} />
{/if}
