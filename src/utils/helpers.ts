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

// Helper function to calculate next contribution date based on last contribution
export const calculateNextContribution = (
  goalId: bigint,
  frequency: number,
  contributions: Array<{ goalId: bigint; timestamp: bigint }>
) => {
  const goalContributions = contributions.filter((c) => c.goalId === goalId);

  if (goalContributions.length === 0) {
    return "No contributions yet";
  }

  const lastContribution = goalContributions.reduce((latest, current) =>
    current.timestamp > latest.timestamp ? current : latest
  );

  const lastDate = new Date(Number(lastContribution.timestamp) * 1000);
  const nextDate = new Date(lastDate);

  switch (frequency) {
    case 0: // Daily
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 1: // Weekly
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 2: // Monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  return nextDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

