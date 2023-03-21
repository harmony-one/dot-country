import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { deploy, get } = deployments

  const { deployer } = await getNamedAccounts()

  const DCAddress = "0x547942748Cc8840FEc23daFdD01E6457379B446D";
  const dc = await ethers.getContractAt('DC', DCAddress)

  const nameToCheck = "eclipse"
  console.log('domain = ', nameToCheck);
  console.log('domain owner address = ', await dc.ownerOf(nameToCheck));
  console.log('domain expiration time = ', (await dc.nameExpires(nameToCheck)).toString());
}
export default func
func.tags = ['DomainCheck']
