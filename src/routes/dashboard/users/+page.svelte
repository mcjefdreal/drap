<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import Faculty from '$lib/users/faculty.svelte';

  import AdminForm from './admin-form.svelte';
  import FacultyForm from './faculty-form.svelte';
  import InviteSheet from './invite-sheet.svelte';

  const { data } = $props();
  const { labs, faculty } = $derived(data);

  const { registeredAdmins = [], registeredHeads = [] } = $derived(
    Object.groupBy(faculty, ({ labName }) => {
      return labName === null ? 'registeredAdmins' : 'registeredHeads';
    }),
  );
</script>

<h2 class="mb-6 scroll-m-20 text-3xl font-semibold tracking-tight">Users</h2>
<Card.Root>
  <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
    <Card.Title class="text-2xl">Lab Heads</Card.Title>
    <InviteSheet type="heads">
      <FacultyForm {labs} />
    </InviteSheet>
  </Card.Header>
  <Card.Content>
    {#if registeredHeads.length === 0}
      <p class="text-sm text-muted-foreground">No registered users.</p>
    {:else}
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each registeredHeads as { id, ...head } (id)}
          <Faculty user={head} />
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
<Card.Root>
  <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
    <Card.Title class="text-2xl">Draft Administrators</Card.Title>
    <InviteSheet type="admins">
      <AdminForm />
    </InviteSheet>
  </Card.Header>
  <Card.Content>
    {#if registeredAdmins.length === 0}
      <p class="text-sm text-muted-foreground">No registered users.</p>
    {:else}
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each registeredAdmins as { id, ...head } (id)}
          <Faculty user={head} />
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
