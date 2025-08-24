import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/hook/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { CapyCoinAbi, contractAddress } from "@/utils/contract";

export function useWithdrawAvax() {
  const { wallet, isConnected } = useWallet();
  const { authenticated } = usePrivy();
  const [contractBalance, setContractBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Función para obtener el provider/signer
  const getProvider = () => {
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    throw new Error("No ethereum provider found");
  };

  // Verificar si el usuario es el owner del contrato
  const checkIsOwner = useCallback(async () => {
    if (!isConnected || !wallet.address) {
      setIsOwner(false);
      return;
    }

    try {
      const provider = getProvider();
      const contract = new ethers.Contract(contractAddress, CapyCoinAbi, provider);
      const ownerAddress = await contract.owner();
      
      setIsOwner(wallet.address.toLowerCase() === ownerAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking owner:", error);
      setIsOwner(false);
    }
  }, [isConnected, wallet.address]);

  // Obtener el balance del contrato
  const getContractBalance = useCallback(async () => {
    setLoading(true);
    try {
      const provider = getProvider();
      const balance = await provider.getBalance(contractAddress);
      const balanceInEther = ethers.formatEther(balance);
      setContractBalance(balanceInEther);
    } catch (error) {
      console.error("Error getting contract balance:", error);
      setContractBalance("0");
    } finally {
      setLoading(false);
    }
  }, []);

  // Retirar todos los fondos
  const withdrawAllFunds = async () => {
    if (!isConnected || !isOwner) {
      return { success: false, error: "Not authorized" };
    }

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CapyCoinAbi, signer);

      const tx = await contract.withdrawFunds();
      const receipt = await tx.wait();

      // Actualizar balance después del retiro
      await getContractBalance();

      return { 
        success: true, 
        txHash: receipt.hash 
      };
    } catch (error) {
      console.error("Error withdrawing all funds:", error);
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Retirar cantidad específica
  const withdrawSpecificAmount = async (amountInEth: string) => {
    if (!isConnected || !isOwner) {
      return { success: false, error: "Not authorized" };
    }

    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CapyCoinAbi, signer);

      // Convertir ETH a wei
      const amountInWei = ethers.parseEther(amountInEth);

      const tx = await contract.withdrawAmount(amountInWei);
      const receipt = await tx.wait();

      // Actualizar balance después del retiro
      await getContractBalance();

      return { 
        success: true, 
        txHash: receipt.hash 
      };
    } catch (error) {
      console.error("Error withdrawing specific amount:", error);
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Efectos
  useEffect(() => {
    if (authenticated && isConnected) {
      checkIsOwner();
      getContractBalance();
    }
  }, [authenticated, isConnected, wallet.address, checkIsOwner, getContractBalance]);

  return {
    contractBalance,
    loading,
    isOwner,
    withdrawAllFunds,
    withdrawSpecificAmount,
    refreshBalance: getContractBalance,
  };
}