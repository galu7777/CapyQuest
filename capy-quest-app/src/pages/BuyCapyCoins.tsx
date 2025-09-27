"use client";

import { useState } from "react";
import { useWallet } from "@/hook/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import capyquest from "@/assets/CYC-r.png";
import { Coins, Network, RefreshCw, Download, Plus, LogOut, Store, User, Wallet, Star, Map } from "lucide-react";

export default function BuyCapyCoins() {
  const { wallet, loading, buyCapyCoins, reload, switchToMoonbaseAlpha, addTokenToMetaMask } = useWallet();
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
      alert("❌ Ingresa una cantidad válida de DEV");
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
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-orange-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Coins className="w-8 h-8" />
          Comprar CapyCoins
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
              className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 shadow-lg hover:shadow-xl px-8 py-4 w-full text-lg flex items-center justify-center"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Conectar Wallet / Login
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del usuario */}
            <div className="bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl backdrop-blur-sm p-6 text-left">
              <p className="text-sm text-amber-800 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                <strong className="text-amber-900">Usuario:</strong>{" "}
                <span className="font-mono text-amber-700 ml-1">
                  {user?.email ? String(user.email) : user?.wallet?.address?.slice(0, 8) + "..."}
                </span>
              </p>
              <p className="text-sm text-amber-800 mb-2 flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                <strong className="text-amber-900">Wallet:</strong>{" "}
                <span className="font-mono text-amber-700 ml-1">
                  {wallet.address 
                    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                    : "No conectado"}
                </span>
              </p>
              <p className="text-sm text-amber-800 flex items-center">
                <Coins className="w-4 h-4 mr-2" />
                <strong className="text-amber-900">Balance CYC:</strong>{" "}
                <span className="font-mono text-yellow-600 font-bold ml-1">
                  {wallet.balance || "0"} {wallet.symbol}
                </span>
              </p>
            </div>

            {/* Formulario de compra */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-800 mb-3 flex items-center">
                  <Coins className="w-4 h-4 mr-1" />
                  Cantidad de DEV a enviar:
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
                  <div className="text-lg font-bold text-amber-800 flex items-center justify-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Recibirás aproximadamente: <span className="text-yellow-600 ml-1">{getTokensEstimate()} CYC</span>
                  </div>
                  <div className="text-sm text-amber-700 mt-1 flex items-center justify-center">
                    (1 DEV = 10 CYC)
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
                    <RefreshCw className="animate-spin h-5 w-5 mr-3" />
                    Comprando...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5 mr-2" />
                    Comprar CapyCoins
                  </>
                )}
              </button>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                key="switch-network"
                onClick={switchToMoonbaseAlpha}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400 shadow-md hover:shadow-lg px-4 py-3 text-sm flex items-center justify-center"
              >
                <Network className="w-4 h-4 mr-2" />
                Moonbase Alpha
              </button>
              <button
                key="reload-wallet"
                onClick={reload}
                disabled={loading}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 shadow-md hover:shadow-lg px-4 py-3 text-sm flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {loading ? "Cargando..." : "Recargar"}
              </button>
            </div>

            {/* Botones administrativos */}
            <div className="space-y-3 border-t border-amber-200 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  key="withdraw"
                  onClick={goToWithdraw}
                  className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400 shadow-md hover:shadow-lg px-4 py-3 text-sm flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Retirar AVAX
                </button>
                <button
                  key="add-token"
                  onClick={addTokenToMetaMask}
                  className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400 shadow-md hover:shadow-lg px-4 py-3 text-sm flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Token
                </button>
              </div>
              <button
                key="marketplace"
                onClick={() => router.push('/marketplace-nft')}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-purple-500 to-purple-400 text-white hover:from-purple-600 hover:to-purple-500 shadow-md hover:shadow-lg px-4 py-3 text-sm w-full flex items-center justify-center"
              >
                <Store className="w-4 h-4 mr-2" />
                Ir Marketplace
              </button>
              <button
                key="treasure-zone"
                onClick={() => router.push('/treasure-zone')}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:from-blue-600 hover:to-blue-500 shadow-md hover:shadow-lg px-4 py-3 text-sm w-full flex items-center justify-center"
              >
                <Map className="w-4 h-4 mr-2" />
                Ir a Zona del Tesoro
              </button>
              <button
                key="logout"
                onClick={logout}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-red-500 to-red-400 text-white hover:from-red-600 hover:to-red-500 shadow-md hover:shadow-lg px-4 py-3 text-sm w-full flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Desconectar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}