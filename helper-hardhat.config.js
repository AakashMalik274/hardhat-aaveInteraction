networkConfig = {
    5: {
        name: "goerli",
        WETH_Address: "0x3bd3a20Ac9Ff1dda1D99C0dFCE6D65C4960B3627",
    },
    31337: {
        WETH_Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        DAIETH_PriceFeedAddress: "0x773616e4d11a78f511299002da57a0a94577f1f4",
        DAI_Address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
}

developmentChains = ["hardhat", "localhost"]

module.exports = { networkConfig, developmentChains }
