// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface ICapyNFT {
    function getNFTInfo(uint256 tokenId) external view returns (
        address owner,
        uint8 rarity,
        uint256 price,
        bool isActiveOnMap,
        string memory location,
        string memory metadataURI
    );
    
    function tokenRarity(uint256 tokenId) external view returns (uint8);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function mintNFT(uint8 rarity) external returns (uint256);
}

contract CapyMarketplace is Ownable, ReentrancyGuard, IERC721Receiver {
    // Contratos principales
    IERC721 public capyNFTContract;
    IERC20 public capyCoinToken; 
    ICapyNFT public capyNFTInterface;
    
    // Fee del marketplace (2.5% por defecto)
    uint256 public marketplaceFee = 250; // 2.5% = 250 basis points
    
    // Dirección donde se acumulan los fees
    address public feeRecipient;
    
    // Contador de listados
    uint256 private _nextListingId = 1;
    
    // Duración por defecto de listados (7 días)
    uint256 public defaultListingDuration = 7 days;
    
    // Estados de listado
    enum ListingStatus {
        Active,
        Sold,
        Cancelled,
        Expired
    }
    
    // Estructura de listado
    struct Listing {
        uint256 listingId;
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 createdAt;
        uint256 expiresAt;
        ListingStatus status;
        bool isAuction;
        uint256 highestBid;
        address highestBidder;
    }
    
    // Estructura de oferta
    struct Offer {
        uint256 offerId;
        uint256 tokenId;
        address offerer;
        uint256 amount;
        uint256 expiresAt;
        bool isActive;
    }
    
    // Mapeos
    mapping(uint256 => Listing) public listings; // listingId => Listing
    mapping(uint256 => uint256) public tokenToListing; // tokenId => listingId
    mapping(uint256 => Offer[]) public tokenOffers; // tokenId => Offers[]
    mapping(address => uint256[]) public userListings; // user => listingIds[]
    
    // Eventos
    event NFTListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        bool isAuction
    );
    
    event NFTSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId, uint256 indexed tokenId);
    event ListingExpired(uint256 indexed listingId, uint256 indexed tokenId);
    
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        address indexed offerer,
        uint256 amount
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        address indexed seller,
        address offerer,
        uint256 amount
    );
    
    event BidPlaced(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    constructor(
        address _capyNFTContract,
        address _capyCoinToken,
        address _feeRecipient,
        address initialOwner
    ) Ownable(initialOwner) {
        capyNFTContract = IERC721(_capyNFTContract);
        capyCoinToken = IERC20(_capyCoinToken);
        capyNFTInterface = ICapyNFT(_capyNFTContract);
        feeRecipient = _feeRecipient;
    }

    // ========================================
    // FUNCIONES PRINCIPALES DE MARKETPLACE
    // ========================================

    /**
     * @dev Listar NFT para venta directa
     */
    function listNFT(
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) internal nonReentrant returns (uint256) {
        require(capyNFTContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(tokenToListing[tokenId] == 0, "NFT already listed");
        require(duration >= 1 days && duration <= 30 days, "Invalid duration");
        
        // Transferir NFT al contrato
        capyNFTContract.safeTransferFrom(msg.sender, address(this), tokenId);
        
        uint256 listingId = _nextListingId++;
        uint256 expiresAt = block.timestamp + duration;
        
        listings[listingId] = Listing({
            listingId: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: ListingStatus.Active,
            isAuction: false,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        tokenToListing[tokenId] = listingId;
        userListings[msg.sender].push(listingId);
        
        emit NFTListed(listingId, tokenId, msg.sender, price, false);
        return listingId;
    }

    /**
     * @dev Función para listar con duración por defecto
     */
    function listNFTDefault(uint256 tokenId, uint256 price) external returns (uint256) {
        return listNFT(tokenId, price, defaultListingDuration);
    }

    /**
     * @dev Listar NFT para subasta
     */
    function listNFTForAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) internal nonReentrant returns (uint256) {
        require(capyNFTContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(tokenToListing[tokenId] == 0, "NFT already listed");
        require(duration >= 1 hours && duration <= 7 days, "Invalid auction duration");
        
        // Transferir NFT al contrato
        capyNFTContract.safeTransferFrom(msg.sender, address(this), tokenId);
        
        uint256 listingId = _nextListingId++;
        uint256 expiresAt = block.timestamp + duration;
        
        listings[listingId] = Listing({
            listingId: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: startingPrice,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: ListingStatus.Active,
            isAuction: true,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        tokenToListing[tokenId] = listingId;
        userListings[msg.sender].push(listingId);
        
        emit NFTListed(listingId, tokenId, msg.sender, startingPrice, true);
        return listingId;
    }

    /**
     * @dev Función para subasta con duración por defecto (3 días)
     */
    function listNFTForAuctionDefault(uint256 tokenId, uint256 startingPrice) external returns (uint256) {
        return listNFTForAuction(tokenId, startingPrice, 3 days);
    }

    /**
     * @dev Comprar NFT directamente
     */
    function buyNFT(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        require(!listing.isAuction, "Use bidding for auctions");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        
        uint256 totalPrice = listing.price;
        uint256 fee = (totalPrice * marketplaceFee) / 10000;
        uint256 sellerAmount = totalPrice - fee;
        
        // Verificar balance del comprador
        require(capyCoinToken.balanceOf(msg.sender) >= totalPrice, "Insufficient CapyCoin balance");
        
        // Transferir CapyCoins
        require(capyCoinToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Transfer to seller failed");
        if (fee > 0) {
            require(capyCoinToken.transferFrom(msg.sender, feeRecipient, fee), "Fee transfer failed");
        }
        
        // Transferir NFT al comprador
        capyNFTContract.safeTransferFrom(address(this), msg.sender, listing.tokenId);
        
        // Actualizar estado
        listing.status = ListingStatus.Sold;
        tokenToListing[listing.tokenId] = 0;
        
        emit NFTSold(listingId, listing.tokenId, listing.seller, msg.sender, totalPrice);
    }

    /**
     * @dev Hacer una oferta en subasta
     */
    function placeBid(uint256 listingId, uint256 bidAmount) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Auction expired");
        require(listing.isAuction, "Not an auction");
        require(msg.sender != listing.seller, "Cannot bid on your own auction");
        require(bidAmount > listing.highestBid, "Bid must be higher than current highest");
        require(bidAmount >= listing.price, "Bid below starting price");
        
        // Verificar balance
        require(capyCoinToken.balanceOf(msg.sender) >= bidAmount, "Insufficient CapyCoin balance");
        
        // Devolver la oferta anterior si existe
        if (listing.highestBidder != address(0)) {
            require(capyCoinToken.transfer(listing.highestBidder, listing.highestBid), "Failed to return previous bid");
        }
        
        // Transferir nueva oferta al contrato
        require(capyCoinToken.transferFrom(msg.sender, address(this), bidAmount), "Bid transfer failed");
        
        listing.highestBid = bidAmount;
        listing.highestBidder = msg.sender;
        
        // Extender subasta si quedan menos de 5 minutos
        if (listing.expiresAt - block.timestamp < 5 minutes) {
            listing.expiresAt += 5 minutes;
        }
        
        emit BidPlaced(listingId, listing.tokenId, msg.sender, bidAmount);
    }

    /**
     * @dev Finalizar subasta
     */
    function finalizeAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(block.timestamp > listing.expiresAt, "Auction still active");
        require(listing.isAuction, "Not an auction");
        
        if (listing.highestBidder == address(0)) {
            // No hay ofertas, devolver NFT al vendedor
            capyNFTContract.safeTransferFrom(address(this), listing.seller, listing.tokenId);
            listing.status = ListingStatus.Expired;
            emit ListingExpired(listingId, listing.tokenId);
        } else {
            // Hay ganador
            uint256 totalAmount = listing.highestBid;
            uint256 fee = (totalAmount * marketplaceFee) / 10000;
            uint256 sellerAmount = totalAmount - fee;
            
            // Transferir CapyCoins al vendedor
            require(capyCoinToken.transfer(listing.seller, sellerAmount), "Transfer to seller failed");
            if (fee > 0) {
                require(capyCoinToken.transfer(feeRecipient, fee), "Fee transfer failed");
            }
            
            // Transferir NFT al ganador
            capyNFTContract.safeTransferFrom(address(this), listing.highestBidder, listing.tokenId);
            
            listing.status = ListingStatus.Sold;
            
            emit NFTSold(listingId, listing.tokenId, listing.seller, listing.highestBidder, totalAmount);
        }
        
        tokenToListing[listing.tokenId] = 0;
    }

    /**
     * @dev Cancelar listado
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || msg.sender == owner(), "Not authorized");
        require(listing.status == ListingStatus.Active, "Listing not active");
        
        if (listing.isAuction && listing.highestBidder != address(0)) {
            // Devolver la oferta más alta
            require(capyCoinToken.transfer(listing.highestBidder, listing.highestBid), "Failed to return bid");
        }
        
        // Devolver NFT al vendedor
        capyNFTContract.safeTransferFrom(address(this), listing.seller, listing.tokenId);
        
        listing.status = ListingStatus.Cancelled;
        tokenToListing[listing.tokenId] = 0;
        
        emit ListingCancelled(listingId, listing.tokenId);
    }

    // ========================================
    // FUNCIONES DE CONSULTA
    // ========================================

    /**
     * @dev Obtener listados activos
     */
    function getActiveListings(uint256 offset, uint256 limit) 
        external 
        view 
        returns (Listing[] memory) 
    {
        require(limit <= 100, "Limit too high");
        
        uint256 activeCount = 0;
        // Contar listados activos
        for (uint256 i = 1; i < _nextListingId; i++) {
            if (listings[i].status == ListingStatus.Active && 
                block.timestamp <= listings[i].expiresAt) {
                activeCount++;
            }
        }
        
        if (activeCount == 0 || offset >= activeCount) {
            return new Listing[](0);
        }
        
        uint256 returnCount = activeCount - offset;
        if (returnCount > limit) {
            returnCount = limit;
        }
        
        Listing[] memory result = new Listing[](returnCount);
        uint256 resultIndex = 0;
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < _nextListingId && resultIndex < returnCount; i++) {
            if (listings[i].status == ListingStatus.Active && 
                block.timestamp <= listings[i].expiresAt) {
                if (currentIndex >= offset) {
                    result[resultIndex] = listings[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }
        
        return result;
    }

    /**
     * @dev Obtener listados de un usuario
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    /**
     * @dev Obtener información detallada de un listado
     */
    function getListingInfo(uint256 listingId) external view returns (
        Listing memory listing,
        string memory metadataURI,
        uint8 rarity
    ) {
        listing = listings[listingId];
        if (listing.tokenId > 0) {
            try capyNFTInterface.getNFTInfo(listing.tokenId) returns (
                address,
                uint8 _rarity,
                uint256,
                bool,
                string memory,
                string memory _metadataURI
            ) {
                rarity = _rarity;
                metadataURI = _metadataURI;
            } catch {
                rarity = 0;
                metadataURI = "";
            }
        }
    }

    // ========================================
    // FUNCIONES DE ADMINISTRACIÓN
    // ========================================

    /**
     * @dev Actualizar fee del marketplace
     */
    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        marketplaceFee = newFee;
    }

    /**
     * @dev Actualizar destinatario de fees
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Actualizar duración por defecto de listados
     */
    function updateDefaultListingDuration(uint256 newDuration) external onlyOwner {
        require(newDuration >= 1 days && newDuration <= 30 days, "Invalid duration");
        defaultListingDuration = newDuration;
    }

    /**
     * @dev Función de emergencia para devolver NFT atascado
     */
    function emergencyReturnNFT(uint256 tokenId, address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        capyNFTContract.safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Función de emergencia para devolver CapyCoins
     */
    function emergencyWithdrawCapyCoins(uint256 amount, address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(capyCoinToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(capyCoinToken.transfer(to, amount), "Transfer failed");
    }

    /**
     * @dev Verificar si un NFT está disponible para compra/oferta
     */
    function isNFTAvailable(uint256 tokenId) external view returns (bool isListed, bool hasOffers, address owner) {
        owner = capyNFTContract.ownerOf(tokenId);
        isListed = tokenToListing[tokenId] != 0;
        
        Offer[] memory offers = tokenOffers[tokenId];
        hasOffers = false;
        for (uint256 i = 0; i < offers.length; i++) {
            if (offers[i].isActive && block.timestamp <= offers[i].expiresAt) {
                hasOffers = true;
                break;
            }
        }
    }

    /**
     * @dev Obtener estadísticas del marketplace
     */
    function getMarketplaceStats() external view returns (
        uint256 totalListings,
        uint256 activeListings,
        uint256 totalSales,
        uint256 contractCapyBalance
    ) {
        totalListings = _nextListingId - 1;
        
        for (uint256 i = 1; i < _nextListingId; i++) {
            if (listings[i].status == ListingStatus.Active && 
                block.timestamp <= listings[i].expiresAt) {
                activeListings++;
            }
            if (listings[i].status == ListingStatus.Sold) {
                totalSales++;
            }
        }
        
        contractCapyBalance = capyCoinToken.balanceOf(address(this));
    }

    /**
     * @dev Función requerida para recibir NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}