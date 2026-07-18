/**
 * Securely hashes a non-member password using SHA-256 and a reservation UUID as a salt.
 * Native Web Crypto API is used to ensure Edge Runtime compatibility.
 */
export async function hashNonMemberPassword(password: string, saltId: string): Promise<string> {
  const encoder = new TextEncoder();
  // Salt password with the reservation's unique UUID
  const data = encoder.encode(password + saltId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
