import { ethers } from "ethers";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { avalancheFuji } from "viem/chains";
import capyCoinAbi from "./abis/capyCoinAbi.json";
import capyNFTAbi from "./abis/capyNFTAbi.json";
import capyMarketplaceAbi from "./abis/capyMarketplaceAbi.json";

export const CapyCoinAbi = capyCoinAbi;
export const CapyNFTAbi = capyNFTAbi;
export const CapyMarketplaceAbi = capyMarketplaceAbi;

// Direcciones de contratos
export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
export const nftContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_NFT!;
export const marketplaceContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MARKETPLACE!;

export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
});

// Tipo para el wallet
interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export const getWalletClient = (wallet: WalletProvider) => {
  return createWalletClient({
    chain: avalancheFuji,
    transport: custom(wallet)
  });
};

// Funciones para obtener contratos con ethers (si las necesitas)
export function getCapyContract(signer: ethers.Signer) {
  return new ethers.Contract(contractAddress, CapyCoinAbi, signer);
}

export function getNFTContract(signer: ethers.Signer) {
  return new ethers.Contract(nftContractAddress, CapyNFTAbi, signer);
}

export function getMarketplaceContract(signer: ethers.Signer) {
  return new ethers.Contract(marketplaceContractAddress, CapyMarketplaceAbi, signer);
}

// Tipos para NFT
export interface NFTInfo {
  owner: string;
  rarity: number;
  price: bigint;
  isActiveOnMap: boolean;
  location: string;
  metadataURI: string;
}

export interface Listing {
  listingId: bigint;
  tokenId: bigint;
  seller: string;
  price: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  status: number; // 0: Active, 1: Sold, 2: Cancelled, 3: Expired
  isAuction: boolean;
  highestBid: bigint;
  highestBidder: string;
}

export enum Rarity {
  BabyCapy = 0,
  ExploreCapy = 1,
  WiseCapy = 2,
  LegendaryCapy = 3,
  GoldenCapy = 4
}

export const RarityNames = {
  [Rarity.BabyCapy]: "Baby Capy",
  [Rarity.ExploreCapy]: "Explore Capy", 
  [Rarity.WiseCapy]: "Wise Capy",
  [Rarity.LegendaryCapy]: "Legendary Capy",
  [Rarity.GoldenCapy]: "Golden Capy"
};

export const RarityPrices = {
  [Rarity.BabyCapy]: "1",
  [Rarity.ExploreCapy]: "5",
  [Rarity.WiseCapy]: "10", 
  [Rarity.LegendaryCapy]: "20",
  [Rarity.GoldenCapy]: "100"
};