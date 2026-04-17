<script lang="ts">
  import { AreaChart } from 'layerchart';
  import { cubicOut } from 'svelte/easing';
  import { tickStep } from 'd3-array';
  import { format } from 'd3-format';
  import type { MotionOptions } from 'layerchart/utils/motion.svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { scalePoint } from 'd3-scale';

  import * as Card from '$lib/components/ui/card';
  import * as Chart from '$lib/components/ui/chart';
  import * as NativeSelect from '$lib/components/ui/native-select';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import type { DraftStatsChartData, DraftStatsSeries } from '$lib/features/drafts/types';

  interface Props {
    stats: Promise<DraftStatsChartData | null>;
    labs: { id: string; name: string }[];
  }

  const { stats, labs }: Props = $props();

  let quotaSelectedLabId = $state('');
  let draftedSelectedLabId = $state('');
  let chartData = $state<DraftStatsChartData | null>(null);

  $effect(() => {
    stats.then(data => {
      chartData = data;
    });
  });

  const { chartMotion, axisMotion } = $derived<{
    chartMotion: MotionOptions;
    axisMotion: MotionOptions;
  }>(
    prefersReducedMotion.current
      ? { chartMotion: 'none', axisMotion: 'none' }
      : {
          chartMotion: { type: 'tween', duration: 280, easing: cubicOut },
          axisMotion: { type: 'tween', duration: 220, easing: cubicOut },
        },
  );

  const quotaFilteredSeries = $derived.by(() => {
    if (!chartData) return [];
    if (quotaSelectedLabId === '') return chartData.quotaSeries;
    return chartData.quotaSeries.filter(s => s.labId === quotaSelectedLabId);
  });

  const draftedFilteredSeries = $derived.by(() => {
    if (!chartData) return [];
    if (draftedSelectedLabId === '') return chartData.draftedSeries;
    return chartData.draftedSeries.filter(s => s.labId === draftedSelectedLabId);
  });

  function buildWideData(series: DraftStatsSeries[], years: number[]) {
    return years.map((year, i) => {
      const point: Record<string, number | string> = { year };
      for (const s of series) {
        const p = s.points[i];
        point[s.labId] = p?.value ?? 0;
      }
      return point;
    });
  }

  const quotaChartData = $derived.by(() => {
    if (!chartData || quotaFilteredSeries.length === 0) return [];
    return buildWideData(quotaFilteredSeries, chartData.years);
  });

  const draftedChartData = $derived.by(() => {
    if (!chartData || draftedFilteredSeries.length === 0) return [];
    return buildWideData(draftedFilteredSeries, chartData.years);
  });

  const quotaConfig = $derived(() => {
    const config: Record<string, { label: string; color: string }> = {};
    for (const series of quotaFilteredSeries) {
      config[series.labId] = { label: series.labName, color: series.color };
    }
    return config;
  });

  const draftedConfig = $derived(() => {
    const config: Record<string, { label: string; color: string }> = {};
    for (const series of draftedFilteredSeries) {
      config[series.labId] = { label: series.labName, color: series.color };
    }
    return config;
  });

  const quotaMax = $derived.by(() => {
    let max = 0;
    for (const point of quotaChartData) {
      for (const series of quotaFilteredSeries) {
        const val = point[series.labId];
        if (typeof val === 'number' && val > max) max = val;
      }
    }
    return Math.max(max, 1);
  });

  const draftedMax = $derived.by(() => {
    let max = 0;
    for (const point of draftedChartData) {
      for (const series of draftedFilteredSeries) {
        const val = point[series.labId];
        if (typeof val === 'number' && val > max) max = val;
      }
    }
    return Math.max(max, 1);
  });

  const yTicksFn = (max: number) => {
    const step = Math.max(1, tickStep(0, max, 4));
    const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
    if (ticks.at(-1) !== max) ticks.push(max);
    return ticks;
  };

  const integerFormat = format('d');
  const yearFormat = format('d');

  function getSeriesProps(series: DraftStatsSeries[]) {
    return series.map(s => ({
      key: s.labId,
      label: s.labName,
      color: s.color,
    }));
  }
