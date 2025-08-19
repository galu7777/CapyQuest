"use client";

import { useState } from "react";
import { useWallet } from "@/hook/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import capyquest from "@/assets/capy.png";

export default function BuyCapyCoins() {
  const { wallet, loading, buyCapyCoins, reload, isConnected, switchToAvalancheFuji } = useWallet();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const router = useRouter();
  
  const [ethAmount, setEthAmount] = useState<string>("");
  const [buying, setBuying] = useState(false);

  const handleBuy = async () => {
    if (!authenticated) {
      login();
      return;
    }
    
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      alert("❌ Ingresa una cantidad válida de AVAX");
      return;
    }

    setBuying(true);
    try {
      const result = await buyCapyCoins(ethAmount);
      if (result.success) {
        alert(`✅ Compra exitosa! Tx: ${result.txHash}`);
        setEthAmount(""); // Limpiar el input
      } else {
        alert(`❌ Error en la compra: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado en la compra");
    } finally {
      setBuying(false);
    }
  };

  const getTokensEstimate = () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) return "0";
    // CORREGIDO: 1 AVAX = 10 CYC
    return (parseFloat(ethAmount) * 10).toFixed(2);
  };

  const goToWithdraw = () => {
    router.push("/withdraw");
  };

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-2xl hover:shadow-3xl transition-all duration-300 p-8 rounded-3xl max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-orange-400 bg-clip-text text-transparent">
          Comprar CapyCoins 🌟
        </h2>
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full blur-xl"></div>
          <Image
            src={capyquest}
            alt="CapyQuest"
            width={200}
            height={200}
            className="mx-auto relative z-10 drop-shadow-lg"
          />
        </div>
        
        {!ready ? (
          <div className="flex items-center justify-center p-6 bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            <span className="ml-2 text-amber-800 font-medium">Cargando Privy...</span>
          </div>
        ) : !authenticated ? (
          <div className="space-y-6">
            <p className="text-amber-700 text-lg">Conecta tu wallet para comprar CapyCoins</p>
            <button
              onClick={login}
              className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 shadow-lg hover:shadow-xl px-8 py-4 w-full text-lg"
            >
              Conectar Wallet / Login
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del usuario */}
            <div className="bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl backdrop-blur-sm p-6 text-left">
              <p className="text-sm text-amber-800 mb-2">
                <strong className="text-amber-900">Usuario:</strong>{" "}
                <span className="font-mono text-amber-700">
                  {user?.email ? String(user.email) : user?.wallet?.address?.slice(0, 8) + "..."}
                </span>
              </p>
              <p className="text-sm text-amber-800 mb-2">
                <strong className="text-amber-900">Wallet:</strong>{" "}
                <span className="font-mono text-amber-700">
                  {wallet.address 
                    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                    : "No conectado"}
                </span>
              </p>
              <p className="text-sm text-amber-800">
                <strong className="text-amber-900">Balance CYC:</strong>{" "}
                <span className="font-mono text-yellow-600 font-bold">
                  {wallet.balance || "0"} {wallet.symbol}
                </span>
              </p>
            </div>

            {/* Formulario de compra */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-800 mb-3">
                  Cantidad de AVAX a enviar:
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="border-2 border-amber-300/50 rounded-xl bg-white/80 backdrop-blur-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all p-4 w-full text-lg font-mono"
                  placeholder="0.1"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  disabled={loading || buying}
                />
              </div>
              
              {ethAmount && (
                <div className="bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl backdrop-blur-sm p-4 text-center">
                  <div className="text-lg font-bold text-amber-800">
                    Recibirás aproximadamente: <span className="text-yellow-600">{getTokensEstimate()} CYC</span>
                  </div>
                  <div className="text-sm text-amber-700 mt-1">
                    (1 AVAX = 10 CYC)
                  </div>
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={loading || buying || !ethAmount}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 shadow-lg hover:shadow-xl px-8 py-4 w-full text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-900 mr-3"></div>
                    Comprando...
                  </>
                ) : (
                  "🪙 Comprar CapyCoins"
                )}
              </button>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={switchToAvalancheFuji}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400 shadow-md hover:shadow-lg px-4 py-3 text-sm"
              >
                🔗 Avalanche Fuji
              </button>
              <button
                onClick={reload}
                disabled={loading}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 shadow-md hover:shadow-lg px-4 py-3 text-sm disabled:opacity-50"
              >
                {loading ? "⏳ Cargando..." : "🔄 Recargar"}
              </button>
            </div>

            {/* Botones administrativos */}
            <div className="grid grid-cols-2 gap-3 border-t border-amber-200 pt-6">
              <button
                onClick={goToWithdraw}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400 shadow-md hover:shadow-lg px-4 py-3 text-sm flex items-center justify-center"
              >
                💰 Retirar AVAX
              </button>
              <button
                onClick={logout}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-red-500 to-red-400 text-white hover:from-red-600 hover:to-red-500 shadow-md hover:shadow-lg px-4 py-3 text-sm"
              >
                🚪 Desconectar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}