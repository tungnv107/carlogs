/** Keep only account identity/metadata needed for application sign-in.
 * Google API tokens are not needed after OAuth authentication succeeds.
 */
export function withoutOAuthSecrets<T extends {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  session_state?: string;
}>(account: T): T {
  const safe = { ...account };
  delete safe.access_token;
  delete safe.refresh_token;
  delete safe.id_token;
  delete safe.session_state;
  return safe;
}
