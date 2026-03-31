import * as v from 'valibot';

import { FetchInvitedUsersParams, FetchInvitedUsersResponse } from './schema';

export async function fetchInvitedUsers(params: FetchInvitedUsersParams) {
  const parsed = v.parse(FetchInvitedUsersParams, params);
  const searchParams = new URLSearchParams(parsed);

  const response = await fetch(`/dashboard/api/users/invited?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch invited users.');

  const json = await response.json();
  return v.parse(FetchInvitedUsersResponse, json);
}
