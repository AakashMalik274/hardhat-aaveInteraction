const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat.config")

const AMOUNT = ethers.utils.parseEther("0.2")

async function getWeth() {
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    //abi ✅, contract address ✅
    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

    const IWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[chainId].WETH_Address,
        deployer
    )

    const tx = await IWeth.deposit({ value: AMOUNT })
    await tx.wait(1)

    const wethbalance = ethers.utils.formatEther(
        await IWeth.balanceOf(deployer)
    )
    console.log(`Got ${wethbalance.toString()} WETH`)
}

module.exports = { getWeth }
