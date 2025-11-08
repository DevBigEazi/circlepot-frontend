// Network error retry utility
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on user cancellation or validation errors
      if (
        error instanceof Error && 
        (error.message.includes('User rejected') || 
         error.message.includes('User closed login window') ||
         error.message.includes('invalid') ||
         error.message.includes('expired'))
      ) {
        throw error
      }
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Development mode helper
export const isDevelopment = () => {
  return import.meta.env.DEV
}

// Network connectivity check
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    await fetch('https://embedded-wallet.thirdweb.com/api/health', {
      method: 'HEAD',
      mode: 'no-cors'
    })
    return true
  } catch {
    return false
  }
}
