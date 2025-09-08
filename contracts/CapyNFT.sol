// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CapyNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    // Dirección del contrato CapyCoin
    IERC20 public capyCoinToken;
    
    // Contador de tokens
    uint256 private _nextTokenId = 1;
    
    // Fee del contrato (escalonado basado en valor del NFT)
    // Se eliminó feePercentage fijo, ahora se calcula dinámicamente
    
    // Dirección donde se acumulan los fees
    address public feeRecipient;
    
    // Estados de rareza y precios
    enum Rarity {
        BabyCapy,       // 0 - 1 CapyCoin
        ExploreCapy,    // 1 - 5 CapyCoins  
        WiseCapy,       // 2 - 10 CapyCoins
        LegendaryCapy,  // 3 - 20 CapyCoins
        GoldenCapy      // 4 - 100 CapyCoins
    }
    
    // Mapeo de rareza a precio en CapyCoins (con decimales)
    mapping(Rarity => uint256) public rarityPrices;
    
    // Mapeo de rareza a URI de metadatos
    mapping(Rarity => string) public rarityURIs;
    
    // Mapeo de token ID a rareza
    mapping(uint256 => Rarity) public tokenRarity;
    
    // Mapeo de token ID a estado activo en mapa
    mapping(uint256 => bool) public tokenActiveOnMap;
    
    // Mapeo de token ID a coordenadas (para tracking)
    mapping(uint256 => string) public tokenLocation;
    
    // Mapeo de token ID a minter original
    mapping(uint256 => address) public tokenOriginalMinter;
    
    // NUEVO: Mapeo para rastrear quien distribuyó cada NFT
    mapping(uint256 => address) public tokenDistributor;
    
    // Eventos
    event NFTMinted(address indexed to, uint256 indexed tokenId, Rarity rarity, uint256 price);
    event NFTDistributed(uint256 indexed tokenId, string location, address indexed owner);
    event NFTClaimed(uint256 indexed tokenId, address indexed claimer, uint256 rewardAmount, uint256 feeAmount);
    event NFTBurned(uint256 indexed tokenId, address indexed owner, uint256 refundAmount, uint256 feeAmount);
    event PriceUpdated(Rarity rarity, uint256 newPrice);
    event URIUpdated(Rarity rarity, string newURI);
    event FeeRecipientUpdated(address newFeeRecipient);

    constructor(
        address _capyCoinToken,
        address _feeRecipient,
        address initialOwner
    ) ERC721("CapyNFT", "CNFT") Ownable(initialOwner) {
        capyCoinToken = IERC20(_capyCoinToken);
        feeRecipient = _feeRecipient;
        
        // Configurar precios iniciales (con 18 decimales como CapyCoin)
        rarityPrices[Rarity.BabyCapy] = 1 * 10**18;      // 1 CYC
        rarityPrices[Rarity.ExploreCapy] = 5 * 10**18;  // 5 CYC
        rarityPrices[Rarity.WiseCapy] = 10 * 10**18;     // 10 CYC
        rarityPrices[Rarity.LegendaryCapy] = 20 * 10**18; // 20 CYC
        rarityPrices[Rarity.GoldenCapy] = 100 * 10**18;   // 100 CYC
        
        // Configurar URIs iniciales (REEMPLAZA CON TUS HASHES IPFS REALES)
        rarityURIs[Rarity.BabyCapy] = "ipfs://bafybeihrt4mxrfawle5offu25vnfho33r6irjdmcepdc7ukkwvzstv575q";
        rarityURIs[Rarity.ExploreCapy] = "ipfs://bafybeiesosmbcttp2beobnap6kl4ogbdd74mycyqsgvrlljzp67mceb674";
        rarityURIs[Rarity.WiseCapy] = "ipfs://bafybeibpyypohsxff7p5nf3ht4hcuyq27dwn46higcply6g2gtggj3fpiy";
        rarityURIs[Rarity.LegendaryCapy] = "ipfs://bafybeid7thffy2npk7ogfxdp3ew27ay46bpimtp3eadyd34u4ggk64emzi";
        rarityURIs[Rarity.GoldenCapy] = "ipfs://bafybeid2dbmzcgjxg7fmsyuatfxfhh4onw3k2kh27pdt7tjigjhwspo4gq";
    }

    /**
     * @dev Calcular fee de burn basado en el valor del NFT (escalonado)
     * - NFTs ≤ 5 CYC: 3% fee
     * - NFTs ≤ 20 CYC: 5% fee  
     * - NFTs > 20 CYC: 7% fee
     */
    function getBurnFeePercentage(uint256 nftValue) public pure returns (uint256) {
        if (nftValue <= 5 * 10**18) {        // ≤ 5 CYC
            return 300;  // 3% = 300 basis points
        } else if (nftValue <= 20 * 10**18) { // ≤ 20 CYC  
            return 500;  // 5% = 500 basis points
        } else {                              // > 20 CYC
            return 700;  // 7% = 700 basis points
        }
    }

    /**
     * @dev Mintear un NFT pagando con CapyCoins
     */
    function mintNFT(Rarity rarity) external nonReentrant returns (uint256) {
        uint256 price = rarityPrices[rarity];
        require(price > 0, "Invalid rarity");
        
        // Verificar que el usuario tenga suficientes CapyCoins
        require(capyCoinToken.balanceOf(msg.sender) >= price, "Insufficient CapyCoin balance");
        
        // Transferir CapyCoins del usuario al contrato
        require(
            capyCoinToken.transferFrom(msg.sender, address(this), price),
            "CapyCoin transfer failed"
        );
        
        // Mintear NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        // Configurar metadatos
        tokenRarity[tokenId] = rarity;
        _setTokenURI(tokenId, rarityURIs[rarity]);
        
        // Registrar el minter original
        tokenOriginalMinter[tokenId] = msg.sender;
        
        emit NFTMinted(msg.sender, tokenId, rarity, price);
        return tokenId;
    }

    /**
     * @dev Distribuir NFT en el mapa (solo owner del NFT)
     */
    function distributeNFT(uint256 tokenId, string memory location) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this NFT");
        require(!tokenActiveOnMap[tokenId], "NFT already active on map");
        
        tokenActiveOnMap[tokenId] = true;
        tokenLocation[tokenId] = location;
        tokenDistributor[tokenId] = msg.sender; // NUEVO: Registrar quien distribuyó
        
        emit NFTDistributed(tokenId, location, msg.sender);
    }

    /**
     * @dev Reclamar NFT del mapa - VERSIÓN CORREGIDA
     * Ahora CUALQUIER PERSONA puede reclamar NFTs distribuidos en el mapa
     */
    function claimNFT(uint256 tokenId) external nonReentrant {
        require(tokenActiveOnMap[tokenId], "NFT not active on map");
        address currentOwner = ownerOf(tokenId);
        
        // Impedir que el dueño actual se reclame a sí mismo
        require(msg.sender != currentOwner, "Cannot claim your own NFT");
        
        // Transferir el NFT al reclamante (Bob)
        _transfer(currentOwner, msg.sender, tokenId);
        
        // Desactivar del mapa y limpiar datos
        tokenActiveOnMap[tokenId] = false;
        tokenLocation[tokenId] = "";
        tokenDistributor[tokenId] = address(0);
        
        // Emitir evento sin recompensa económica
        emit NFTClaimed(tokenId, msg.sender, 0, 0);
    }

    /**
     * @dev Quemar NFT y recibir el porcentaje correspondiente de su valor en CapyCoins
     * Fee escalonado: 3% para NFTs ≤5 CYC, 5% para ≤20 CYC, 7% para >20 CYC
     */
    function burnNFT(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this NFT");
        require(!tokenActiveOnMap[tokenId], "NFT is active on map; cannot burn");

        uint256 nftValue = rarityPrices[tokenRarity[tokenId]];
        uint256 currentFeePercentage = getBurnFeePercentage(nftValue);
        uint256 refundAmount = (nftValue * (10000 - currentFeePercentage)) / 10000;
        uint256 feeAmount = (nftValue * currentFeePercentage) / 10000;

        // Verificar que el contrato tenga suficientes CapyCoins
        require(capyCoinToken.balanceOf(address(this)) >= refundAmount + feeAmount, "Insufficient contract balance");

        // Transferir CapyCoins del contrato al dueño
        require(
            capyCoinToken.transfer(msg.sender, refundAmount),
            "Refund transfer failed"
        );
        // Transferir fee al feeRecipient
        require(
            capyCoinToken.transfer(feeRecipient, feeAmount),
            "Fee transfer failed"
        );

        // Quemar el NFT
        _burn(tokenId);
        
        emit NFTBurned(tokenId, msg.sender, refundAmount, feeAmount);
    }

    /**
     * @dev Obtener información completa de un NFT
     */
    function getNFTInfo(uint256 tokenId) external view returns (
        address owner,
        Rarity rarity,
        uint256 price,
        bool isActiveOnMap,
        string memory location,
        string memory metadataURI
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        return (
            ownerOf(tokenId),
            tokenRarity[tokenId],
            rarityPrices[tokenRarity[tokenId]],
            tokenActiveOnMap[tokenId],
            tokenLocation[tokenId],
            tokenURI(tokenId)
        );
    }

    /**
     * @dev Obtener información de burn fee para un NFT específico
     */
    function getBurnInfo(uint256 tokenId) external view returns (
        uint256 nftValue,
        uint256 feePercentage,
        uint256 refundAmount,
        uint256 feeAmount
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        nftValue = rarityPrices[tokenRarity[tokenId]];
        feePercentage = getBurnFeePercentage(nftValue);
        refundAmount = (nftValue * (10000 - feePercentage)) / 10000;
        feeAmount = (nftValue * feePercentage) / 10000;
        
        return (nftValue, feePercentage, refundAmount, feeAmount);
    }

    /**
     * @dev Obtener todos los NFTs de un usuario
     */
    function getUserNFTs(address user) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(user, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Obtener NFTs activos en el mapa
     */
    function getActiveNFTs() external view returns (uint256[] memory) {
        uint256 totalTokens = totalSupply();
        uint256[] memory activeTokens = new uint256[](totalTokens);
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0) && tokenActiveOnMap[i]) {
                activeTokens[activeCount] = i;
                activeCount++;
            }
        }
        
        // Redimensionar array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeTokens[i];
        }
        
        return result;
    }

    // ========================================
    // FUNCIONES DE ADMINISTRACIÓN
    // ========================================

    /**
     * @dev Actualizar precio de rareza
     */
    function updateRarityPrice(Rarity rarity, uint256 newPrice) external onlyOwner {
        rarityPrices[rarity] = newPrice;
        emit PriceUpdated(rarity, newPrice);
    }

    /**
     * @dev Actualizar URI de rareza
     */
    function updateRarityURI(Rarity rarity, string memory newURI) external onlyOwner {
        rarityURIs[rarity] = newURI;
        emit URIUpdated(rarity, newURI);
    }

    /**
     * @dev Actualizar destinatario de fees
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    /**
     * @dev Retirar tokens ERC20 accidentalmente enviados (excepto CapyCoin)
     */
    function withdrawERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        require(address(token) != address(capyCoinToken), "Cannot withdraw CapyCoin");
        require(token.transfer(to, amount), "Transfer failed");
    }

    // ========================================
    // OVERRIDES REQUERIDOS
    // ========================================

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}