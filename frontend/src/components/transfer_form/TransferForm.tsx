import { useState } from 'react';
import { useSignPersonalMessage, useCurrentAccount } from '@mysten/dapp-kit';
import { ethers } from 'ethers';
import { toB64 } from '@mysten/sui.js/utils';

type TransferFormProps = {
  ethAddress: string;
  suiAddress: string;
  suiBalance: number;
  ethBalance: number;
};

export default function TransferForm({ ethAddress, suiAddress,suiBalance, ethBalance }: TransferFormProps) {
  const [transferDirection, setTransferDirection] = useState<'SUI_TO_ETH' | 'ETH_TO_SUI'>('SUI_TO_ETH');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const currentAccount = useCurrentAccount();

  const createMessage = (body: any) => {
    return transferDirection === 'SUI_TO_ETH' 
      ? `Bridge ${amount} MTR to ETH\nSender: ${body.senderSuiAddress}\nRecipient: ${body.recipientEthAddress}\nDate: ${Date.now()}`
      : `Bridge ${amount} MTR to SUI\nSender: ${body.senderEthAddress}\nRecipient: ${body.recipientSuiAddress}\nDate: ${Date.now()}`;
  };

  const handleSend = async () => {
    setStatusMessage(null);
    setIsError(false);

    if (!amount || Number(amount) <= 0) {
      setStatusMessage('Please enter a valid amount');
      setIsError(true);
      return;
    }

    if (!ethAddress || !suiAddress) {
      setStatusMessage('Please connect both wallets first');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const amountValue = Number(amount);
  
      if (transferDirection === 'SUI_TO_ETH') {
        if (amountValue > suiBalance) {
          setStatusMessage('Insufficient SUI balance');
          setIsError(true);
          return;
        }
      } else {

        if (amountValue > ethBalance) {
          setStatusMessage('Insufficient ETH balance');
          setIsError(true);
          return;
        }
      }

      const endpoint = transferDirection === 'SUI_TO_ETH' 
        ? 'http://localhost:3001/api/bridge/sui-to-eth'
        : 'http://localhost:3001/api/bridge/eth-to-sui';

      const baseBody = transferDirection === 'SUI_TO_ETH'
        ? {
            senderSuiAddress: suiAddress,
            recipientEthAddress: ethAddress,
            amount: Number(amount).toFixed(6)
          }
        : {
            senderEthAddress: ethAddress,
            recipientSuiAddress: suiAddress,
            amount: Number(amount).toFixed(6)
          };

      const message = createMessage(baseBody);
      let signature;

      if (transferDirection === 'SUI_TO_ETH') {
        if (!currentAccount) throw new Error('Sui wallet not connected');
        
        const messageBytes = new TextEncoder().encode(message);
        
        const signatureResponse = await signPersonalMessage({
          message: messageBytes
        });
        
        if (!signatureResponse || !signatureResponse.signature) {
          throw new Error('Failed to get signature from wallet');
        }
        
        signature = {
          message: toB64(messageBytes),
          signature: signatureResponse.signature,
          publicKey: currentAccount.publicKey
        };
        
        console.log('Signature details:', {
          message: message,
          encodedMessage: toB64(messageBytes),
          signature: signatureResponse.signature,
          publicKey: currentAccount.publicKey
        });
      } else {
        // sign with Ethereum
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        signature = await signer.signMessage(message);
      }

      console.log('Final signature object:', signature);

      const body = {
        ...baseBody,
        message,
        signature
      };

      console.log('Sending request to:', endpoint);
      console.log('Request body:', JSON.stringify(body, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'xV0OjDXlyHXmf1SC9z6ZRbR6ih0YVuhI'
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      console.log('Raw response:', response);
      console.log('Response data:', result);

      if (!response.ok) {
        console.error('Server error details:', result);
        throw new Error(result.error || 'Bridge request failed');
      }

      setStatusMessage(result.message);
      setIsError(false);
      setAmount('');
    } catch (error: any) {
      console.error('Full error details:', error);
      console.error('Error stack:', error.stack);
      let errorMessage = error.message || 'Transfer failed';
      
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to bridge server. Please ensure the server is running.';
      }
      
      setStatusMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-form-container">
      <h2>Transfer MTR</h2>
      <div className="transfer-direction">
        <select 
          className="direction-select"
          value={transferDirection}
          onChange={(e) => setTransferDirection(e.target.value as 'SUI_TO_ETH' | 'ETH_TO_SUI')}
        >
          <option value="SUI_TO_ETH">SUI MTR → ETH MTR</option>
          <option value="ETH_TO_SUI">ETH MTR → SUI MTR</option>
        </select>
      </div>
      <input
        className="amount-input"
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.001"
      />
      <button 
        className="send-button" 
        onClick={handleSend}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Send'}
      </button>
      
      {statusMessage && (
        <div className={`status-message ${isError ? 'status-error' : 'status-success'}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}