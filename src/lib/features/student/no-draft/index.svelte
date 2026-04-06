<script lang="ts">
  import CalendarIcon from '@lucide/svelte/icons/calendar';

  import Empty from '$lib/components/empty.svelte';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
</script>

<Empty>
  {#snippet icon()}
    <CalendarIcon class="size-12 text-muted-foreground" />
  {/snippet}
  {#snippet title()}No Active Draft{/snippet}
  {#snippet description()}
    There's no draft currently open for registration. Check back later when the next draft period
    begins.
  {/snippet}
  <Button href={resolve('/history/')}>View Draft History</Button>
</Empty>
