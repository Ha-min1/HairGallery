/**
 * Securely hashes a non-member password using SHA-256 with standard salt.
 * Native Web Crypto API is used to ensure Edge Runtime compatibility.
 */
export async function hashNonMemberPassword(password: string, saltId?: string): Promise<string> {
  const cleanPass = password.trim();
  const encoder = new TextEncoder();
  const salt = 'hair_gallery_non_member_salt_v1';
  
  // Standard fixed salt hash
  const data = encoder.encode(`${cleanPass}:${salt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Legacy UUID salt hashing helper for backward compatibility
 */
export async function hashNonMemberPasswordLegacy(password: string, saltId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
