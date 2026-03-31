<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import { DraftTimeline } from '$lib/features/drafts';

  const { data } = $props();

  // Make new TanStack query client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnMount: false,
      },
    },
  });
</script>

<QueryClientProvider client={queryClient}>
  <DraftTimeline {...data} />
</QueryClientProvider>
