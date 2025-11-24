  // Convert wei to human readable format (assuming 18 decimals)
  export const formatBalance = (value: bigint | number) => {
    const num = typeof value === 'bigint' ? Number(value) : value
    return num / 1e18
  }