import { createQuery } from '@tanstack/svelte-query';

import { fetchInvitedUsers } from './http';

export function createFetchInvitedUsersQuery(
  getType: () => 'admins' | 'heads',
  enabled: () => boolean,
) {
  return createQuery(() => ({
    queryKey: ['users', 'invited', getType()] as const,
    queryFn: async ({ queryKey: [, , t] }) => await fetchInvitedUsers({ type: t }),
    enabled: enabled(),
  }));
}
