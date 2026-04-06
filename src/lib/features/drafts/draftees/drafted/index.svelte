<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props } from './loader.svelte';

  const loaderProps: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      {#if typeof loaderProps.lab === 'undefined'}
        <Button variant="outline" class="border-primary text-primary" {...props}
          >Already Drafted</Button
        >
      {:else}
        <Button
          variant="outline"
          class="h-fit border-primary bg-primary/10 font-mono text-xs uppercase"
          {...props}>Members</Button
        >
      {/if}
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>
        {#if typeof loaderProps.lab === 'undefined'}
          Already Drafted
        {:else}
          Lab Members
        {/if}
      </Sheet.Title>
      <Sheet.Description>Review students who have already been assigned.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {...loaderProps} />
    </div>
  </Sheet.Content>
</Sheet.Root>
