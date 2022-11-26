const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat.config")
const { getWeth } = require("./getWeth")

const chainId = network.config.chainId
const DAIETH_PriceFeedAddress = networkConfig[chainId].DAIETH_PriceFeedAddress
const wETHAddress = networkConfig[chainId].WETH_Address
const DAI_Address = networkConfig[chainId].DAI_Address

async function main() {
    //Aave protocol treats everything as a ERC20 token, so we use WETH token instead of ETH
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const amount = ethers.utils.parseEther("0.2")

    //Lending Pool Address Provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    //Lending pool Address Provider ABI :

    const lendingPool = await getLendingPool(deployer)

    //deposit

    //before deposit we need to approve the contract on behalf of us to send our ERC20 tokens
    await approveERC20(wETHAddress, lendingPool.address, amount, deployer)
    console.log("Depositing...")

    const tx = await lendingPool.deposit(wETHAddress, amount, deployer, 0)
    await tx.wait(1)
    console.log("Deposited")

    //Borrow Time!
    //How much we have borrowed, How much we can borrow, how much we have in collateral
    const { availableBorrowsETH, totalDebtETH } = await getUserData(
        lendingPool,
        deployer
    )

    //To borrow DAI, we need to know how much DAI we could borrow, to get
    // the price, we will use chainlink DATA feeds

    const daiPrice = await getDAIPrice()

    const avaialbleDAIForBorrow =
        availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`You can borrow ${avaialbleDAIForBorrow} DAI`)

    const avaialbleDAIForBorrowWei = ethers.utils.parseEther(
        avaialbleDAIForBorrow.toString()
    )

    await borrowDAI(
        DAI_Address,
        lendingPool,
        avaialbleDAIForBorrowWei,
        deployer
    )
    await getUserData(lendingPool, deployer)

    await repayDAI(DAI_Address, lendingPool, avaialbleDAIForBorrowWei, deployer)

    await getUserData(lendingPool, deployer)
}

async function repayDAI(daiAddress, lendingPool, amount, account) {
    console.log("Approving DAI for repay...")
    await approveERC20(daiAddress, lendingPool.address, amount, account)
    console.log("Approved!")

    console.log("Repaying...")
    const tx = await lendingPool.repay(daiAddress, amount, 1, account)

    await tx.wait(1)
    console.log(`Repaid ${ethers.utils.formatEther(amount)} DAI successfully`)
}

async function borrowDAI(
    daiAddress,
    lendingPool,
    avaialbleDAIForBorrowInWei,
    account
) {
    console.log("Borrowing")
    const tx = await lendingPool.borrow(
        daiAddress,
        avaialbleDAIForBorrowInWei,
        1,
        0,
        account
    )
    await tx.wait(1)

    console.log("Borrowed Successfully")
}

async function getDAIPrice() {
    const getDAIPrice = await ethers.getContractAt(
        "AggregatorV3Interface",
        DAIETH_PriceFeedAddress
    ) //reading so don't need a signer

    const price = (await getDAIPrice.latestRoundData())[1]
    return price
}

async function getUserData(lendingPool, userAddress) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(userAddress)
    console.log(
        `availableBorrowsETH : ${ethers.utils.formatEther(availableBorrowsETH)}`
    )
    console.log(`totalDebtETH : ${ethers.utils.formatEther(totalDebtETH)}`)
    console.log(
        `totalCollateralETH : ${ethers.utils.formatEther(totalCollateralETH)}`
    )
    return { availableBorrowsETH, totalDebtETH }
}

async function approveERC20(
    erc20Address,
    spenderAddress,
    amountToSpend,
    account
) {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account
    )

    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved!")
}

async function getLendingPool(account) {
    const getLendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )

    const lendingPoolAddress =
        await getLendingPoolAddressProvider.getLendingPool()

    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    )

    return lendingPool
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.log(e)
        process.exit(1)
    })
