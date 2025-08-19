import { useState, useEffect } from "react";
import { useWallet } from "@/hook/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { CapyCoinAbi, contractAddress } from "@/utils/contract";

export function useWithdrawAvax() {
  const { wallet, isConnected } = useWallet();
  const { user, authenticated } = usePrivy();
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
  const checkIsOwner = async () => {
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
  };

  // Obtener el balance del contrato
  const getContractBalance = async () => {
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
  };

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
    } catch (error: any) {
      console.error("Error withdrawing all funds:", error);
      return { 
        success: false, 
        error: error.message || "Transaction failed" 
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
    } catch (error: any) {
      console.error("Error withdrawing specific amount:", error);
      return { 
        success: false, 
        error: error.message || "Transaction failed" 
      };
    }
  };

  // Efectos
  useEffect(() => {
    if (authenticated && isConnected) {
      checkIsOwner();
      getContractBalance();
    }
  }, [authenticated, isConnected, wallet.address]);

  return {
    contractBalance,
    loading,
    isOwner,
    withdrawAllFunds,
    withdrawSpecificAmount,
    refreshBalance: getContractBalance,
  };
}