pragma solidity 0.6.5;

import "./ForwarderRegistry.sol";

abstract contract MetaTxReceiverBase {
    ForwarderRegistry immutable _forwarderRegistry;
    constructor(ForwarderRegistry forwarderRegistry) internal {
        _forwarderRegistry = forwarderRegistry;
    }
    
    function  _msgSender() internal view returns (address payable signer) {
        bytes memory data = msg.data;
        uint256 length = msg.data.length;
        assembly { signer := mload(sub(add(data, length), 0x00)) }
        address payable sender = msg.sender;
        if(sender != address(_forwarderRegistry) && !_forwarderRegistry.isForwarderFor(signer, sender)) {
            signer = sender;    
        }
    }
}
