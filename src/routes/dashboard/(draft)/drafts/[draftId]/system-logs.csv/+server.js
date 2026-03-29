import Papa from 'papaparse';
import { error, redirect } from '@sveltejs/kit';
import { lightFormat } from 'date-fns';
import { TZDate } from '@date-fns/tz';

import { db } from '$lib/server/database';
import { getDraftById, getSystemLogsExport } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.system-logs-csv';
const logger = Logger.byName(SERVICE_NAME);

function determineAction(userId, studentEmails) {
  if (userId === null) return 'System automation';
  if (studentEmails.length === 0) return 'No students selected';
  return 'Selected students';
}

function formatSystemLogForCsv(record) {
  const roundDisplay = record.round === null ? 'Lottery' : record.round;
  const action = determineAction(record.userId, record.studentEmails);

  return {
    Timestamp: record.createdAt.toISOString(),
    Round: roundDisplay,
    'Lab ID': record.labId,
    Action: action,
    Actor: record.userEmail ?? 'System',
    Students: record.studentEmails.join('; '),
  };
}

export async function GET({ params: { draftId: draftIdParam }, locals: { session } }) {
  const draftId = validateBigInt(draftIdParam);
  if (draftId === null) {
    logger.fatal('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  if (typeof session?.user === 'undefined') {
    logger.error('attempt to export system logs without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to export system logs', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const draft = await getDraftById(db, draftId);
  if (typeof draft === 'undefined') {
    logger.fatal('cannot find the target draft');
    error(404);
  }

  logger.info('exporting system logs');
  const records = await getSystemLogsExport(db, draftId);
  const csvData = records.map(formatSystemLogForCsv);
  const philippineTime = new TZDate(new Date(), 'Asia/Manila');
  const now = lightFormat(philippineTime, 'yyyy-MM-dd');
  return new Response(Papa.unparse(csvData), {
    headers: {
      'Content-Type': 'application/csv',
      'Content-Disposition': `attachment; filename="${now}_${draftId}_system_logs.csv"`,
    },
  });
}
