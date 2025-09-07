"use client";

import { useState } from "react";
import { useWithdrawAvax } from "@/hook/useWithdrawAvax";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Coins, 
  User, 
  Wallet, 
  CheckCircle, 
  Download, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Ban
} from "lucide-react";

export default function WithdrawAvax() {
  const { contractBalance, loading, withdrawAllFunds, withdrawSpecificAmount, isOwner } = useWithdrawAvax();
  const { ready, authenticated, login, user } = usePrivy();
  const [customAmount, setCustomAmount] = useState<string>("");
  const [withdrawing, setWithdrawing] = useState(false);
  const router = useRouter();

  const handleWithdrawAll = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!isOwner) {
      alert("❌ Solo el propietario del contrato puede retirar fondos");
      return;
    }

    setWithdrawing(true);
    try {
      const result = await withdrawAllFunds();
      if (result.success) {
        alert(`✅ Retiro exitoso! Tx: ${result.txHash}`);
      } else {
        alert(`❌ Error en el retiro: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado en el retiro");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawCustom = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!isOwner) {
      alert("❌ Solo el propietario del contrato puede retirar fondos");
      return;
    }

    if (!customAmount || parseFloat(customAmount) <= 0) {
      alert("❌ Ingresa una cantidad válida de AVAX");
      return;
    }

    const contractBalanceNum = parseFloat(contractBalance || "0");
    const customAmountNum = parseFloat(customAmount);

    if (customAmountNum > contractBalanceNum) {
      alert("❌ La cantidad excede el balance del contrato");
      return;
    }

    setWithdrawing(true);
    try {
      const result = await withdrawSpecificAmount(customAmount);
      if (result.success) {
        alert(`✅ Retiro exitoso! Tx: ${result.txHash}`);
        setCustomAmount(""); // Limpiar el input
      } else {
        alert(`❌ Error en el retiro: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado en el retiro");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-2xl hover:shadow-3xl transition-all duration-300 p-8 rounded-3xl max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-orange-400 bg-clip-text text-transparent flex items-center justify-center">
          <Download className="w-8 h-8 mr-2" />
          Retirar AVAX
        </h2>

        {/* Botón de regreso */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-amber-700 hover:text-amber-900 text-sm flex items-center mx-auto font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-amber-100/50 px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a comprar CapyCoins
        </button>

        {!ready ? (
          <div className="flex items-center justify-center p-6 bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl backdrop-blur-sm">
            <Loader2 className="animate-spin h-8 w-8 text-yellow-500" />
            <span className="ml-2 text-amber-800 font-medium">Cargando Privy...</span>
          </div>
        ) : !authenticated ? (
          <div className="space-y-6">
            <p className="text-amber-700 text-lg">Conecta tu wallet para acceder</p>
            <button
              onClick={login}
              className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 shadow-lg hover:shadow-xl px-8 py-4 w-full text-lg flex items-center justify-center"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Conectar Wallet / Login
            </button>
          </div>
        ) : !isOwner ? (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-300 rounded-2xl">
              <Ban className="w-12 h-12 mx-auto mb-2 text-red-500" />
              <p className="text-red-700 font-bold text-lg">Acceso Denegado</p>
              <p className="text-sm text-red-600 mt-2">
                Solo el propietario del contrato puede retirar fondos.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 shadow-md hover:shadow-lg px-8 py-4 w-full text-lg"
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del contrato */}
            <div className="p-6 bg-gradient-to-r from-emerald-100 to-emerald-50 border-2 border-emerald-300 rounded-2xl text-left">
              <p className="text-sm text-amber-800 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                <strong className="text-amber-900">Usuario:</strong>{" "}
                <span className="font-mono text-amber-700 ml-1">
                  {user?.email ? String(user.email) : user?.wallet?.address?.slice(0, 8) + "..."}
                </span>
              </p>
              <p className="text-sm text-amber-800 mb-3 flex items-center">
                <Coins className="w-4 h-4 mr-2" />
                <strong className="text-amber-900">Balance del Contrato:</strong>{" "}
                <span className="font-mono text-emerald-700 font-bold text-lg ml-1">
                  {loading ? "Cargando..." : `${contractBalance || "0"} AVAX`}
                </span>
              </p>
              <p className="text-xs text-emerald-600 font-semibold flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Eres el propietario del contrato
              </p>
            </div>

            {/* Retirar todo */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-amber-800 flex items-center justify-center">
                <Download className="w-5 h-5 mr-2" />
                Retirar Todos los Fondos
              </h3>
              <button
                onClick={handleWithdrawAll}
                disabled={loading || withdrawing || !contractBalance || parseFloat(contractBalance) <= 0}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-red-500 to-red-400 text-white hover:from-red-600 hover:to-red-500 shadow-md hover:shadow-lg px-8 py-4 w-full text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-3" />
                    Retirando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Retirar Todo ({contractBalance || "0"} AVAX)
                  </>
                )}
              </button>
            </div>

            {/* Separador */}
            <div className="border-t border-amber-200 pt-6">
              <h3 className="font-bold text-lg text-amber-800 mb-4 flex items-center justify-center">
                <Download className="w-5 h-5 mr-2" />
                Retirar Cantidad Específica
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-800 mb-3 flex items-center">
                    <Coins className="w-4 h-4 mr-1" />
                    Cantidad de AVAX a retirar:
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={contractBalance || "0"}
                    className="border-2 border-amber-300/50 rounded-xl bg-white/80 backdrop-blur-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all p-4 w-full text-lg font-mono"
                    placeholder="0.1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    disabled={loading || withdrawing}
                  />
                </div>
                
                {customAmount && (
                  <div className="bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl backdrop-blur-sm p-4 text-center">
                    <div className="text-lg font-bold text-amber-800 flex items-center justify-center">
                      <Download className="w-5 h-5 mr-2 text-yellow-500" />
                      Retirarás: <span className="text-yellow-600 ml-1">{customAmount} AVAX</span>
                    </div>
                    <div className="text-sm text-amber-700 mt-1">
                      Restará: {(parseFloat(contractBalance || "0") - parseFloat(customAmount)).toFixed(4)} AVAX
                    </div>
                  </div>
                )}

                <button
                  onClick={handleWithdrawCustom}
                  disabled={loading || withdrawing || !customAmount || parseFloat(customAmount) <= 0}
                  className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400 shadow-md hover:shadow-lg px-8 py-4 w-full text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                      Retirando...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Retirar Cantidad Específica
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Botón de actualizar */}
            <div className="pt-4 border-t border-amber-200">
              <button
                onClick={() => window.location.reload()}
                disabled={loading || withdrawing}
                className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 shadow-md hover:shadow-lg px-6 py-3 w-full disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? "Cargando..." : "Actualizar Balance"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}