pragma solidity 0.6.5;

import "../Interfaces/UniswapV2Router1.sol";
import "../Interfaces/ERC20.sol";

contract FakeUniswapV2Router is UniswapV2Router1 {

    uint256 immutable _eth2dai;
    constructor(uint256 eth2dai) public payable {
        require(msg.value > 0, "need eth to bootstrap");
        _eth2dai = eth2dai;
    }
    
    function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline)
    external override returns (uint256[] memory amounts) {
        ERC20(path[0]).transferFrom(msg.sender, address(this), amountOut * _eth2dai);
        payable(to).transfer(amountOut);
    }

    function getAmountsOut(uint amountIn, address[] calldata path) external override view returns (uint[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn / _eth2dai;
    }
}
