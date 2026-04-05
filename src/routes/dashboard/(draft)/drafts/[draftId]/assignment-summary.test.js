import { describe, expect, it } from 'vitest';

import {
  buildDraftAssignmentSummary,
  buildPreferenceAlignment,
  ordinalChoice,
} from './assignment-summary';

describe('buildDraftAssignmentSummary', () => {
  it('builds zero-filled phase series and aggregate metrics from grouped assignment rows', () => {
    const summary = buildDraftAssignmentSummary(
      [
        { labId: 'lab-1', round: 1, count: 2 },
        { labId: 'lab-2', round: 2, count: 1 },
        { labId: 'lab-1', round: 4, count: 1 },
        { labId: 'lab-2', round: null, count: 1 },
      ],
      [
        { id: 'lab-1', name: 'Lab One', quota: 3 },
        { id: 'lab-2', name: 'Lab Two', quota: 2 },
      ],
      3,
      5,
    );

    expect(summary.metrics).toEqual({
      participatingLabCount: 2,
      interventionDraftedCount: 1,
      lotteryDraftedCount: 1,
    });
    expect(summary.chart.phases).toEqual([
      { key: 'round-1', axisLabel: 'R1', tooltipLabel: 'Round 1' },
      { key: 'round-2', axisLabel: 'R2', tooltipLabel: 'Round 2' },
      { key: 'round-3', axisLabel: 'R3', tooltipLabel: 'Round 3' },
      { key: 'interventions', axisLabel: 'Interventions', tooltipLabel: 'Interventions' },
      { key: 'lottery', axisLabel: 'Lottery', tooltipLabel: 'Lottery' },
    ]);
    expect(summary.chart.allLabs).toEqual({
      capacity: 5,
      assignedByPhase: [2, 1, 0, 1, 1],
      assignedMax: 2,
    });
    expect(summary.chart.labs).toEqual([
      {
        id: 'lab-1',
        name: 'Lab One',
        capacity: 3,
        assignedByPhase: [2, 0, 0, 1, 0],
        assignedMax: 2,
      },
      {
        id: 'lab-2',
        name: 'Lab Two',
        capacity: 2,
        assignedByPhase: [0, 1, 0, 0, 1],
        assignedMax: 1,
      },
    ]);
  });

  it('returns zero-filled series when no assignments exist yet', () => {
    const summary = buildDraftAssignmentSummary(
      [],
      [{ id: 'lab-1', name: 'Lab One', quota: 4 }],
      2,
      4,
    );

    expect(summary.metrics).toEqual({
      participatingLabCount: 1,
      interventionDraftedCount: 0,
      lotteryDraftedCount: 0,
    });
    expect(summary.chart.allLabs).toEqual({
      capacity: 4,
      assignedByPhase: [0, 0, 0, 0],
      assignedMax: 0,
    });
    expect(summary.chart.labs).toEqual([
      {
        id: 'lab-1',
        name: 'Lab One',
        capacity: 4,
        assignedByPhase: [0, 0, 0, 0],
        assignedMax: 0,
      },
    ]);
  });
});

describe('ordinalChoice', () => {
  it('formats standard ordinal suffixes', () => {
    expect(ordinalChoice(1)).toBe('1st Choice');
    expect(ordinalChoice(2)).toBe('2nd Choice');
    expect(ordinalChoice(3)).toBe('3rd Choice');
    expect(ordinalChoice(4)).toBe('4th Choice');
    expect(ordinalChoice(5)).toBe('5th Choice');
    expect(ordinalChoice(9)).toBe('9th Choice');
    expect(ordinalChoice(10)).toBe('10th Choice');
  });

  it('handles teens as exceptions', () => {
    expect(ordinalChoice(11)).toBe('11th Choice');
    expect(ordinalChoice(12)).toBe('12th Choice');
    expect(ordinalChoice(13)).toBe('13th Choice');
  });

  it('resumes normal suffixes after teens', () => {
    expect(ordinalChoice(21)).toBe('21st Choice');
    expect(ordinalChoice(22)).toBe('22nd Choice');
    expect(ordinalChoice(23)).toBe('23rd Choice');
    expect(ordinalChoice(24)).toBe('24th Choice');
  });
});

describe('buildPreferenceAlignment', () => {
  it('creates individual slices for each rank sorted ascending', () => {
    const result = buildPreferenceAlignment([
      { preferenceRank: 3n, totalRanked: 5, count: 2 },
      { preferenceRank: 1n, totalRanked: 5, count: 10 },
      { preferenceRank: 5n, totalRanked: 5, count: 1 },
      { preferenceRank: 2n, totalRanked: 5, count: 4 },
    ]);

    expect(result.slices).toEqual([
      { label: '1st Choice', count: 10 },
      { label: '2nd Choice', count: 4 },
      { label: '3rd Choice', count: 2 },
      { label: '5th Choice', count: 1 },
    ]);
  });

  it('appends "Not Preferred" last for unranked assignments', () => {
    const result = buildPreferenceAlignment([
      { preferenceRank: 1n, totalRanked: 3, count: 5 },
      { preferenceRank: null, totalRanked: null, count: 3 },
      { preferenceRank: 2n, totalRanked: 3, count: 2 },
    ]);

    expect(result.slices).toEqual([
      { label: '1st Choice', count: 5 },
      { label: '2nd Choice', count: 2 },
      { label: 'Not Preferred', count: 3 },
    ]);
  });

  it('omits "Not Preferred" when all students ranked their assigned lab', () => {
    const result = buildPreferenceAlignment([
      { preferenceRank: 1n, totalRanked: 2, count: 4 },
      { preferenceRank: 2n, totalRanked: 2, count: 1 },
    ]);

    expect(result.slices.map(s => s.label)).not.toContain('Not Preferred');
  });

  it('computes Borda score correctly for mixed ranks', () => {
    // 2 students ranked 3 labs each, both got 1st choice → (3-1)/(3-1) = 1.0 each
    const result = buildPreferenceAlignment([{ preferenceRank: 1n, totalRanked: 3, count: 2 }]);

    expect(result.bordaScore).toBeCloseTo(1.0);
  });

  it('scores unranked students as zero Borda', () => {
    // 1 ranked 1st of 3 → (3-1)/(3-1) = 1.0; 1 unranked → 0
    // average = (1.0 + 0) / 2 = 0.5
    const result = buildPreferenceAlignment([
      { preferenceRank: 1n, totalRanked: 3, count: 1 },
      { preferenceRank: null, totalRanked: null, count: 1 },
    ]);

    expect(result.bordaScore).toBeCloseTo(0.5);
  });

  it('returns zero Borda score when no rows exist', () => {
    const result = buildPreferenceAlignment([]);
    expect(result.bordaScore).toBe(0);
    expect(result.slices).toEqual([]);
  });

  it('gives perfect score when only one lab was ranked', () => {
    // single-lab ranking → perfect score
    const result = buildPreferenceAlignment([{ preferenceRank: 1n, totalRanked: 1, count: 3 }]);

    expect(result.bordaScore).toBeCloseTo(1.0);
  });
});
