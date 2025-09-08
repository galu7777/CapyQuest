"use client";

import { useState } from "react";
import { useNFT } from "@/hook/useNFT";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { BabyCapy, ExploreCapy, GlodenCapy, LegendaryCapy, WiseCapy } from "@/assets/NFTs";
import { descNFTs } from "@/constant/descNFTs";
import { 
  Coins, 
  Package, 
  Store, 
  RefreshCw, 
  MapPin, 
  ShoppingCart, 
  Sparkles, 
  AlertCircle,
  Wallet,
  Loader2,
  X,
  Flame,
  Info,
  AlertTriangle
} from "lucide-react";

export default function NFTPage() {
  const { nftState, loading, mintNFT, approveCapyCoin, approveCapyCoinForMarketplace, listNFTForSale, buyNFTFromMarketplace, 
    burnNFT, getBurnInfo, reload, reloadListings, isConnected, Rarity, RarityNames, RarityPrices } = useNFT();
  const { ready, authenticated, login } = usePrivy();
  
  const [activeTab, setActiveTab] = useState<'mint' | 'collection' | 'marketplace'>('mint');
  const [selectedRarity, setSelectedRarity] = useState(Rarity.BabyCapy);
  const [approving, setApproving] = useState(false);
  const [minting, setMinting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [listing, setListing] = useState(false);
  const [burning, setBurning] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [burnTokenId, setBurnTokenId] = useState<bigint | null>(null);
  const [burnInfo, setBurnInfo] = useState<{
    nftValue: string;
    feePercentage: number;
    refundAmount: string;
    feeAmount: string;
  } | null>(null);

  // Mapeo de rarezas a imágenes
  const rarityToImage = {
    [Rarity.BabyCapy]: BabyCapy,
    [Rarity.ExploreCapy]: ExploreCapy,
    [Rarity.WiseCapy]: WiseCapy,
    [Rarity.LegendaryCapy]: LegendaryCapy,
    [Rarity.GoldenCapy]: GlodenCapy,
  };

  // Mapeo de rarezas a descripciones
  const rarityToDesc = {
    [Rarity.BabyCapy]: descNFTs[0],
    [Rarity.ExploreCapy]: descNFTs[1],
    [Rarity.WiseCapy]: descNFTs[2],
    [Rarity.LegendaryCapy]: descNFTs[3],
    [Rarity.GoldenCapy]: descNFTs[4],
  };

  const handleMintNFT = async () => {
    if (!authenticated) {
      login();
      return;
    }

    const requiredAmount = RarityPrices[selectedRarity];
    const currentBalance = parseFloat(nftState.capyCoinBalance);
    const currentAllowance = parseFloat(nftState.capyCoinAllowance);

    if (currentBalance < parseFloat(requiredAmount)) {
      alert(`❌ Balance insuficiente. Necesitas ${requiredAmount} CYC`);
      return;
    }

    if (currentAllowance < parseFloat(requiredAmount)) {
      setApproving(true);
      try {
        const approveResult = await approveCapyCoin("1000");
        if (!approveResult.success) {
          alert(`❌ Error aprobando CapyCoin: ${approveResult.error}`);
          return;
        }
        alert("✅ CapyCoin aprobado correctamente!");
      } catch (error) {
        console.error("Error aprobando:", error);
        alert("❌ Error inesperado aprobando CapyCoin");
        return;
      } finally {
        setApproving(false);
      }
    }

    setMinting(true);
    try {
      const result = await mintNFT(selectedRarity);
      if (result.success) {
        alert(`✅ NFT ${RarityNames[selectedRarity]} minteado correctamente! Tx: ${result.txHash}`);
      } else {
        alert(`❌ Error minteando NFT: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado minteando NFT");
    } finally {
      setMinting(false);
    }
  };

  const handleBuyFromMarketplace = async (listingId: bigint, price: string) => {
    if (!authenticated) {
      login();
      return;
    }

    const currentBalance = parseFloat(nftState.capyCoinBalance);
    if (currentBalance < parseFloat(price)) {
      alert(`❌ Balance insuficiente. Necesitas ${price} CYC`);
      return;
    }

    setBuying(true);
    try {
      const approveResult = await approveCapyCoinForMarketplace("10000");
      if (!approveResult.success) {
        alert(`❌ Error aprobando CapyCoin: ${approveResult.error}`);
        return;
      }

      const result = await buyNFTFromMarketplace(listingId);
      if (result.success) {
        alert(`✅ NFT comprado correctamente! Tx: ${result.txHash}`);
      } else {
        alert(`❌ Error comprando NFT: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado comprando NFT");
    } finally {
      setBuying(false);
    }
  };

  const handleListNFT = async () => {
    if (!selectedTokenId || !listPrice || parseFloat(listPrice) <= 0) {
      alert("❌ Selecciona un NFT y precio válido");
      return;
    }

    setListing(true);
    try {
      const result = await listNFTForSale(selectedTokenId, listPrice);
      if (result.success) {
        alert(`✅ NFT listado correctamente! Tx: ${result.txHash}`);
        setSelectedTokenId(null);
        setListPrice("");
      } else {
        alert(`❌ Error listando NFT: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado listando NFT");
    } finally {
      setListing(false);
    }
  };

  // NUEVA: Manejar burn de NFT
  const handleBurnNFT = async () => {
    if (!burnTokenId) return;

    const confirmBurn = confirm(
      `🔥 ¿Estás seguro de que quieres quemar este NFT?\n\n` +
      `Recibirás: ${burnInfo?.refundAmount} CYC\n` +
      `Fee: ${burnInfo?.feeAmount} CYC (${(burnInfo?.feePercentage || 0) / 100}%)\n\n` +
      `⚠️ Esta acción NO SE PUEDE DESHACER`
    );

    if (!confirmBurn) return;

    setBurning(true);
    try {
      const result = await burnNFT(burnTokenId);
      if (result.success) {
        alert(`✅ NFT quemado correctamente! Recibiste ${burnInfo?.refundAmount} CYC. Tx: ${result.txHash}`);
        setBurnTokenId(null);
        setBurnInfo(null);
      } else {
        alert(`❌ Error quemando NFT: ${result.error}`);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("❌ Error inesperado quemando NFT");
    } finally {
      setBurning(false);
    }
  };

  // NUEVA: Abrir modal de burn
  const openBurnModal = async (tokenId: bigint) => {
    setBurnTokenId(tokenId);
    const info = await getBurnInfo(tokenId);
    setBurnInfo(info);
  };

  const getRarityColor = (rarity: number) => {
    const colors = {
      [Rarity.BabyCapy]: "from-green-400 to-green-600",
      [Rarity.ExploreCapy]: "from-blue-400 to-blue-600", 
      [Rarity.WiseCapy]: "from-purple-400 to-purple-600",
      [Rarity.LegendaryCapy]: "from-red-400 to-red-600",
      [Rarity.GoldenCapy]: "from-yellow-400 to-yellow-600",
    };
    return colors[rarity] || "from-gray-400 to-gray-600";
  };

  const getRarityBorder = (rarity: number) => {
    const borders = {
      [Rarity.BabyCapy]: "border-green-300",
      [Rarity.ExploreCapy]: "border-blue-300",
      [Rarity.WiseCapy]: "border-purple-300", 
      [Rarity.LegendaryCapy]: "border-red-300",
      [Rarity.GoldenCapy]: "border-yellow-300",
    };
    return borders[rarity] || "border-gray-300";
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-500 to-orange-400 bg-clip-text text-transparent">
          CapyNFT Collection 
        </h1>

        {!ready ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-12 w-12 text-yellow-500" />
            <span className="ml-4 text-amber-800 text-xl">Cargando Privy...</span>
          </div>
        ) : !authenticated ? (
          <div className="text-center space-y-6 bg-white/90 backdrop-blur-sm p-8 rounded-3xl border-2 border-amber-200 shadow-xl">
            <p className="text-amber-700 text-xl">Conecta tu wallet para interactuar con los NFTs</p>
            <button
              onClick={login}
              className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 shadow-lg hover:shadow-xl px-8 py-4 text-lg flex items-center justify-center mx-auto"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Conectar Wallet / Login
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance Info */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-xl rounded-3xl p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Balance CapyCoin</p>
                  <p className="text-2xl font-bold text-amber-800 flex items-center justify-center">
                    <Coins className="w-5 h-5 mr-1" />
                    {parseFloat(nftState.capyCoinBalance).toFixed(2)} CYC
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">NFTs en colección</p>
                  <p className="text-2xl font-bold text-amber-800 flex items-center justify-center">
                    <Package className="w-5 h-5 mr-1" />
                    {nftState.userNFTs.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-white/90 backdrop-blur-sm rounded-2xl p-2 border-2 border-amber-200">
              <button
                onClick={() => setActiveTab('mint')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  activeTab === 'mint'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 shadow-lg'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Mintear NFT
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  activeTab === 'collection'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 shadow-lg'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Package className="w-5 h-5 mr-2" />
                Mi Colección
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  activeTab === 'marketplace'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 shadow-lg'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Store className="w-5 h-5 mr-2" />
                Marketplace
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'mint' && (
              <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-xl rounded-3xl p-8 space-y-6">
                <h2 className="text-2xl font-bold text-amber-800 text-center">Mintear nuevo CapyNFT</h2>
                
                {/* Rarity Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(RarityNames).map(([rarityValue, name]) => {
                    const rarity = parseInt(rarityValue) as typeof Rarity[keyof typeof Rarity];
                    const price = RarityPrices[rarity];
                    const isSelected = selectedRarity === rarity;
                    
                    return (
                      <button
                        key={rarity}
                        onClick={() => setSelectedRarity(rarity)}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                          isSelected 
                            ? `bg-gradient-to-br ${getRarityColor(rarity)} text-white border-transparent shadow-lg`
                            : `bg-white/50 ${getRarityBorder(rarity)} text-amber-800 hover:shadow-md`
                        }`}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-lg font-bold">{name}</div>
                          <div className="text-sm opacity-90 flex items-center justify-center">
                            <Coins className="w-4 h-4 mr-1" />
                            {price} CYC
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NFT Preview */}
                <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-2xl p-6">
                  <div className="flex-shrink-0">
                    <Image
                      src={rarityToImage[selectedRarity]}
                      alt={RarityNames[selectedRarity]}
                      width={200}
                      height={200}
                      className="rounded-xl shadow-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-800 mb-2">
                      {rarityToDesc[selectedRarity].title}
                    </h3>
                    <p className="text-amber-700">
                      {rarityToDesc[selectedRarity].description}
                    </p>
                  </div>
                </div>

                {/* Mint Button */}
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-yellow-100/50 to-orange-100/50 border border-yellow-300/40 rounded-xl p-4">
                    <p className="text-amber-800">
                      <strong>Costo:</strong> {RarityPrices[selectedRarity]} CYC
                    </p>
                    <p className="text-amber-800">
                      <strong>Disponible:</strong> {parseFloat(nftState.capyCoinBalance).toFixed(2)} CYC
                    </p>
                    {parseFloat(nftState.capyCoinAllowance) < parseFloat(RarityPrices[selectedRarity]) && (
                      <p className="text-orange-600 text-sm mt-2 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Necesitas aprobar CapyCoin primero
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleMintNFT}
                    disabled={loading || approving || minting || parseFloat(nftState.capyCoinBalance) < parseFloat(RarityPrices[selectedRarity])}
                    className="font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 shadow-lg hover:shadow-xl px-8 py-4 w-full max-w-md mx-auto text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-3" />
                        Aprobando CapyCoin...
                      </>
                    ) : minting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-3" />
                        Minteando NFT...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Mintear {RarityNames[selectedRarity]}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'collection' && (
              <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-xl rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-amber-800">Mi Colección</h2>
                  <button
                    onClick={reload}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Cargando..." : "Recargar"}
                  </button>
                </div>

                {nftState.userNFTs.length === 0 ? (
                  <div className="text-center py-12 text-amber-600">
                    <Package className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                    <p className="text-xl">No tienes NFTs aún</p>
                    <p className="text-sm mt-2">¡Ve a la pestaña "Mintear NFT" para conseguir tu primer CapyNFT!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nftState.userNFTs.map((nft) => (
                      <div
                        key={nft.tokenId.toString()}
                        className={`bg-white/80 backdrop-blur-sm border-2 ${getRarityBorder(nft.rarity)} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
                      >
                        <div className="space-y-4">
                          {/* NFT Image */}
                          <div className="relative">
                            <Image
                              src={rarityToImage[nft.rarity]}
                              alt={nft.rarityName}
                              width={200}
                              height={200}
                              className="w-full h-48 object-cover rounded-xl"
                            />
                            <div className={`absolute top-2 right-2 px-2 py-1 bg-gradient-to-r ${getRarityColor(nft.rarity)} text-white text-xs font-bold rounded-full flex items-center`}>
                              {nft.rarityName}
                            </div>
                            {/* NUEVO: Indicador de NFT activo en mapa */}
                            {nft.isActiveOnMap && (
                              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                En Mapa
                              </div>
                            )}
                          </div>

                          {/* NFT Info */}
                          <div className="space-y-2">
                            <h3 className="font-bold text-amber-800">Token ID: #{nft.tokenId.toString()}</h3>
                            <p className="text-sm text-amber-700 flex items-center">
                              <Coins className="w-4 h-4 mr-1" />
                              Precio original: {nft.price} CYC
                            </p>
                            <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                              <p className="text-xs text-amber-700 font-semibold">{rarityToDesc[nft.rarity].title}</p>
                              <p className="text-xs text-amber-600 mt-1 line-clamp-2">{rarityToDesc[nft.rarity].description}</p>
                            </div>
                            {nft.isActiveOnMap && (
                              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full inline-flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                Ubicación: {nft.location}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            {/* MODIFICADO: Botón de vender deshabilitado si está activo en mapa */}
                            <button
                              onClick={() => setSelectedTokenId(nft.tokenId)}
                              disabled={nft.isActiveOnMap}
                              className={`w-full px-4 py-2 font-semibold rounded-lg transition-all flex items-center justify-center ${
                                nft.isActiveOnMap
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-orange-400 to-orange-300 text-amber-900 hover:from-orange-500 hover:to-orange-400'
                              }`}
                            >
                              <Store className="w-4 h-4 mr-2" />
                              {nft.isActiveOnMap ? 'No se puede vender (En Mapa)' : 'Vender en Marketplace'}
                            </button>

                            {/* NUEVO: Botón para quemar NFT - deshabilitado si está activo en mapa */}
                            <button
                              onClick={() => openBurnModal(nft.tokenId)}
                              disabled={nft.isActiveOnMap}
                              className={`w-full px-4 py-2 font-semibold rounded-lg transition-all flex items-center justify-center ${
                                nft.isActiveOnMap
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-red-500 to-red-400 text-white hover:from-red-600 hover:to-red-500'
                              }`}
                            >
                              <Flame className="w-4 h-4 mr-2" />
                              {nft.isActiveOnMap ? 'No se puede quemar (En Mapa)' : 'Quemar por CYC'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lista NFT Modal */}
                {selectedTokenId && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-amber-800">Vender NFT #{selectedTokenId.toString()}</h3>
                        <button
                          onClick={() => {
                            setSelectedTokenId(null);
                            setListPrice("");
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-amber-800 mb-2">
                          Precio de venta (CYC):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="border-2 border-amber-300/50 rounded-xl bg-white/80 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all p-3 w-full"
                          placeholder="10.00"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setSelectedTokenId(null);
                            setListPrice("");
                          }}
                          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleListNFT}
                          disabled={listing || !listPrice || parseFloat(listPrice) <= 0}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {listing ? (
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          ) : (
                            <Store className="w-4 h-4 mr-2" />
                          )}
                          {listing ? "Listando..." : "Listar NFT"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NUEVO: Burn NFT Modal */}
                {burnTokenId && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-red-800 flex items-center">
                          <Flame className="w-6 h-6 mr-2" />
                          Quemar NFT #{burnTokenId.toString()}
                        </h3>
                        <button
                          onClick={() => {
                            setBurnTokenId(null);
                            setBurnInfo(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Información de burn */}
                      {burnInfo && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                          <div className="flex items-center text-red-800 text-sm font-semibold">
                            <Info className="w-4 h-4 mr-2" />
                            Información del quemado:
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Valor del NFT:</strong> {burnInfo.nftValue} CYC</p>
                            <p><strong>Fee ({burnInfo.feePercentage / 100}%):</strong> {burnInfo.feeAmount} CYC</p>
                            <p className="text-green-700"><strong>Recibirás:</strong> {burnInfo.refundAmount} CYC</p>
                          </div>
                          <div className="bg-yellow-100 border border-yellow-400 rounded p-2 mt-2">
                            <div className="flex items-center text-yellow-800 text-xs">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              <strong>¡ADVERTENCIA!</strong>
                            </div>
                            <p className="text-yellow-800 text-xs mt-1">
                              Esta acción NO SE PUEDE DESHACER. El NFT será destruido permanentemente.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setBurnTokenId(null);
                            setBurnInfo(null);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleBurnNFT}
                          disabled={burning || !burnInfo}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {burning ? (
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          ) : (
                            <Flame className="w-4 h-4 mr-2" />
                          )}
                          {burning ? "Quemando..." : "Confirmar Quemado"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-xl rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-amber-800">Marketplace</h2>
                  <button
                    onClick={reloadListings}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Cargando..." : "Recargar"}
                  </button>
                </div>

                {nftState.activeListings.length === 0 ? (
                  <div className="text-center py-12 text-amber-600">
                    <Store className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                    <p className="text-xl">No hay NFTs en venta</p>
                    <p className="text-sm mt-2">¡Sé el primero en listar un NFT!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nftState.activeListings.map((listing) => {
                      const priceInCYC = parseFloat((Number(listing.price) / 1e18).toFixed(2));
                      const isExpired = Number(listing.expiresAt) * 1000 < Date.now();
                      
                      // Usar la rareza real del listing
                      const nftRarity = listing.rarity || Rarity.BabyCapy;
                      
                      return (
                        <div
                          key={listing.listingId.toString()}
                          className={`bg-white/80 backdrop-blur-sm border-2 ${getRarityBorder(nftRarity)} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}
                        >
                          <div className="space-y-4">
                            {/* NFT Image */}
                            <div className="w-full h-48 relative">
                              <Image
                                src={rarityToImage[nftRarity]}
                                alt={RarityNames[nftRarity]}
                                fill
                                className="object-cover rounded-xl"
                              />
                              <div className={`absolute top-2 right-2 px-2 py-1 bg-gradient-to-r ${getRarityColor(nftRarity)} text-white text-xs font-bold rounded-full flex items-center`}>
                                {RarityNames[nftRarity]}
                              </div>
                            </div>

                            {/* Listing Info */}
                            <div className="space-y-2">
                              <h3 className="font-bold text-amber-800">NFT #{listing.tokenId.toString()}</h3>
                              <p className="text-lg font-bold text-amber-900 flex items-center">
                                <Coins className="w-5 h-5 mr-1" />
                                {priceInCYC} CYC
                              </p>
                              <p className="text-sm text-amber-700">
                                Vendedor: {listing.seller.slice(0, 8)}...
                              </p>
                              <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                                <p className="text-xs text-amber-700 font-semibold">{rarityToDesc[nftRarity].title}</p>
                                <p className="text-xs text-amber-600 mt-1 line-clamp-2">{rarityToDesc[nftRarity].description}</p>
                              </div>
                              {listing.isAuction && (
                                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full inline-flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Subasta
                                </div>
                              )}
                              {isExpired && (
                                <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full inline-flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Expirado
                                </div>
                              )}
                            </div>

                            {/* Buy Button */}
                            <button
                              onClick={() => handleBuyFromMarketplace(listing.listingId, priceInCYC.toString())}
                              disabled={buying || isExpired || parseFloat(nftState.capyCoinBalance) < priceInCYC}
                              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-400 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {buying ? (
                                <>
                                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                  Comprando...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Comprar por {priceInCYC} CYC
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}