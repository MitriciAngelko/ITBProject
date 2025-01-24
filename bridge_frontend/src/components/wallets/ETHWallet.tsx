import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';

import mmLogo from '../../assets/mm.svg';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

type ETHWalletProps = {
  onAddressChange: (address: string) => void;
  onBalanceChange: (balance: number) => void;
};

const TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const LOCAL_CHAIN_ID = 31337;

const ETHWallet = ({ onAddressChange, onBalanceChange}: ETHWalletProps) => {
  const [selectedAddress, setSelectedAddress] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [tokenBalance, setTokenBalance] = useState('');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (selectedAddress) {
      onAddressChange(selectedAddress);
    }
  }, [selectedAddress]);

  useEffect(() => {
    const ethProvider = (window as any).ethereum;
    if (ethProvider) {
      const web3Provider = new BrowserProvider(ethProvider);
      setProvider(web3Provider);
      setTokenContract(new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, web3Provider));
    }
  }, []);

  const checkNetwork = useCallback(async () => {
    if (!provider) return false;
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== LOCAL_CHAIN_ID) {
      alert(`Please connect to Local Network (Chain ID: ${LOCAL_CHAIN_ID})`);
      return false;
    }
    return true;
  }, [provider]);

  const fetchTokenBalance = useCallback(async (address: string) => {
    if (!tokenContract || !provider) return;
    
    try {
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(address);
      setTokenBalance(ethers.formatUnits(balance, decimals));
      onBalanceChange(Number(ethers.formatUnits(balance, decimals)));
      console.log('Token balance:', balance.toString());
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  }, [provider, tokenContract]);

  const handleRefresh = () => {
    if (selectedAddress) {
      setIsRefreshing(true);
      fetchTokenBalance(selectedAddress);
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const addLocalNetwork = async (provider: any) => {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${LOCAL_CHAIN_ID.toString(16)}`,
          chainName: 'Anvil Local',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['http://127.0.0.1:8545'],
          blockExplorerUrls: [] // Opțional
        }]
      });
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  };

  const connectWallet = async () => {
    const ethProvider = (window as any).ethereum;
    if (!ethProvider) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // Încercăm mai întâi să schimbăm rețeaua
      try {
        await ethProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${LOCAL_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Dacă rețeaua nu există, o adăugăm
        if (switchError.code === 4902) {
          await addLocalNetwork(ethProvider);
        } else {
          throw switchError;
        }
      }

      // După ce ne-am asigurat că suntem pe rețeaua corectă, conectăm wallet-ul
      const accounts = await ethProvider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts?.length) {
        setAvailableAccounts(accounts);
        setSelectedAddress(accounts[0]);
        const web3Provider = new BrowserProvider(ethProvider);
        setProvider(web3Provider);
        setTokenContract(new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, web3Provider));
        await fetchTokenBalance(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setSelectedAddress('');
    setAvailableAccounts([]);
    setTokenBalance('');
  };

  const handleAddressChange = async (address: string) => {
    setSelectedAddress(address);
    await fetchTokenBalance(address);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedAddress);
    alert('Address copied to clipboard!');
  };

  return (
    <div className="wallet-container">
      <h2 style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={mmLogo} 
          alt="SUI Logo" 
          style={{ width: '30px', height: '30px', marginRight: '10px' }} 
        />
        ETH WALLET
      </h2>
  
      {!selectedAddress ? (
        <button
          className="connect-button"
          onClick={connectWallet}
        >
          Connect
        </button>
      ) : (
        <>
          <button
            className="disconnect-button"
            onClick={disconnectWallet}
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
          >
            Disconnect
          </button>
  
          <div className="address-section" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <select
              className="address-select"
              value={selectedAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              style={{
                width: '100%', 
                marginRight: '10px',
                padding: '8px',
                border: '1px solid #123157',
                borderRadius: '8px',
                backgroundColor: '#f3f3f5',
              }}
            >
              {availableAccounts.map((address) => (
                <option key={address} value={address}>
                  {address}
                </option>
              ))}
            </select>
            <button
              className="copy-button"
              onClick={copyAddress}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#f3f3f5',
                backgroundColor: '#17252A',
                borderRadius: '8px',
                border: '1px solid #17252A',
                boxShadow: '0px 4px 12px rgba(22, 61, 109, 0.1)',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
  
          <div className="balance-display" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>BALANCE: {tokenBalance || '0.000'} MTR</span>
            <button
              onClick={handleRefresh}
              className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
              style={{
                padding: '5px 10px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#f3f3f5',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="refresh-icon"
                style={{
                  width: '20px',
                  height: '20px',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0114.89-3.36L23 10M1 14l4.6 4.6A9 9 0 0020.49 15"></path>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ETHWallet;