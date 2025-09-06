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

// Extender la interfaz Listing para incluir la rareza
interface ExtendedListing extends Listing {
  rarity: number;
  rarityName: string;
}

interface NFTState {
  userNFTs: UserNFT[];
  activeListings: ExtendedListing[];
  capyCoinBalance: string;
  capyCoinAllowance: string;
}

export function useNFT() {
  const { user, ready, authenticated } = usePrivy();
  const [nftState, setNFTState] = useState<NFTState>({
    userNFTs: [],
    activeListings: [],
    capyCoinBalance: "0",
    capyCoinAllowance: "0",
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

      setNFTState(prev => ({
        ...prev,
        userNFTs: nftsWithInfo,
        capyCoinBalance: formatUnits(capyCoinBalance, 18),
        capyCoinAllowance: formatUnits(allowance, 18),
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

  // Cargar listados activos del marketplace
  const loadActiveListings = useCallback(async () => {
    if (!ready) return;

    try {
      const listings = await publicClient.readContract({
        address: marketplaceContractAddress as `0x${string}`,
        abi: CapyMarketplaceAbi,
        functionName: "getActiveListings",
        args: [0n, 50n], // offset: 0, limit: 50
      }) as Listing[];

      // Obtener información de rareza para cada NFT listado
      const extendedListings: ExtendedListing[] = [];
      
      for (const listing of listings) {
        try {
          // Obtener información del NFT para saber su rareza
          const nftInfo = await publicClient.readContract({
            address: nftContractAddress as `0x${string}`,
            abi: CapyNFTAbi,
            functionName: "getNFTInfo",
            args: [listing.tokenId],
          }) as [string, number, bigint, boolean, string, string];

          const [owner, rarity, price, isActiveOnMap, location, metadataURI] = nftInfo;

          extendedListings.push({
            ...listing,
            rarity,
            rarityName: RarityNames[rarity as Rarity] || "Unknown",
          });
        } catch (err) {
          console.error(`Error loading NFT info for listing ${listing.listingId}:`, err);
          // Si hay error, usar valores por defecto
          extendedListings.push({
            ...listing,
            rarity: Rarity.BabyCapy,
            rarityName: RarityNames[Rarity.BabyCapy],
          });
        }
      }

      setNFTState(prev => ({
        ...prev,
        activeListings: extendedListings,
      }));

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error loading active listings:", err.message);
      } else {
        console.error("Error loading active listings:", err);
      }
    }
  }, [ready]);

  // Aprobar CapyCoin para el contrato NFT
  const approveCapyCoin = useCallback(
    async (amount: string) => {
      if (!ready || !authenticated || !user?.wallet?.address) {
        return { success: false, error: "No wallet connected" };
      }

      try {
        setLoading(true);

        if (!window.ethereum) {
          return { success: false, error: "MetaMask no está instalado" };
        }

        const account = user.wallet.address as `0x${string}`;
        const amountWei = parseUnits(amount, 18);
        const walletClient = getWalletClient(window.ethereum);

        const txHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: CapyCoinAbi,
          functionName: "approve",
          args: [nftContractAddress, amountWei],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        await loadUserNFTs();

        return { success: true, txHash };
      } catch (err: unknown) {
        let errorMessage = "Error desconocido";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        if (errorMessage.includes("user rejected")) {
          errorMessage = "Transacción cancelada por el usuario";
        }
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [ready, authenticated, user, loadUserNFTs]
  );

  // Comprar NFT
  const mintNFT = useCallback(
    async (rarity: Rarity) => {
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
          functionName: "mintNFT",
          args: [rarity],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        await loadUserNFTs();

        return { success: true, txHash };
      } catch (err: unknown) {
        let errorMessage = "Error desconocido";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        if (errorMessage.includes("Insufficient CapyCoin balance")) {
          errorMessage = "Balance insuficiente de CapyCoin";
        } else if (errorMessage.includes("ERC20: insufficient allowance")) {
          errorMessage = "Debes aprobar CapyCoin primero";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transacción cancelada por el usuario";
        }
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [ready, authenticated, user, loadUserNFTs]
  );

  // Listar NFT en el marketplace
  const listNFTForSale = useCallback(
    async (tokenId: bigint, price: string) => {
      if (!ready || !authenticated || !user?.wallet?.address) {
        return { success: false, error: "No wallet connected" };
      }

      try {
        setLoading(true);

        if (!window.ethereum) {
          return { success: false, error: "MetaMask no está instalado" };
        }

        const account = user.wallet.address as `0x${string}`;
        const priceWei = parseUnits(price, 18);
        const walletClient = getWalletClient(window.ethereum);

        // Primero aprobar el NFT al marketplace
        const approveHash = await walletClient.writeContract({
          address: nftContractAddress as `0x${string}`,
          abi: CapyNFTAbi,
          functionName: "approve",
          args: [marketplaceContractAddress, tokenId],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Luego listar el NFT
        const listHash = await walletClient.writeContract({
          address: marketplaceContractAddress as `0x${string}`,
          abi: CapyMarketplaceAbi,
          functionName: "listNFTDefault",
          args: [tokenId, priceWei],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: listHash });
        await loadUserNFTs();
        await loadActiveListings();

        return { success: true, txHash: listHash };
      } catch (err: unknown) {
        let errorMessage = "Error desconocido";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        if (errorMessage.includes("Not the owner")) {
          errorMessage = "No eres el propietario de este NFT";
        } else if (errorMessage.includes("NFT already listed")) {
          errorMessage = "NFT ya está listado";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transacción cancelada por el usuario";
        }
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [ready, authenticated, user, loadUserNFTs, loadActiveListings]
  );

  // Comprar NFT del marketplace
  const buyNFTFromMarketplace = useCallback(
    async (listingId: bigint) => {
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
          address: marketplaceContractAddress as `0x${string}`,
          abi: CapyMarketplaceAbi,
          functionName: "buyNFT",
          args: [listingId],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        await loadUserNFTs();
        await loadActiveListings();

        return { success: true, txHash };
      } catch (err: unknown) {
        let errorMessage = "Error desconocido";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        if (errorMessage.includes("Insufficient CapyCoin balance")) {
          errorMessage = "Balance insuficiente de CapyCoin";
        } else if (errorMessage.includes("ERC20: insufficient allowance")) {
          errorMessage = "Debes aprobar CapyCoin para el marketplace";
        } else if (errorMessage.includes("Listing not active")) {
          errorMessage = "Este NFT ya no está disponible";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transacción cancelada por el usuario";
        }
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [ready, authenticated, user, loadUserNFTs, loadActiveListings]
  );

  // Aprobar CapyCoin para el marketplace
  const approveCapyCoinForMarketplace = useCallback(
    async (amount: string) => {
      if (!ready || !authenticated || !user?.wallet?.address) {
        return { success: false, error: "No wallet connected" };
      }

      try {
        setLoading(true);

        if (!window.ethereum) {
          return { success: false, error: "MetaMask no está instalado" };
        }

        const account = user.wallet.address as `0x${string}`;
        const amountWei = parseUnits(amount, 18);
        const walletClient = getWalletClient(window.ethereum);

        const txHash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: CapyCoinAbi,
          functionName: "approve",
          args: [marketplaceContractAddress, amountWei],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        await loadUserNFTs();

        return { success: true, txHash };
      } catch (err: unknown) {
        let errorMessage = "Error desconocido";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        if (errorMessage.includes("user rejected")) {
          errorMessage = "Transacción cancelada por el usuario";
        }
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [ready, authenticated, user, loadUserNFTs]
  );

  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      loadUserNFTs();
    }
  }, [ready, authenticated, user?.wallet?.address, loadUserNFTs]);

  useEffect(() => {
    if (ready) {
      loadActiveListings();
    }
  }, [ready, loadActiveListings]);

  return {
    nftState,
    loading,
    mintNFT,
    approveCapyCoin,
    approveCapyCoinForMarketplace,
    listNFTForSale,
    buyNFTFromMarketplace,
    reload: loadUserNFTs,
    reloadListings: loadActiveListings,
    isConnected: authenticated && !!user?.wallet?.address,
    Rarity,
    RarityNames,
    RarityPrices,
  };
}