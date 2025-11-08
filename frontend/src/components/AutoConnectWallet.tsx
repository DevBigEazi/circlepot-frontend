import { useEffect } from 'react';
import { useAutoConnect } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets/in-app';
import { client } from '../thirdwebClient';

/**
 * Enables automatic wallet reconnection on page load
 */
export const AutoConnectWallet: React.FC = () => {
  const { data: autoConnected, isLoading } = useAutoConnect({
    client,
    wallets: [
      inAppWallet({
        auth: {
          options: ['google', 'email'],
        },
      }),
    ],
    onConnect: () => {
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (autoConnected) {
      } 
    }
  }, [autoConnected, isLoading]);

  return null; //  render nothing
};

export default AutoConnectWallet;
