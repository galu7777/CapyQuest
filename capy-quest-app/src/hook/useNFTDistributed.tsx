// hooks/useNFT.ts
import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { 
  contractAddress, 
  nftContractAddress, 
  marketplaceContractAddress,
  CapyCoinAbi, 
  CapyNFTAbi,
  CapyMarketplaceAbi,
  publicClient, 
  getWalletClient,
  NFTInfo,
  Listing,
  Rarity,
  RarityNames,
  RarityPrices
} from "@/utils/contract";
import { parseUnits, formatUnits } from "viem";

interface UserNFT {
  tokenId: bigint;
  rarity: number;
  rarityName: string;
  price: string;
  isActiveOnMap: boolean;
  location: string;
  metadataURI: string;
}

interface ExtendedListing extends Listing {
  rarity: number;
  rarityName: string;
}

interface NFTState {
  userNFTs: UserNFT[];
  activeListings: ExtendedListing[];
  capyCoinBalance: string;
  capyCoinAllowance: string;
  distributedNFTs: UserNFT[];
}

interface Coordinates {
  lng: number;
  lat: number;
}

export function useNFTDistributed() {
  const { user, ready, authenticated } = usePrivy();
  const [nftState, setNFTState] = useState<NFTState>({
    userNFTs: [],
    activeListings: [],
    capyCoinBalance: "0",
    capyCoinAllowance: "0",
    distributedNFTs: [],
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos de NFT del usuario
  const loadUserNFTs = useCallback(async () => {
    if (!ready || !authenticated || !user?.wallet?.address) return;

    try {
      setLoading(true);
      const address = user.wallet.address as `0x${string}`;

      // Obtener NFTs del usuario
      const userNFTIds = await publicClient.readContract({
        address: nftContractAddress as `0x${string}`,
        abi: CapyNFTAbi,
        functionName: "getUserNFTs",
        args: [address],
      }) as bigint[];

      // Obtener información detallada de cada NFT
      const nftsWithInfo: UserNFT[] = [];
      for (const tokenId of userNFTIds) {
        try {
          const nftInfo = await publicClient.readContract({
            address: nftContractAddress as `0x${string}`,
            abi: CapyNFTAbi,
            functionName: "getNFTInfo",
            args: [tokenId],
          }) as [string, number, bigint, boolean, string, string];

          const [owner, rarity, price, isActiveOnMap, location, metadataURI] = nftInfo;

          nftsWithInfo.push({
            tokenId,
            rarity,
            rarityName: RarityNames[rarity as Rarity] || "Unknown",
            price: formatUnits(price, 18),
            isActiveOnMap,
            location,
            metadataURI,
          });
        } catch (err) {
          console.error(`Error loading NFT ${tokenId}:`, err);
        }
      }

      // Obtener balance de CapyCoin
      const capyCoinBalance = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: CapyCoinAbi,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;

      // Obtener allowance para el contrato NFT
      const allowance = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: CapyCoinAbi,
        functionName: "allowance",
        args: [address, nftContractAddress],
      }) as bigint;

      // Cargar NFTs distribuidos en el mapa
      const distributedNFTs = await loadDistributedNFTs();

      setNFTState(prev => ({
        ...prev,
        userNFTs: nftsWithInfo,
        capyCoinBalance: formatUnits(capyCoinBalance, 18),
        capyCoinAllowance: formatUnits(allowance, 18),
        distributedNFTs,
      }));

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error loading user NFTs:", err.message);
      } else {
        console.error("Error loading user NFTs:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [ready, authenticated, user]);

  // Cargar NFTs distribuidos en el mapa
  const loadDistributedNFTs = useCallback(async () => {
    try {
      const activeNFTs = await publicClient.readContract({
        address: nftContractAddress as `0x${string}`,
        abi: CapyNFTAbi,
        functionName: "getActiveNFTs",
        args: [],
      }) as bigint[];

      const distributedNFTs: UserNFT[] = [];
      for (const tokenId of activeNFTs) {
        try {
          const nftInfo = await publicClient.readContract({
            address: nftContractAddress as `0x${string}`,
            abi: CapyNFTAbi,
            functionName: "getNFTInfo",
            args: [tokenId],
          }) as [string, number, bigint, boolean, string, string];

          const [owner, rarity, price, isActiveOnMap, location, metadataURI] = nftInfo;

          distributedNFTs.push({
            tokenId,
            rarity,
            rarityName: RarityNames[rarity as Rarity] || "Unknown",
            price: formatUnits(price, 18),
            isActiveOnMap,
            location,
            metadataURI,
          });
        } catch (err) {
          console.error(`Error loading distributed NFT ${tokenId}:`, err);
        }
      }

      return distributedNFTs;
    } catch (err) {
      console.error("Error loading distributed NFTs:", err);
      return [];
    }
  }, []);

  // Distribuir NFT en el mapa
  const distributeNFT = useCallback(async (tokenId: bigint, location: string) => {
    if (!ready || !authenticated || !user?.wallet?.address) {
      return { success: false, error: "No wallet connected" };
    }

    try {
      setLoading(true);

      if (!window.ethereum) {
        return { success: false, error: "MetaMask no está instalado" };
      }

      const account = user.wallet.address as `0x${string}`;
      const walletClient = getWalletClient(window.ethereum);

      const txHash = await walletClient.writeContract({
        address: nftContractAddress as `0x${string}`,
        abi: CapyNFTAbi,
        functionName: "distributeNFT",
        args: [tokenId, location],
        account,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Recargar NFTs del usuario y NFTs distribuidos
      await loadUserNFTs();
      const distributedNFTs = await loadDistributedNFTs();
      
      setNFTState(prev => ({
        ...prev,
        distributedNFTs,
      }));

      return { success: true, txHash };
    } catch (err: unknown) {
      let errorMessage = "Error desconocido";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (errorMessage.includes("Not the owner")) {
        errorMessage = "No eres el propietario de este NFT";
      } else if (errorMessage.includes("NFT already active on map")) {
        errorMessage = "NFT ya está distribuido en el mapa";
      } else if (errorMessage.includes("user rejected")) {
        errorMessage = "Transacción cancelada por el usuario";
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [ready, authenticated, user, loadUserNFTs, loadDistributedNFTs]);

  // Reclamar NFT del mapa
  const claimNFT = useCallback(async (tokenId: bigint, location: string) => {
    if (!ready || !authenticated || !user?.wallet?.address) {
      return { success: false, error: "No wallet connected" };
    }

    try {
      setLoading(true);

      if (!window.ethereum) {
        return { success: false, error: "MetaMask no está instalado" };
      }

      const account = user.wallet.address as `0x${string}`;
      const walletClient = getWalletClient(window.ethereum);

      // Esta función debería ser llamada por un oracle/backend en producción
      // Para este ejemplo, asumimos que el usuario puede reclamar directamente
      const txHash = await walletClient.writeContract({
        address: nftContractAddress as `0x${string}`,
        abi: CapyNFTAbi,
        functionName: "claimNFT",
        args: [tokenId, account, location],
        account,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Recargar NFTs del usuario y NFTs distribuidos
      await loadUserNFTs();
      const distributedNFTs = await loadDistributedNFTs();
      
      setNFTState(prev => ({
        ...prev,
        distributedNFTs,
      }));

      return { success: true, txHash };
    } catch (err: unknown) {
      let errorMessage = "Error desconocido";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      if (errorMessage.includes("NFT not active on map")) {
        errorMessage = "NFT no está activo en el mapa";
      } else if (errorMessage.includes("user rejected")) {
        errorMessage = "Transacción cancelada por el usuario";
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [ready, authenticated, user, loadUserNFTs, loadDistributedNFTs]);

  // Generar ubicación aleatoria dentro de un polígono
  const generateRandomLocationInPolygon = useCallback((polygon: Coordinates[]): string => {
    if (polygon.length < 3) {
      throw new Error("El polígono necesita al menos 3 puntos");
    }

    // Encontrar los límites del polígono
    let minLng = polygon[0].lng;
    let maxLng = polygon[0].lng;
    let minLat = polygon[0].lat;
    let maxLat = polygon[0].lat;

    polygon.forEach(point => {
      minLng = Math.min(minLng, point.lng);
      maxLng = Math.max(maxLng, point.lng);
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
    });

    // Generar puntos aleatorios hasta encontrar uno dentro del polígono
    let randomLng: number, randomLat: number;
    let isInside = false;

    while (!isInside) {
      randomLng = minLng + Math.random() * (maxLng - minLng);
      randomLat = minLat + Math.random() * (maxLat - minLat);

      isInside = isPointInPolygon({ lng: randomLng, lat: randomLat }, polygon);
    }

    return `${randomLat.toFixed(6)},${randomLng.toFixed(6)}`;
  }, []);

  // Verificar si un punto está dentro de un polígono
  const isPointInPolygon = useCallback((point: Coordinates, polygon: Coordinates[]): boolean => {
    const x = point.lng;
    const y = point.lat;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }, []);

  // Calcular distancia entre dos puntos en metros
  const calculateDistance = useCallback((point1: Coordinates, point2: Coordinates): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      loadUserNFTs();
    }
  }, [ready, authenticated, user?.wallet?.address, loadUserNFTs]);

  return {
    nftState,
    loading,
    distributeNFT,
    claimNFT,
    generateRandomLocationInPolygon,
    calculateDistance,
    reload: loadUserNFTs,
    reloadDistributedNFTs: loadDistributedNFTs,
    isConnected: authenticated && !!user?.wallet?.address,
    Rarity,
    RarityNames,
    RarityPrices,
  };
}