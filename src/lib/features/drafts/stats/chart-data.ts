import { group, max, rollup, sort, sum, union } from 'd3-array';

import { CHART_COLORS } from '$lib/constants';
import type {
  DraftStatsChartDatum,
  DraftStatsMetricChartView,
  DraftStatsRecord,
} from '$lib/features/drafts/types';

export function getLocalYearBucket(date: Date) {
  return date.getFullYear();
}

function buildLabs(records: readonly DraftStatsRecord[]) {
  return Array.from(
    group(records, ({ labId }) => labId),
    ([id, rows], index) => {
      const [firstRow] = rows;
      if (typeof firstRow === 'undefined') throw new Error(`expected stats rows for lab ${id}`);

      return {
        id,
        name: firstRow.labName,
        legendLabel: id.toUpperCase(),
        color: CHART_COLORS[index % CHART_COLORS.length] ?? 'var(--chart-1)',
        isArchived: rows.some(({ archivedAt }) => archivedAt !== null),
      };
    },
  );
}

function buildYears(records: readonly DraftStatsRecord[]) {
  return sort(
    union(records.map(({ activePeriodStart }) => getLocalYearBucket(new Date(activePeriodStart)))),
  );
}

function buildAggregates(records: readonly DraftStatsRecord[]) {
  return rollup(
    records,
    rows => ({
      draftedStudents: sum(rows, ({ draftedStudents }) => draftedStudents),
    }),
    ({ activePeriodStart }) => getLocalYearBucket(new Date(activePeriodStart)),
    ({ labId }) => labId,
  );
}

function buildMetricChartView(
  labs: ReturnType<typeof buildLabs>,
  years: number[],
  aggregates: ReturnType<typeof buildAggregates>,
  metric: 'draftedStudents',
): DraftStatsMetricChartView {
  const data: DraftStatsChartDatum[] = years.map(year => {
    const point: DraftStatsChartDatum = { year };

    for (const lab of labs) point[lab.id] = aggregates.get(year)?.get(lab.id)?.[metric] ?? null;

    return point;
  });

  const maxValue =
    max(
      labs.flatMap(lab =>
        data.map(point => {
          const value = point[lab.id];
          if (typeof value === 'number') return value;
          return 0;
        }),
      ),
    ) ?? 0;

  return {
    config: Object.fromEntries(
      labs.map(lab => [lab.id, { label: lab.legendLabel, color: lab.color }]),
    ),
    series: labs.map(lab => ({
      key: lab.id,
      label: lab.legendLabel,
      color: lab.color,
    })),
    data,
    maxValue: Math.max(maxValue, 1),
  };
}

export function buildAssignedStatsChart(records: readonly DraftStatsRecord[]) {
  const labs = buildLabs(records);
  const years = buildYears(records);
  const aggregates = buildAggregates(records);
  return buildMetricChartView(labs, years, aggregates, 'draftedStudents');
}
