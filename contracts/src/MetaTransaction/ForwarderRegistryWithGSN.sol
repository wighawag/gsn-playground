pragma solidity 0.6.5;

import "./ForwarderRegistry.sol";

contract ForwarderRegistryWithGSN is ForwarderRegistry { 
    // //////////////////////////////// GSN COMPATIBILITY ////////////////////////////////////////////
    address immutable _gsnForwarder;
    constructor(address gsnForwarder) public {
        _gsnForwarder = gsnForwarder;
    }
    // Necessary to be compatible with GSN. THis is not actually a trusted forwarder. User are in complete control to which forwarder they trust
    function getTrustedForwarder() external view returns (address) {
        return _gsnForwarder;
    }
}
