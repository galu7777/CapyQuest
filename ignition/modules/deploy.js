// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const JAN_1ST_2030 = 1893456000;
// const ONE_GWEI = 1_000_000_000n;

export default buildModule("CapyCoinModule", (m) => {
  // const unlockTime = m.getParameter("unlockTime", JAN_1ST_2030);
  // const lockedAmount = m.getParameter("lockedAmount", ONE_GWEI);

  // const lock = m.contract("Lock", [unlockTime], {
  //   value: lockedAmount,
  // });

  // Obtener la cuenta del deployer
  const deployer = m.getAccount(0);
  
  // Parámetros del contrato
  const recipient = m.getParameter("recipient", deployer);
  const initialOwner = m.getParameter("initialOwner", deployer);

  // Desplegar CapyCoin con los argumentos requeridos
  const capycoin = m.contract("CapyCoin", [recipient, initialOwner]);

  return { capycoin };
});
