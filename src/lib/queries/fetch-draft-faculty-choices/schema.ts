import * as v from 'valibot';

export const DraftFacultyChoiceRecords = v.array(
  v.object({
    draftId: v.bigint(),
    round: v.nullable(v.number()),
    labId: v.string(),
    createdAt: v.date(),
    userId: v.nullable(v.string()),
    userEmail: v.nullable(v.string()),
    studentEmail: v.nullable(v.string()),
  }),
);
export type DraftFacultyChoiceRecords = v.InferOutput<typeof DraftFacultyChoiceRecords>;
