import { ethers, Contract } from 'ethers';
import { getProvider } from '../blockchain/provider';
import { getContractAddresses } from './addresses';
import GovernanceDAOAbi from './abis/GovernanceDAO.json';
import DaoTokenAbi from './abis/DaoToken.json';

export async function getGovernanceDAOContract(): Promise<Contract> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  const addresses = getContractAddresses(Number(network.chainId));

  return new ethers.Contract(
    addresses.governanceDAO,
    GovernanceDAOAbi,
    provider
  );
}

export async function getDaoTokenContract(): Promise<Contract> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  const addresses = getContractAddresses(Number(network.chainId));

  return new ethers.Contract(
    addresses.daoToken,
    DaoTokenAbi,
    provider
  );
}
