import { ethers } from "hardhat";

const main = async () => {
    // Dirección del contrato desplegado
    const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
    
    // Obtener el contrato
    const CapyCoin = await ethers.getContractFactory("CapyCoin");
    const capycoin = CapyCoin.attach(contractAddress);
    
    // Obtener cuentas
    const [deployer, buyer1, buyer2, buyer3] = await ethers.getSigners();
    
    console.log("=== CapyCoin Purchase Demo ===");
    console.log("Contract Address:", contractAddress);
    console.log("Token Price:", await capycoin.tokenPrice(), "CYC per ETH");
    
    // Función helper para mostrar balances
    async function showBalances() {
        console.log("\n--- Current Balances ---");
        for (const [name, account] of [["Deployer", deployer], ["Buyer1", buyer1], ["Buyer2", buyer2]]) {
            const tokenBalance = await capycoin.balanceOf(account.address);
            const ethBalance = await ethers.provider.getBalance(account.address);
            console.log(`${name}: ${ethers.formatEther(tokenBalance)} CYC, ${ethers.formatEther(ethBalance)} ETH`);
        }
        
        const contractEth = await ethers.provider.getBalance(contractAddress);
        console.log(`Contract: ${ethers.formatEther(contractEth)} ETH`);
        console.log(`Total Supply: ${ethers.formatEther(await capycoin.totalSupply())} CYC`);
    }
    
    // Mostrar balances iniciales
    await showBalances();
    
    // Buyer1 compra con 0.1 ETH
    console.log("\n--- Buyer1 purchasing with 0.1 ETH ---");
    const ethAmount1 = ethers.parseEther("0.1");
    const expectedTokens1 = await capycoin.getTokensForEth(ethAmount1);
    console.log(`Expected tokens: ${ethers.formatEther(expectedTokens1)} CYC`);
    
    const tx1 = await capycoin.connect(buyer1).buyCapyCoin({ value: ethAmount1 });
    await tx1.wait();
    console.log("Purchase successful! TX:", tx1.hash);
    
    // Buyer2 compra con 0.25 ETH
    console.log("\n--- Buyer2 purchasing with 0.25 ETH ---");
    const ethAmount2 = ethers.parseEther("0.25");
    const expectedTokens2 = await capycoin.getTokensForEth(ethAmount2);
    console.log(`Expected tokens: ${ethers.formatEther(expectedTokens2)} CYC`);
    
    const tx2 = await capycoin.connect(buyer2).buyCapyCoin({ value: ethAmount2 });
    await tx2.wait();
    console.log("Purchase successful! TX:", tx2.hash);
    
    // Mostrar balances finales
    await showBalances();
    
    // Opcional: El owner cambia el precio
    console.log("\n--- Owner changing price ---");
    const newPrice = 1500; // 1 ETH = 1500 CYC
    const priceTx = await capycoin.connect(deployer).setTokenPrice(newPrice);
    await priceTx.wait();
    console.log("New price:", await capycoin.tokenPrice(), "CYC per ETH");
    
    // Buyer3 compra con el nuevo precio
    console.log("\n--- Buyer3 purchasing with new price (0.1 ETH) ---");
    const ethAmount3 = ethers.parseEther("0.1");
    const expectedTokens3 = await capycoin.getTokensForEth(ethAmount3);
    console.log(`Expected tokens with new price: ${ethers.formatEther(expectedTokens3)} CYC`);
    
    const tx3 = await capycoin.connect(buyer3).buyCapyCoin({ value: ethAmount3 });
    await tx3.wait();
    console.log("Purchase successful! TX:", tx3.hash);
    
    // Balances finales
    await showBalances();
    
    // Owner retira fondos
    console.log("\n--- Owner withdrawing funds ---");
    const withdrawTx = await capycoin.connect(deployer).withdrawFunds();
    await withdrawTx.wait();
    console.log("Funds withdrawn! TX:", withdrawTx.hash);
    
    await showBalances();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });