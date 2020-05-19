pragma solidity 0.6.5;

import "./MetaTxReceiverBase.sol";

abstract contract MetaTxReceiverBaseForGSN is MetaTxReceiverBase {
    
    address immutable _gsnForwarder;
    constructor(ForwarderRegistry forwarderRegistry, address gsnForwarder) internal MetaTxReceiverBase(forwarderRegistry) {
        _gsnForwarder = gsnForwarder;
    }

    // Necessary to be compatible with GSN. THis is not actually a trusted forwarder. User are in complete control to which forwarder they trust
    function getTrustedForwarder() external view returns (address) {
        return _gsnForwarder;
    }
    
}
