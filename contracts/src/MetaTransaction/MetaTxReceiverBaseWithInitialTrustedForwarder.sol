pragma solidity 0.6.5;

import "./ForwarderRegistry.sol";

abstract contract MetaTxReceiverBaseWithInitialTrustedForwarder {
    ForwarderRegistry immutable _forwarderRegistry;
    address immutable _trustedForwarder;
    constructor(ForwarderRegistry forwarderRegistry, address trustedForwarder) internal {
        _forwarderRegistry = forwarderRegistry;
        _trustedForwarder = trustedForwarder;
    }

    // Necessary to be compatible with GSN
    function getTrustedForwarder() external view returns (address) {
        return _trustedForwarder;
    }
    
    function  _msgSender() internal view returns (address payable signer) {
        bytes memory data = msg.data;
        uint256 length = msg.data.length;
        assembly { signer := mload(sub(add(data, length), 0x00)) }
        address payable sender = msg.sender;
        if(sender != _trustedForwarder && sender != address(_forwarderRegistry) && !_forwarderRegistry.isForwarderFor(signer, sender)) {
            signer = sender;
        }
    }
}
