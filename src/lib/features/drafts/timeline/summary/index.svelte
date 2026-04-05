<script lang="ts">
  import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import DraftAssignments from '$lib/features/drafts/assignments/index.svelte';
  import type {
    Draft,
    DraftAssignmentSummary,
    DraftSummaryChartData,
  } from '$lib/features/drafts/types';

  import DraftRoundsChart from './draft-rounds-chart.svelte';
  import LabDistributionChart from './lab-distribution-chart.svelte';
  import PreferenceAlignmentChart from './preference-alignment-chart.svelte';
  import SupplyDemandChart from './supply-demand-chart.svelte';

  interface Props {
    draftId: string;
    draft: Pick<Draft, 'activePeriodStart' | 'activePeriodEnd' | 'maxRounds'>;
    totalStudents: number;
    assignmentSummary: DraftAssignmentSummary;
    draftSummaryChartData: DraftSummaryChartData;
    isReview: boolean;
  }

  const {
    draftId,
    draft,
    totalStudents,
    assignmentSummary,
    draftSummaryChartData,
    isReview,
  }: Props = $props();
</script>

<div class="@container space-y-4">
  {#if isReview}
    <Alert.Root variant="warning">
      <SparklesIcon class="text-accent" />
      <Alert.Title>Draft Review</Alert.Title>
      <Alert.Description>
        Lottery assignments are complete. Review results below before finalizing.
      </Alert.Description>
    </Alert.Root>
  {:else}
    <Alert.Root variant="success">
      <CheckCircle2Icon class="text-success" />
      <Alert.Title>Draft Finalized</Alert.Title>
      <Alert.Description>
        This draft has been completed. All students have been assigned to their respective labs.
      </Alert.Description>
    </Alert.Root>
  {/if}
  <div class="flex flex-wrap gap-2">
    <Card.Root variant="soft" class="preset-tonal-muted max-w-56 min-w-40 flex-1 gap-2 py-4">
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-0">
        <Card.Title class="text-sm font-medium">Total Students</Card.Title>
        <UsersIcon class="size-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <p id="stat-total-students" class="text-2xl font-bold tabular-nums">{totalStudents}</p>
        <p class="text-xs text-muted-foreground">All Registered Participants</p>
      </Card.Content>
    </Card.Root>
    <Card.Root variant="soft" class="preset-tonal-muted max-w-56 min-w-40 flex-1 gap-2 py-4">
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-0">
        <Card.Title class="text-sm font-medium">Participating Labs</Card.Title>
        <FlaskConicalIcon class="size-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <p id="stat-participating-labs" class="text-2xl font-bold tabular-nums">
          {assignmentSummary.metrics.participatingLabCount}
        </p>
        <p class="text-xs text-muted-foreground">Active Labs in Draft</p>
      </Card.Content>
    </Card.Root>
  </div>
  <div class="space-y-4">
    <DraftRoundsChart chart={assignmentSummary.chart} />
    <SupplyDemandChart data={draftSummaryChartData.supplyVsDemand} />
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LabDistributionChart data={draftSummaryChartData.labDistribution} />
      <PreferenceAlignmentChart data={draftSummaryChartData.preferenceAlignment} />
    </div>
  </div>
  <DraftAssignments {draftId} maxRounds={draft.maxRounds} />
</div>
