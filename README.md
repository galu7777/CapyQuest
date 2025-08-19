# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
### Comands
```compile
  npx hardhat compile
``` 

```deploy
  npx hardhat ignition deploy  ./ignition/modules/Lock.js
``` 

```deploy reset
  npx hardhat ignition deploy  ./ignition/modules/Lock.js --reset
``` 

``` node
  npx hardhat node
``` 

```console
  npx hardhat console
```


## PASO A PASO - Ejecutar en Hardhat Console (npx hardhat console --network localhost)

### PASO 1: Conectar al contrato desplegado
const contractAddress = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9";
const CapyCoin = await ethers.getContractFactory("CapyCoin");
const capycoin = CapyCoin.attach(contractAddress);

### PASO 2: Obtener las cuentas de Hardhat
const [deployer, account1, account2, account3] = await ethers.getSigners();

### PASO 3: Ver información básica del contrato
await capycoin.name();
await capycoin.symbol();
await capycoin.tokenPrice();

### PASO 4: Ver balance inicial del deployer (quien recibió 100M tokens)
ethers.formatEther(await capycoin.balanceOf(deployer.address));

### PASO 5: Comprar tokens con account1 - Enviar 1.5 ETH
const ethAmount1 = ethers.parseEther("1.5");
await capycoin.getTokensForEth(ethAmount1); // Ver cuántos tokens recibirás

### PASO 6: Ejecutar la compra con account1
const tx1 = await capycoin.connect(account1).buyCapyCoin({ value: ethAmount1 });
await tx1.wait();
### PASO 7: Verificar balance de account1 después de comprar
ethers.formatEther(await capycoin.balanceOf(account1.address));

### PASO 8: Comprar tokens con account2 - Enviar 0.5 ETH
const ethAmount2 = ethers.parseEther("0.5");
const tx2 = await capycoin.connect(account2).buyCapyCoin({ value: ethAmount2 });
await tx2.wait();

### PASO 9: Ver balance de account2
ethers.formatEther(await capycoin.balanceOf(account2.address));

### PASO 10: Ver ETH acumulado en el contrato
ethers.formatEther(await ethers.provider.getBalance(contractAddress));

### PASO 11: Ver supply total y restante
ethers.formatEther(await capycoin.totalSupply());
ethers.formatEther(await capycoin.remainingSupply());

### PASO 12: (Opcional) Owner retira fondos
const withdrawTx = await capycoin.connect(deployer).withdrawFunds();
await withdrawTx.wait();

### PASO 13: Verificar que el ETH fue retirado
ethers.formatEther(await ethers.provider.getBalance(contractAddress));

100,000,000.000000000000002