</script>

<Card.Root class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs">
  <Card.Header>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-1.5 lg:grow">
        <Card.Title>Lab Quota Through the Years</Card.Title>
        <Card.Description>
          Historical quota snapshots by lab. Lines stop when labs are archived.
        </Card.Description>
      </div>
      <NativeSelect.Root bind:value={quotaSelectedLabId} class="w-full bg-background/80 sm:w-auto lg:shrink-0">
        <NativeSelect.Option value="">All Labs</NativeSelect.Option>
        {#each labs as lab (lab.id)}
          <NativeSelect.Option value={lab.id}>{lab.name}</NativeSelect.Option>
        {/each}
      </NativeSelect.Root>
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    {#if !chartData}
      <div class="flex h-80 w-full items-center justify-center">
        <Skeleton class="h-full w-full" />
      </div>
    {:else if quotaChartData.length === 0}
      <div class="flex h-80 w-full items-center justify-center text-muted-foreground">
        No data available
      </div>
    {:else}
      <Chart.Container config={quotaConfig()} class="h-80 w-full">
        <AreaChart
          data={quotaChartData}
          x="year"
          xScale={scalePoint().padding(0)}
          padding={{ top: 8, right: 10, bottom: 50, left: 40 }}
          series={getSeriesProps(quotaFilteredSeries)}
          legend={true}
          points
          grid
          yDomain={[0, quotaMax]}
          props={{
            area: { fillOpacity: 0.15, motion: chartMotion },
            points: { r: 4, class: 'fill-current' },
            tooltip: { context: { mode: 'band' } },
            xAxis: { grid: false, format: yearFormat, motion: axisMotion, tickLabelProps: { dy: 8 } },
            yAxis: { ticks: yTicksFn(quotaMax), format: integerFormat, motion: axisMotion, tickLabelProps: { dx: -8 } },
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip indicator="dot" />
          {/snippet}
        </AreaChart>
      </Chart.Container>
    {/if}
  </Card.Content>
</Card.Root>

<Card.Root class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs">
  <Card.Header>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-1.5 lg:grow">
        <Card.Title>Drafted Students Through the Years</Card.Title>
        <Card.Description>
          Number of students drafted per lab over time.
        </Card.Description>
      </div>
      <NativeSelect.Root bind:value={draftedSelectedLabId} class="w-full bg-background/80 sm:w-auto lg:shrink-0">
        <NativeSelect.Option value="">All Labs</NativeSelect.Option>
        {#each labs as lab (lab.id)}
          <NativeSelect.Option value={lab.id}>{lab.name}</NativeSelect.Option>
        {/each}
      </NativeSelect.Root>
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    {#if !chartData}
      <div class="flex h-80 w-full items-center justify-center">
        <Skeleton class="h-full w-full" />
      </div>
    {:else if draftedChartData.length === 0}
      <div class="flex h-80 w-full items-center justify-center text-muted-foreground">
        No data available
      </div>
    {:else}
      <Chart.Container config={draftedConfig()} class="h-80 w-full">
        <AreaChart
          data={draftedChartData}
          x="year"
          xScale={scalePoint().padding(0)}
          padding={{ top: 8, right: 10, bottom: 50, left: 40 }}
          series={getSeriesProps(draftedFilteredSeries)}
          legend={true}
          points
          grid
          yDomain={[0, draftedMax]}
          props={{
            area: { fillOpacity: 0.15, motion: chartMotion },
            points: { r: 4, class: 'fill-current' },
            tooltip: { context: { mode: 'band' } },
            xAxis: { grid: false, format: yearFormat, motion: axisMotion, tickLabelProps: { dy: 8 } },
            yAxis: { ticks: yTicksFn(draftedMax), format: integerFormat, motion: axisMotion, tickLabelProps: { dx: -8 } },
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip indicator="dot" />
          {/snippet}
        </AreaChart>
      </Chart.Container>
    {/if}
  </Card.Content>
</Card.Root>