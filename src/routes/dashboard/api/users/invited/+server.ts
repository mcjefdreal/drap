import * as v from 'valibot';
import { error, json } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { FetchInvitedUsersParams } from '$lib/queries/fetch-invited-users/schema';
import { getInvitedFacultyAndStaff } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.api.users.invited';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ locals: { session }, url }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access invited users without session');
    error(401);
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    logger.fatal('insufficient permissions to access invited users', void 0, {
      'user.is_admin': session.user.isAdmin,
      'user.google_id': session.user.googleUserId,
      'user.lab_id': session.user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('fetch-invited-users', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });

    const parsed = v.safeParse(FetchInvitedUsersParams, Object.fromEntries(url.searchParams));
    if (!parsed.success) error(400);

    const { type } = parsed.output;

    const allInvited = await getInvitedFacultyAndStaff(db);
    const filtered = allInvited.filter(user =>
      type === 'admins' ? user.labName === null : user.labName !== null,
    );

    return json(filtered);
  });
}
