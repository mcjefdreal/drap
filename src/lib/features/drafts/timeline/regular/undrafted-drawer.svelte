<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Drawer from '$lib/components/ui/drawer';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import Empty from '$lib/components/empty.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import type { Lab } from '$lib/features/drafts/types';

  interface Props {
    draftId: string;
    round: number;
    labs: Lab[];
  }

  const { draftId, round, labs }: Props = $props();

  let selectedLabIds = $state<string[]>([]);

  const query = $derived(
    createFetchDrafteesQuery(draftId, students => students.filter(({ labId }) => labId === null)),
  );

  const selectedLabSet = $derived(new Set(selectedLabIds));

  const selectedLabLabel = $derived.by(() => {
    if (selectedLabIds.length === 0) return 'Select labs';
    if (selectedLabIds.length === 1) {
      const [labId] = selectedLabIds;
      if (typeof labId !== 'string') return 'Select labs';
      const selectedLab = labs.find(lab => lab.id === labId);
      return selectedLab?.name ?? labId.toUpperCase();
    }
    return `${selectedLabIds.length} labs selected`;
  });

  const preferredStudents = $derived.by(() => {
    if (query.isPending || query.isError || selectedLabSet.size === 0) return [];

    return query.data
      .filter(student => {
        const selectedLab = student.labs[round - 1];
        return typeof selectedLab === 'string' && selectedLabSet.has(selectedLab);
      })
      .sort((left, right) => {
        const familyOrder = left.familyName.localeCompare(right.familyName);
        if (familyOrder !== 0) return familyOrder;
        return left.givenName.localeCompare(right.givenName);
      });
  });

  const interestedStudents = $derived.by(() => {
    if (query.isPending || query.isError || selectedLabSet.size === 0) return [];

    return query.data
      .filter(student => student.labs.slice(round).some(labId => selectedLabSet.has(labId)))
      .sort((left, right) => {
        const familyOrder = left.familyName.localeCompare(right.familyName);
        if (familyOrder !== 0) return familyOrder;
        return left.givenName.localeCompare(right.givenName);
      });
  });
</script>

<Drawer.Root direction="bottom">
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" size="sm" {...props}>
        <span>View Undrafted</span>
      </Button>
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content class="flex min-h-dvh flex-col gap-4 overflow-hidden p-4 md:min-h-[50vh]">
    <Drawer.Header class="shrink-0 p-0">
      <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <Drawer.Title>Undrafted Students</Drawer.Title>
          <Drawer.Description>
            Filter by lab to view who selected it this round or in upcoming rounds.
          </Drawer.Description>
        </div>
        <p class="text-sm text-muted-foreground">Current round: {round}</p>
      </div>
    </Drawer.Header>

    <div class="shrink-0">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button variant="outline" class="w-full justify-between md:w-auto" {...props}>
              <span>{selectedLabLabel}</span>
              <ChevronDownIcon class="size-4 text-muted-foreground" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="min-w-56">
          <DropdownMenu.Item
            disabled={selectedLabIds.length === 0}
            onclick={() => {
              selectedLabIds = [];
            }}
          >
            Clear Selection
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.CheckboxGroup
            value={selectedLabIds}
            onValueChange={value => {
              selectedLabIds = [...value];
            }}
          >
            {#each labs as lab (lab.id)}
              <DropdownMenu.CheckboxItem value={lab.id}>
                <span class="uppercase">{lab.id}</span>
                <span class="ml-auto text-xs text-muted-foreground">{lab.name}</span>
              </DropdownMenu.CheckboxItem>
            {/each}
          </DropdownMenu.CheckboxGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    {#if query.isPending}
      <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
        {#snippet title()}Loading Draftees{/snippet}
        {#snippet description()}Fetching undrafted students...{/snippet}
      </Empty>
    {:else if query.isError}
      <Empty variant="destructive">
        {#snippet title()}Unable to Load Data{/snippet}
        {#snippet description()}Uh oh! An error has occurred.{/snippet}
      </Empty>
    {:else}
      <div class="min-h-0 grow overflow-auto">
        <div class="grid min-h-full gap-4 md:grid-cols-2">
          <section class="space-y-2">
            <h4 class="text-lg font-semibold">Preferred</h4>
            <p class="text-sm text-muted-foreground">Selected this round</p>
            <div class="space-y-2">
              {#if selectedLabIds.length === 0}
                <p class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Select at least one lab to view students.
                </p>
              {:else}
                {#each preferredStudents as student (student.id)}
                  <article class="flex items-center gap-3 rounded-md border bg-card p-3">
                    <Avatar.Root class="size-10">
                      <Avatar.Image
                        src={student.avatarUrl}
                        alt="{student.givenName} {student.familyName}"
                      />
                    </Avatar.Root>
                    <div class="min-w-0 grow">
                      <p class="truncate font-medium">{student.familyName}, {student.givenName}</p>
                      <p class="truncate text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    {#if student.studentNumber !== null}
                      <Badge variant="outline" class="font-mono text-xs">
                        {student.studentNumber.toString()}
                      </Badge>
                    {/if}
                  </article>
                {:else}
                  <p class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No students matched this filter.
                  </p>
                {/each}
              {/if}
            </div>
          </section>

          <section class="space-y-2">
            <h4 class="text-lg font-semibold">Interested</h4>
            <p class="text-sm text-muted-foreground">Selected in future rounds</p>
            <div class="space-y-2">
              {#if selectedLabIds.length === 0}
                <p class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Select at least one lab to view students.
                </p>
              {:else}
                {#each interestedStudents as student (student.id)}
                  <article class="flex items-center gap-3 rounded-md border bg-card p-3">
                    <Avatar.Root class="size-10">
                      <Avatar.Image
                        src={student.avatarUrl}
                        alt="{student.givenName} {student.familyName}"
                      />
                    </Avatar.Root>
                    <div class="min-w-0 grow">
                      <p class="truncate font-medium">{student.familyName}, {student.givenName}</p>
                      <p class="truncate text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    {#if student.studentNumber !== null}
                      <Badge variant="outline" class="font-mono text-xs">
                        {student.studentNumber.toString()}
                      </Badge>
                    {/if}
                  </article>
                {:else}
                  <p class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No students matched this filter.
                  </p>
                {/each}
              {/if}
            </div>
          </section>
        </div>
      </div>
    {/if}
  </Drawer.Content>
</Drawer.Root>
