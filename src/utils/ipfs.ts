/**
 * IPFS URL utilities
 */

const IPFS_GATEWAY = import.meta.env.VITE_GATEWAY_URL;

/**
 * Handles various IPFS URL formats and ensures proper gateway usage
 */
export function normalizeIpfsUrl(url: string): string {
  if (!url) return '';

  // Already a proper HTTP URL with gateway
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Handle gateway URLs missing protocol (e.g., "gateway.cloud/ipfs/hash")
  if (url.includes('.cloud/ipfs/') || url.includes('.mypinata.cloud/ipfs/') || url.includes('pinata.cloud/ipfs/')) {
    const normalizedUrl = `https://${url}`;
    return normalizedUrl;
  }

  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    const normalizedUrl = `${IPFS_GATEWAY}/ipfs/${hash}`;
    return normalizedUrl;
  }

  // Handle raw IPFS hash (starts with Qm or bafy)
  if (url.match(/^(Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]+)$/)) {
    const normalizedUrl = `${IPFS_GATEWAY}/ipfs/${url}`;
    return normalizedUrl;
  }

  // If it starts with /ipfs/, prepend gateway
  if (url.startsWith('/ipfs/')) {
    const normalizedUrl = `${IPFS_GATEWAY}${url}`;
    return normalizedUrl;
  }

  // Fallback: assume it's malformed
  return url;
}

/**
 * Extract IPFS hash from various URL formats
 */
export function extractIpfsHash(url: string): string | null {
  if (!url) return null;

  // From gateway URL: https://gateway.cloud/ipfs/QmHash
  const gatewayMatch = url.match(/\/ipfs\/([^/?#]+)/);
  if (gatewayMatch) {
    return gatewayMatch[1];
  }

  // From ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }

  // Check if it's already a hash
  if (url.match(/^(Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]+)$/)) {
    return url;
  }

  return null;
}

/**
 * Validate if a string is a valid IPFS hash
 */
export function isValidIpfsHash(hash: string): boolean {
  if (!hash) return false;

  // CIDv0 (base58, starts with Qm)
  if (hash.match(/^Qm[a-zA-Z0-9]{44}$/)) {
    return true;
  }

  // CIDv1 (base32, starts with bafy/bafk/bafr)
  if (hash.match(/^baf[a-z0-9]+$/)) {
    return true;
  }

  return false;
}

/**
 * Test if an IPFS URL is accessible
 */
export async function testIpfsUrl(url: string): Promise<boolean> {
  try {
    const normalizedUrl = normalizeIpfsUrl(url);
    const response = await fetch(normalizedUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
