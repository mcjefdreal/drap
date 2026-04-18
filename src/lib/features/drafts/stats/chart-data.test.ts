import { describe, expect, test } from 'vitest';

import { buildAssignedStatsChart, getLocalYearBucket } from './chart-data';

describe('getLocalYearBucket', () => {
  test('uses the local year instead of the UTC year', () => {
    class LocalYearDate extends Date {
      override getFullYear() {
        return super.getUTCFullYear() - 1;
      }
      override getUTCFullYear() {
        return super.getUTCFullYear();
      }
    }

    expect(getLocalYearBucket(new LocalYearDate('2025-01-01T00:30:00Z'))).toBe(2024);
  });
});

describe('buildAssignedStatsChart', () => {
  const records = [
    {
      draftId: 1n,
      activePeriodStart: new Date('2024-01-02T00:00:00Z'),
      labId: 'csl',
      labName: 'Computer Security Laboratory',
      archivedAt: null,
      draftedStudents: 1,
    },
    {
      draftId: 2n,
      activePeriodStart: new Date('2024-06-15T00:00:00Z'),
      labId: 'csl',
      labName: 'Computer Security Laboratory',
      archivedAt: null,
      draftedStudents: 2,
    },
    {
      draftId: 3n,
      activePeriodStart: new Date('2024-06-15T00:00:00Z'),
      labId: 'ndsl',
      labName: 'Networked and Distributed Systems Laboratory',
      archivedAt: null,
      draftedStudents: 3,
    },
    {
      draftId: 4n,
      activePeriodStart: new Date('2025-02-10T00:00:00Z'),
      labId: 'ndsl',
      labName: 'Networked and Distributed Systems Laboratory',
      archivedAt: null,
      draftedStudents: 4,
    },
    {
      draftId: 5n,
      activePeriodStart: new Date('2023-03-20T00:00:00Z'),
      labId: 'acl',
      labName: 'Algorithms and Complexity Laboratory',
      archivedAt: new Date('2023-08-01T00:00:00Z'),
      draftedStudents: 1,
    },
  ] as const;

  test('sums multiple assigned rows in the same local year and lab', () => {
    const chart = buildAssignedStatsChart(records);
    const row2024 = chart.data.find(({ year }) => year === 2024);

    expect(row2024).toMatchObject({
      year: 2024,
      csl: 3,
      ndsl: 3,
    });

    expect(chart.maxValue).toBe(4);
  });

  test('fills missing lab-year values with null instead of zero', () => {
    const chart = buildAssignedStatsChart(records);
    const row2025 = chart.data.find(({ year }) => year === 2025);

    expect(row2025).toMatchObject({
      year: 2025,
      csl: null,
      ndsl: 4,
      acl: null,
    });
  });

  test('leaves later years empty for labs with no rows', () => {
    const chart = buildAssignedStatsChart(records);

    expect(chart.data).toEqual([
      expect.objectContaining({ year: 2023, acl: 1 }),
      expect.objectContaining({ year: 2024, acl: null }),
      expect.objectContaining({ year: 2025, acl: null }),
    ]);
  });

  test('uses uppercase lab ids for legend labels and chart config labels', () => {
    const chart = buildAssignedStatsChart(records);

    expect(chart.series).toContainEqual(
      expect.objectContaining({
        key: 'csl',
        label: 'CSL',
      }),
    );
    expect(chart.config.csl).toEqual({
      label: 'CSL',
      color: expect.any(String),
    });
  });

  test('includes all labs so legend filtering can control visibility', () => {
    const chart = buildAssignedStatsChart(records);

    expect(chart.series.map(({ key }) => key)).toEqual(['csl', 'ndsl', 'acl']);
  });

  test('keeps aggregated values correct even if the input order changes', () => {
    const sortedChart = buildAssignedStatsChart(records);
    const shuffledRecords = [records[3], records[1], records[4], records[0], records[2]].filter(
      record => typeof record !== 'undefined',
    );
    const shuffledChart = buildAssignedStatsChart(shuffledRecords);

    expect(shuffledChart.data).toEqual(sortedChart.data);
  });

  test('emits a single assigned chart view', () => {
    const chart = buildAssignedStatsChart(records);

    expect(chart).toEqual(
      expect.objectContaining({
        data: expect.any(Array),
        series: expect.any(Array),
        config: expect.any(Object),
      }),
    );
  });
});
