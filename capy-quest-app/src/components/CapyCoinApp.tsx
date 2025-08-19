"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getWalletClient, publicClient, CapyCoinAbi, contractAddress } from "@/utils/contract";
import { parseEther } from "viem";

export default function CapyCoinApp() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [amount, setAmount] = useState("0.01"); // ETH que vas a mandar
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleBuy = async () => {
    try {
      if (!authenticated) {
        return login();
      }

      if (wallets.length === 0) {
        return setMessage("⚠️ No wallet found. Please connect one.");
      }

      setLoading(true);
      setMessage("");

      // Obtenemos el cliente de la primera wallet conectada
      const wallet = wallets[0];
      const walletClient = await getWalletClient(wallet);

      // Ejecutamos buyCapyCoin mandando ETH
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: CapyCoinAbi,
        functionName: "buyCapyCoin",
        value: parseEther(amount), // cantidad en ETH
      });

      setMessage(`✅ Transaction sent! Hash: ${hash}`);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-2xl shadow-md max-w-md mx-auto text-center">
      <h2 className="text-xl font-bold mb-4">Buy CapyCoins 🐹</h2>
      <input
        type="number"
        step="0.001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        placeholder="Amount in ETH"
      />
      <button
        onClick={handleBuy}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Buy CapyCoin"}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
