pragma solidity 0.6.5;

import "./ERC20.sol";

interface Dai is ERC20 {
    
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
