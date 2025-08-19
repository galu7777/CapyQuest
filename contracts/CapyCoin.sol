// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CapyCoin is ERC20, Ownable, ERC20Permit {
    // Precio de CapyCoin en wei (1 AVAX = cantidad de CapyCoin)
    uint256 public tokenPrice = 10; // 1 AVAX = 10 CYC
    
    // Supply máximo de tokens
    uint256 public maxSupply = 1000000000 * 10 ** decimals(); // 1 billion tokens
    
    // Eventos
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event PriceUpdated(uint256 newPrice);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor(address recipient, address initialOwner)
        ERC20("CapyCoin", "CYC")
        Ownable(initialOwner)
        ERC20Permit("CapyCoin")
    {
        // Mint inicial de 100 millones de tokens
        _mint(recipient, 100000000 * 10 ** decimals());
    }

    /**
     * @dev Función para comprar CapyCoin con ETH
     * Los usuarios envían ETH y reciben CapyCoin según el precio actual
     */
    function buyCapyCoin() external payable {
        require(msg.value > 0, "Must send ETH to buy tokens");
        
        // Calcular cantidad de tokens a recibir
        uint256 tokenAmount = (msg.value * tokenPrice) / 1 ether;
        
        // Verificar que no exceda el supply máximo
        require(totalSupply() + tokenAmount <= maxSupply, "Would exceed max supply");
        
        // Mint tokens al comprador
        _mint(msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Función para que el owner pueda hacer mint adicional
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
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
     * @dev Retirar ETH del contrato (solo owner)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @dev Función de emergencia para retirar una cantidad específica
     */
    function withdrawAmount(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @dev Ver cuántos tokens se pueden comprar con cierta cantidad de ETH
     */
    function getTokensForEth(uint256 ethAmount) external view returns (uint256) {
        return (ethAmount * tokenPrice) / 1 ether;
    }

    /**
     * @dev Ver cuánto ETH se necesita para comprar cierta cantidad de tokens
     */
    function getEthForTokens(uint256 tokenAmount) external view returns (uint256) {
        return (tokenAmount * 1 ether) / tokenPrice;
    }

    /**
     * @dev Ver el supply restante disponible para mint
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }

    /**
     * @dev Función para recibir ETH directamente (llamará a buyCapyCoin)
     */
    receive() external payable {
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
    }
}

// pragma solidity ^0.8.20;

// /**
//  * CapyCoin (PWC)
//  * - ERC20 con AccessControl para controlar quién puede mintear.
//  * - Opcional: puedes otorgarle MINTER_ROLE al DropVault para que pueda mintear
//  *   al propio Vault (gasless UX). O bien mintear fuera y fundear el Vault con transferFrom.
//  */

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/AccessControl.sol";

// contract CapyCoin is ERC20, AccessControl {
//     bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

//     constructor(
//         string memory name_,
//         string memory symbol_,
//         address admin_
//     ) ERC20(name_, symbol_) {
//         _grantRole(DEFAULT_ADMIN_ROLE, admin_);
//         _grantRole(MINTER_ROLE, admin_);
//     }

//     /**
//      * @dev Minteo controlado. Otorga MINTER_ROLE al backend y/o al DropVault.
//      */
//     function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
//         _mint(to, amount);
//     }

//     /**
//      * @dev Admin puede gestionar roles.
//      */
//     function grantMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
//         _grantRole(MINTER_ROLE, account);
//     }

//     function revokeMinter(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
//         _revokeRole(MINTER_ROLE, account);
//     }
// }
