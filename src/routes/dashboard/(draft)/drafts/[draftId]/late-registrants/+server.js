import * as devalue from 'devalue';
import { error } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { getLateRegistrantsByDraft } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.late-registrants';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch late registrants without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch late registrants', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('fetch-draft-late-registrants', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const lateRegistrants = await getLateRegistrantsByDraft(db, draftId);

    logger.debug('late registrants fetched', {
      'draft.id': draftId.toString(),
      'late_registrants.count': lateRegistrants.length,
    });

    return new Response(devalue.stringify(lateRegistrants), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
