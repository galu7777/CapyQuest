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
    
    // Fee del contrato (5% por defecto)
    uint256 public feePercentage = 500; // 5% = 500 basis points (500/10000)
    
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
    
    // Eventos
    event NFTMinted(address indexed to, uint256 indexed tokenId, Rarity rarity, uint256 price);
    event NFTDistributed(uint256 indexed tokenId, string location, address indexed owner);
    event NFTClaimed(uint256 indexed tokenId, address indexed from, address indexed to, string location);
    event PriceUpdated(Rarity rarity, uint256 newPrice);
    event URIUpdated(Rarity rarity, string newURI);
    event FeeUpdated(uint256 newFeePercentage);
    event FeesWithdrawn(address indexed to, uint256 amount);

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
        
        // Calcular y transferir fee
        uint256 fee = (price * feePercentage) / 10000;
        if (fee > 0) {
            require(
                capyCoinToken.transfer(feeRecipient, fee),
                "Fee transfer failed"
            );
        }
        
        // Mintear NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        // Configurar metadatos
        tokenRarity[tokenId] = rarity;
        _setTokenURI(tokenId, rarityURIs[rarity]);
        
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
        
        emit NFTDistributed(tokenId, location, msg.sender);
    }

    /**
     * @dev Reclamar NFT del mapa (función para el backend/oracle)
     */
    function claimNFT(uint256 tokenId, address newOwner, string memory location) external onlyOwner {
        require(tokenActiveOnMap[tokenId], "NFT not active on map");
        address currentOwner = ownerOf(tokenId);
        
        // Calcular fee de reclamación (2%)
        uint256 claimFee = (rarityPrices[tokenRarity[tokenId]] * 200) / 10000; // 2%
        
        // Transferir NFT
        _transfer(currentOwner, newOwner, tokenId);
        
        // Desactivar del mapa
        tokenActiveOnMap[tokenId] = false;
        tokenLocation[tokenId] = "";
        
        // Si hay balance de CapyCoins en el contrato, transferir fee
        if (capyCoinToken.balanceOf(address(this)) >= claimFee && claimFee > 0) {
            capyCoinToken.transfer(feeRecipient, claimFee);
        }
        
        emit NFTClaimed(tokenId, currentOwner, newOwner, location);
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
        uint256 totalSupply = totalSupply();
        uint256[] memory activeTokens = new uint256[](totalSupply);
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
     * @dev Actualizar porcentaje de fee
     */
    function updateFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        feePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
    }

    /**
     * @dev Actualizar destinatario de fees
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Retirar CapyCoins acumulados en el contrato
     */
    function withdrawCapyCoins() external onlyOwner {
        uint256 balance = capyCoinToken.balanceOf(address(this));
        require(balance > 0, "No CapyCoins to withdraw");
        
        require(capyCoinToken.transfer(owner(), balance), "Transfer failed");
        emit FeesWithdrawn(owner(), balance);
    }

    /**
     * @dev Función de emergencia para retirar cantidad específica
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(capyCoinToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(capyCoinToken.transfer(owner(), amount), "Transfer failed");
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