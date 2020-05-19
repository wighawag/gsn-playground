pragma solidity 0.6.5;

import "./ForwarderRegistry.sol";

contract ForwarderRegistryChainIdWithGSN is ForwarderRegistry { 
    // //////////////////////////////// GSN COMPATIBILITY ////////////////////////////////////////////
    address immutable _gsnForwarder;
    uint256 immutable _hardcodedChainId;
    constructor(address gsnForwarder, uint256 chainId) public {
        _gsnForwarder = gsnForwarder;
        _hardcodedChainId = chainId;
    }
    // Necessary to be compatible with GSN. THis is not actually a trusted forwarder. User are in complete control to which forwarder they trust
    function getTrustedForwarder() external view returns (address) {
        return _gsnForwarder;
    }

    function _chainId() internal override view returns(uint256 chainId) {
        return _hardcodedChainId;
    }
}
