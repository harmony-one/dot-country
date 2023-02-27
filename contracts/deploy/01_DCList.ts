import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import config from '../config'
import fs from 'fs/promises'
import { chunk } from 'lodash'
import { DC } from '../typechain-types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const DCAddress = "0x3C84F4690De96a0428Bc6777f5aA5f5a92150Ef2";
  const dc = await ethers.getContractAt('DC', DCAddress) as DC
  
  const n = (await dc.numRecords()).toNumber()

  const getRecords = async (keys:string[]) => {
    const recordsRaw = await Promise.all(keys.map(k => dc.nameRecords(k)))
    return recordsRaw.map(({
      renter,
      rentTime,
      expirationTime,
      lastPrice,
      url,
      prev,
      next
    }) => {
      return {
        renter,
        rentTime: new Date(parseInt(rentTime.toString()) * 1000).toLocaleString(),
        expirationTime: new Date(parseInt(expirationTime.toString()) * 1000).toLocaleString(),
        lastPrice: ethers.utils.formatEther(lastPrice),
        url,
        prev,
        next
      }
    })
  }

  console.log(`key ${ethers.utils.id('')}, record:`, await getRecords([ethers.utils.id('')]))

  for (let i = 0; i < n; i += 500) {
    const keys = await dc.getRecordKeys(i, Math.min(n, i + 500))
    const records = await getRecords(keys)
    console.log(records)
  }
}
export default func
func.tags = ['DCList']
