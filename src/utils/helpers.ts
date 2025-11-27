// Convert wei to human readable format (assuming 18 decimals)
export const formatBalance = (value: bigint | number) => {
  const num = typeof value === 'bigint' ? Number(value) : value
  return num / 1e18
}

// Helper function to format blockchain timestamp to readable date
export const formatTimestamp = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};