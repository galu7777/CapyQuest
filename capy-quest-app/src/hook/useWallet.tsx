import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { contractAddress, CapyCoinAbi, publicClient, getWalletClient } from "@/utils/contract";
import { parseUnits, formatUnits } from "viem";

interface WalletState {
  address: string | null;
  balance: string | null;
  symbol: string;
  decimals: number;
}

export function useWallet() {
  const { user, ready, authenticated } = usePrivy();
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    symbol: "CYC",
    decimals: 18,
  });
  const [loading, setLoading] = useState(false);

  // Cargar balance
  const loadWallet = useCallback(async () => {
    if (!ready || !authenticated || !user?.wallet?.address) return;

    try {
      setLoading(true);
      const address = user.wallet.address as `0x${string}`;

      const balanceRaw = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: CapyCoinAbi,
        functionName: "balanceOf",
        args: [address],
      });

      setWallet({
        address,
        balance: formatUnits(balanceRaw as bigint, 18),
        symbol: "CYC",
        decimals: 18,
      });
    } catch (err) {
      console.error("Error cargando wallet:", err);
    } finally {
      setLoading(false);
    }
  }, [ready, authenticated, user]);

  // Función para cambiar a Avalanche Fuji
  const switchToAvalancheFuji = useCallback(async () => {
    if (!window.ethereum) return false;

    try {
      // Intentar cambiar a Avalanche Fuji
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xA869' }], // 43113 en hexadecimal
      });
      return true;
    } catch (switchError: any) {
      // Si la red no está añadida, la añadimos
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xA869',
                chainName: 'Avalanche Fuji Testnet',
                nativeCurrency: {
                  name: 'AVAX',
                  symbol: 'AVAX',
                  decimals: 18,
                },
                rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                blockExplorerUrls: ['https://testnet.snowtrace.io/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error añadiendo red:', addError);
          return false;
        }
      }
      console.error('Error cambiando red:', switchError);
      return false;
    }
  }, []);

  // Comprar tokens
  const buyCapyCoins = useCallback(
    async (ethAmount: string) => {
      if (!ready || !authenticated || !user?.wallet?.address) {
        return { success: false, error: "No wallet connected" };
      }

      try {
        setLoading(true);
        
        // Verificar MetaMask
        if (!window.ethereum) {
          return { success: false, error: "MetaMask no está instalado" };
        }

        // Verificar la red actual
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("Chain ID actual:", currentChainId);
        
        if (currentChainId !== '0xA869') { // 43113 en hex
          console.log("Red incorrecta, cambiando a Avalanche Fuji...");
          const switched = await switchToAvalancheFuji();
          if (!switched) {
            return { 
              success: false, 
              error: "Debes cambiar a Avalanche Fuji Testnet en MetaMask" 
            };
          }
          // Esperar un momento para que se complete el cambio
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Verificar direcciones
        const metamaskAccounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        const privyAddress = user.wallet.address.toLowerCase();
        const metamaskAddress = metamaskAccounts[0]?.toLowerCase();
        
        console.log("Privy address:", privyAddress);
        console.log("MetaMask address:", metamaskAddress);
        
        if (metamaskAddress !== privyAddress) {
          return { 
            success: false, 
            error: `Direcciones no coinciden. Cambia a ${privyAddress.slice(0,8)}... en MetaMask` 
          };
        }
        
        const account = user.wallet.address as `0x${string}`;
        const value = parseUnits(ethAmount, 18);

        console.log("Buying CapyCoins:", { amount: value, user: account });

        // Usar getWalletClient
        const walletClient = getWalletClient(window.ethereum);

        // Ejecutar transacción directamente
        const txHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: CapyCoinAbi,
          functionName: "buyCapyCoin",
          value,
          account,
        });

        console.log("Transaction sent:", txHash);

        // Esperar confirmación
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        console.log("Transaction confirmed");

        // Recargar balance
        await loadWallet();
        return { success: true, txHash };
        
      } catch (err: any) {
        console.error("Compra fallida:", err);
        
        let errorMessage = err.shortMessage || err.message || "Error desconocido";
        
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Fondos insuficientes en tu wallet";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transacción cancelada por el usuario";
        } else if (errorMessage.includes("does not match the target chain")) {
          errorMessage = "Red incorrecta. Cambia a Avalanche Fuji Testnet en MetaMask";
        } else if (errorMessage.includes("Unable to sign")) {
          errorMessage = "Error de firma. Verifica red y dirección en MetaMask.";
        }
        
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [ready, authenticated, user, loadWallet, switchToAvalancheFuji]
  );

  // Funcion para agregar token a MetaMask
  const addTokenToMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      alert("❌ MetaMask no está instalado");
      return false;
    }

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: contractAddress, // Tu dirección del contrato
            symbol: 'CYC',
            decimals: 18,
            image: process.env.NEXT_PUBLIC_IPFS!, // Tu imagen
          },
        },
      });

      if (wasAdded) {
        alert("✅ CapyCoin agregado a MetaMask!");
        return true;
      } else {
        alert("❌ Usuario canceló la operación");
        return false;
      }
    } catch (error) {
      console.error("Error agregando token:", error);
      alert("❌ Error agregando token a MetaMask");
      return false;
    }
  }, []);

  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      loadWallet();
    }
  }, [ready, authenticated, user?.wallet?.address, loadWallet]);

  return { 
    wallet, 
    loading, 
    buyCapyCoins, 
    reload: loadWallet,
    isConnected: authenticated && !!user?.wallet?.address,
    switchToAvalancheFuji,
    addTokenToMetaMask
  };
}