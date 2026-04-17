import { index, rollup, sum as d3sum } from 'd3-array';
import { CHART_COLORS } from '$lib/constants';
import type { DraftStatsChartData, DraftStatsSeries, DraftStatsYear } from '$lib/features/drafts/types';

export function buildDraftStatsChartData(
  stats: DraftStatsYear[],
  labs: { id: string; name: string }[],
): DraftStatsChartData {
  const years = [...new Set(stats.map(s => s.year))].sort();

  const quotaSeries = buildSeries(stats, years, labs, 'quota');
  const draftedSeries = buildSeries(stats, years, labs, 'draftedStudents');

  return {
    years,
    series: quotaSeries,
    quotaSeries,
    draftedSeries,
  };
}

function buildSeries(
  stats: DraftStatsYear[],
  years: number[],
  labs: { id: string; name: string }[],
  metric: 'quota' | 'draftedStudents',
): DraftStatsSeries[] {
  const statsByYear = index(stats, s => s.year);
  const statsByLab = rollup(
    stats.flatMap(s => s.labs.map(l => ({ ...l, year: s.year }))),
    values => values,
    l => l.labId,
  );

  return labs.map((lab, i) => {
    const labStats = statsByLab.get(lab.id) ?? [];
    const labStatsByYear = index(labStats, s => s.year);

    const points = years.map(year => {
      const yearStat = labStatsByYear.get(year);
      if (!yearStat) return null;

      const labEntry = yearStat.labs.find(l => l.labId === lab.id);
      if (!labEntry) return null;

      // If lab is archived, stop at the archive year
      if (labEntry.isArchived && labEntry.archivedAt) {
        const archiveYear = labEntry.archivedAt.getFullYear();
        if (year >= archiveYear) return null;
      }

      return { year, value: labEntry[metric] };
    });

    return {
      labId: lab.id,
      labName: lab.name,
      isArchived: labStats.some(s => s.labs.find(l => l.labId === lab.id)?.isArchived) ?? false,
      color: CHART_COLORS[i % CHART_COLORS.length],
      points,
    };
  });
}