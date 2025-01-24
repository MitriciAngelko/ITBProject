import { useState } from 'react';
import './App.css';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme } from './myTheme';
import SuiWallet from './components/wallets/SuiWallet.tsx';
import ETHWallet from './components/wallets/ETHWallet.tsx';
import TransferForm from './components/transfer_form/TransferForm.tsx';

const { networkConfig } = createNetworkConfig({
	localnet: { url: 'http://127.0.0.1:9000' },
	mainnet: { url: getFullnodeUrl('mainnet') },
  devnet: { url: getFullnodeUrl('devnet') },
});
const queryClient = new QueryClient();

function App() {
  const [ethAddress, setEthAddress] = useState('');
  const [suiAddress, setSuiAddress] = useState('');
  const [suiBalance, setBalanceSui] = useState(0);
  const [ethBalance, setBalanceEth] = useState(0);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider theme={darkTheme}>
          <div className="app-container">
            <div className="wallets-container">
              <div className="wallet-wrapper">
                <SuiWallet onAddressChange={setSuiAddress} onBalanceChange={setBalanceSui}/>
              </div>
              <div className="wallet-wrapper">
                <ETHWallet onAddressChange={setEthAddress} onBalanceChange={setBalanceEth}/>
              </div>
            </div>
            <div className="transfer-container">
              <TransferForm 
                ethAddress={ethAddress} 
                suiAddress={suiAddress} 
                suiBalance={suiBalance} 
                ethBalance={ethBalance}
              />
            </div>
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
