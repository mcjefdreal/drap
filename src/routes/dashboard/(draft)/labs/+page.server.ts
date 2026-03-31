import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import {
  type DrizzleTransaction,
  deleteLab,
  getActiveDraft,
  getLabRegistry,
  insertNewLab,
  lockLabCatalogForMutation,
  restoreLab,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateBigInt } from '$lib/validators';

const LabFormData = v.object({
  labId: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  draftId: v.optional(v.pipe(v.string(), v.minLength(1))),
});

const ArchiveFormData = v.object({
  archive: v.pipe(v.string(), v.minLength(1)),
  draftId: v.optional(v.pipe(v.string(), v.minLength(1))),
});

const RestoreFormData = v.object({
  restore: v.pipe(v.string(), v.minLength(1)),
  draftId: v.optional(v.pipe(v.string(), v.minLength(1))),
});

const SERVICE_NAME = 'routes.dashboard.admin.labs';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access labs page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to access labs page', void 0, {
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

  return await tracer.asyncSpan('load-labs-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });

    const labs = await getLabRegistry(db, false);
    logger.debug('labs page loaded', { 'lab.count': labs.length });
    return { labs };
  });
}

export const actions = {
  async lab({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to create lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to create lab', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.lab', async () => {
      const data = await request.formData();
      const { labId, name, draftId } = v.parse(LabFormData, decode(data));
      logger.debug('creating lab', { labId, name });

      await db.transaction(
        async db => {
          await lockLabCatalogForMutation(db);
          await assertDraftExpectation(db, draftId);
          await insertNewLab(db, labId, name);
        },
        { isolationLevel: 'read committed' },
      );
      logger.info('lab created', { labId, name });
    });
  },
  async archive({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to archive lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to archive lab', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.archive', async () => {
      const data = await request.formData();
      const { archive: labId, draftId } = v.parse(ArchiveFormData, decode(data));
      logger.debug('archiving lab', { labId });

      await db.transaction(
        async db => {
          await lockLabCatalogForMutation(db);
          await assertDraftExpectation(db, draftId);
          await deleteLab(db, labId);
        },
        { isolationLevel: 'read committed' },
      );
      logger.info('lab archived');
    });
  },
  async restore({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to restore lab without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
      logger.fatal('insufficient permissions to restore lab', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.restore', async () => {
      const data = await request.formData();
      const { restore: labId, draftId } = v.parse(RestoreFormData, decode(data));
      logger.debug('restoring lab', { labId });

      await db.transaction(
        async db => {
          await lockLabCatalogForMutation(db);
          await assertDraftExpectation(db, draftId);
          await restoreLab(db, labId);
        },
        { isolationLevel: 'read committed' },
      );
      logger.info('lab restored');
    });
  },
};

async function assertDraftExpectation(db: DrizzleTransaction, draftId?: string) {
  return await tracer.asyncSpan('assert-draft-expectation', async span => {
    const activeDraft = await getActiveDraft(db);
    if (typeof draftId === 'undefined') {
      if (typeof activeDraft === 'undefined') {
        logger.debug('successfully asserted empty draft expectation');
        return;
      }
      logger.fatal('missing draft id while active draft exists', void 0, {
        'draft.id.client': draftId,
        'draft.id.active': activeDraft.id.toString(),
      });
      error(403, 'Invalid draft.');
    }

    span.setAttribute('draft.id.client', draftId);

    const clientDraftId = validateBigInt(draftId);
    if (clientDraftId === null) {
      logger.fatal('invalid draft id');
      error(400, 'Invalid draft ID.');
    }

    if (typeof activeDraft === 'undefined') {
      logger.fatal('draft id provided while no active draft exists', void 0, {
        'draft.id.client': clientDraftId.toString(),
      });
      error(403, 'Invalid draft.');
    }

    if (clientDraftId !== activeDraft.id) {
      logger.fatal('draft id does not match active draft', void 0, {
        'draft.id.active': activeDraft.id.toString(),
      });
      error(403, 'Invalid draft.');
    }

    if (activeDraft.currRound === 0) {
      logger.fatal('cannot mutate lab catalog during registration', void 0, {
        'draft.id.active': activeDraft.id.toString(),
      });
      error(403, 'Cannot modify labs while draft registration is ongoing.');
    }

    logger.debug('successfully asserted active draft expectation', {
      'draft.round.active': activeDraft.currRound,
    });
  });
}
