import { useState, useEffect } from 'react';
import { useAccounts, useCurrentAccount, ConnectModal, useSuiClient, useDisconnectWallet } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';

import suiLogo from '../../assets/sui.svg';

type CoinBalance = {
  totalBalance: string;
};

type SuiWalletProps = {
  onAddressChange: (address: string) => void;
  onBalanceChange: (balance: number) => void;
}

const formatBalance = (balance: string | number): number => Number(balance) / 1e6;

function SuiWallet({ onAddressChange, onBalanceChange }: SuiWalletProps): JSX.Element {
  const accounts = useAccounts();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mutate: disconnect } = useDisconnectWallet();

  useEffect(() => {
    if (currentAccount?.address) {
      onAddressChange(currentAccount.address);
    }
  }, [currentAccount?.address]);

  const fetchBalance = async (address: string) => {
    try {
      const { totalBalance }: CoinBalance = await suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      
      const formattedBalance = formatBalance(totalBalance);
      setBalance(formattedBalance);
      onBalanceChange(formattedBalance);
      
      console.log('SUI Balance fetched:', formattedBalance);
    } catch (error) {
      console.error('Error fetching SUI balance:', error);
      setBalance(0);
      onBalanceChange(0);
    }
  };

  useEffect(() => {
    if (selectedAddress) {
      fetchBalance(selectedAddress);
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (currentAccount?.address) {
      setSelectedAddress(currentAccount.address);
      fetchBalance(currentAccount.address);
    }
  }, [currentAccount?.address]);

  const handleCopyAddress = () => {
    if (selectedAddress) {
      navigator.clipboard.writeText(selectedAddress);
      alert('Address copied to clipboard!');
    }
  };

  const handleRefresh = async () => {
    if (selectedAddress) {
      await fetchBalance(selectedAddress);
    }
  };

  return (
    <div className="wallet-container">
      <h2 style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={suiLogo} 
          alt="SUI Logo" 
          style={{ width: '30px', height: '30px', marginRight: '10px' }} 
        />
        SUI WALLET
      </h2>

      {!currentAccount && (
        <ConnectModal
          trigger={
            <button className="connect-button"
            >
              Connect
            </button>
          }
        />
      )}

      {accounts && accounts.length > 0 && (
        <>
          <button
            style={{
              padding: '10px 20px',
              fontSize: '10px',
              fontWeight: 400,
              color: '#f3f3f5',
              backgroundColor: '#17252A',
              borderRadius: '8px',
              border: '1px solid #17252A',
              boxShadow: '0px 4px 12px rgba(22, 61, 109, 0.1)',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              className="address-dropdown"
              value={selectedAddress || ''}
              onChange={(e) => setSelectedAddress(e.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.address}
                </option>
              ))}
            </select>
          </div>
          <div className="balance-display">
            BALANCE: {balance.toFixed(6)} MTR
            <button onClick={handleRefresh} style={{ marginLeft: '10px' }}>
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SuiWallet;
