// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CapyCoin is ERC20, Ownable, ERC20Permit {
    // Precio de CapyCoin en wei (1 AVAX = cantidad de CapyCoin)
    uint256 public tokenPrice = 1; // 1 dot = 1 CYC
    
    // Supply máximo de tokens - 100 millones
    uint256 public maxSupply = 100000000 * 10 ** decimals(); // 100 million tokens
    
    // NUEVAS VARIABLES PARA METADATOS
    string public logoURI;
    string public website;
    string public description;
    
    // Eventos
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event PriceUpdated(uint256 newPrice);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event TokensWithdrawnFromContract(address indexed to, uint256 amount);
    event MetadataUpdated(string metadataType, string newValue);

    constructor(address initialOwner)
        ERC20("CapyCoin", "CYC")
        Ownable(initialOwner)
        ERC20Permit("CapyCoin")
    {
        uint256 initialMint = 100000000 * 10 ** decimals(); // 100 millones de tokens (TOTAL SUPPLY)
        
        // 85% va al contrato (para ventas)
        uint256 contractTokens = (initialMint * 85) / 100; // 85,000,000 CYC
        _mint(address(this), contractTokens);
        
        // 15% va al owner
        uint256 ownerTokens = (initialMint * 15) / 100; // 15,000,000 CYC
        _mint(initialOwner, ownerTokens);
        
        // CONFIGURAR METADATOS DEL TOKEN
        logoURI = "ipfs://bafkreicpvc356cujdmrdqwc6fifki3jyxhe5bwx4d24ulmjhr5dr5a3t3y"; // REEMPLAZA CON TU HASH REAL DE IPFS
        website = "http://localhost:3000"; // REEMPLAZA CON TU WEBSITE
        description = "CapyCoin (CYC) - The cutest capybara-themed meme coin on Avalanche network. Join the capy family!";
        
        // Total Supply será exactamente 100,000,000 CYC
    }

    /**
     * @dev Función para comprar CapyCoin con AVAX
     * Los usuarios envían AVAX y reciben CapyCoin desde las reservas del contrato
     */
    function buyCapyCoin() external payable {
        require(msg.value > 0, "Must send AVAX to buy tokens");
        
        // Calcular cantidad de tokens a recibir (corregido con decimales)
        uint256 tokenAmount = (msg.value * tokenPrice * 10 ** decimals()) / 1 ether;
        
        // Verificar que el contrato tiene suficientes tokens
        require(balanceOf(address(this)) >= tokenAmount, "Insufficient token reserves in contract");
        
        // Transferir tokens desde el contrato al comprador
        _transfer(address(this), msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Función para que el owner pueda hacer mint adicional al contrato
     * NOTA: Solo se puede mintear hasta el maxSupply (100M)
     */
    function mintToContract(uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply of 100M tokens");
        _mint(address(this), amount);
    }

    /**
     * @dev Función para que el owner pueda retirar tokens del contrato
     */
    function withdrawTokensFromContract(address to, uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient contract token balance");
        _transfer(address(this), to, amount);
        emit TokensWithdrawnFromContract(to, amount);
    }

    /**
     * @dev Función de emergencia para mintear directamente a una dirección (solo owner)
     * NOTA: Solo se puede mintear hasta el maxSupply (100M)
     */
    function emergencyMint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply of 100M tokens");
        _mint(to, amount);
    }

    /**
     * @dev Actualizar el precio del token (solo owner)
     */
    function setTokenPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        tokenPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @dev Retirar AVAX del contrato (solo owner)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @dev Función de emergencia para retirar una cantidad específica de AVAX
     */
    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @dev Ver cuántos tokens se pueden comprar con cierta cantidad de AVAX
     */
    function getTokensForEth(uint256 ethAmount) external view returns (uint256) {
        return (ethAmount * tokenPrice * 10 ** decimals()) / 1 ether;
    }

    /**
     * @dev Ver cuánto AVAX se necesita para comprar cierta cantidad de tokens
     */
    function getEthForTokens(uint256 tokenAmount) external view returns (uint256) {
        return (tokenAmount * 1 ether) / (tokenPrice * 10 ** decimals());
    }

    /**
     * @dev Ver el supply restante disponible para mint
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }

    /**
     * @dev Ver cuántos tokens tiene el contrato disponibles para venta
     */
    function contractTokenBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * @dev Ver el balance de AVAX del contrato
     */
    function contractAvaxBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ========================================
    // NUEVAS FUNCIONES PARA METADATOS
    // ========================================

    /**
     * @dev Actualizar logo URI (solo owner)
     */
    function setLogoURI(string memory newLogoURI) external onlyOwner {
        logoURI = newLogoURI;
        emit MetadataUpdated("logoURI", newLogoURI);
    }

    /**
     * @dev Actualizar descripción (solo owner)
     */
    function setDescription(string memory newDescription) external onlyOwner {
        description = newDescription;
        emit MetadataUpdated("description", newDescription);
    }

    /**
     * @dev Actualizar website (solo owner)
     */
    function setWebsite(string memory newWebsite) external onlyOwner {
        website = newWebsite;
        emit MetadataUpdated("website", newWebsite);
    }

    /**
     * @dev Obtener todos los metadatos del token de una vez
     */
    function getTokenMetadata() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        string memory logo,
        string memory site,
        string memory desc,
        uint256 totalTokenSupply,
        uint256 maxTokenSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            logoURI,
            website,
            description,
            totalSupply(),
            maxSupply
        );
    }

    /**
     * @dev Función específica para obtener solo la URI del logo (útil para wallets)
     */
    function getLogoURI() external view returns (string memory) {
        return logoURI;
    }

    /**
     * @dev Función para verificar si el token tiene metadatos configurados
     */
    function hasMetadata() external view returns (bool) {
        return bytes(logoURI).length > 0;
    }

    // ========================================
    // FUNCIONES ORIGINALES (sin cambios)
    // ========================================

    /**
     * @dev Función para recibir AVAX directamente (auto-compra tokens)
     */
    receive() external payable {
        require(msg.value > 0, "Must send AVAX to buy tokens");
        
        uint256 tokenAmount = (msg.value * tokenPrice * 10 ** decimals()) / 1 ether;
        require(balanceOf(address(this)) >= tokenAmount, "Insufficient token reserves in contract");
        
        _transfer(address(this), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Fallback function - rechaza calls con data inválida
     */
    fallback() external payable {
        revert("Invalid function call");
    }
}