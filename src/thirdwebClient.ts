import { createThirdwebClient } from "thirdweb";

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID as string | undefined;

if (!clientId) {
  // Intentionally throw early to surface misconfiguration in development
  throw new Error("Missing VITE_THIRDWEB_CLIENT_ID environment variable for Thirdweb client");
}

export const client = createThirdwebClient({ clientId });