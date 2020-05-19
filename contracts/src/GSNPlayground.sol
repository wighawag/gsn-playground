pragma solidity 0.6.5;

// TODO import "./MetaTransaction/MetaTxReceiverBase.sol";
import "./MetaTransaction/MetaTxReceiverBaseWithInitialTrustedForwarder.sol";

contract GSNPlayground is MetaTxReceiverBaseWithInitialTrustedForwarder {
    event NameChanged(address indexed user, string name);

    function setName(string calldata name) external {
        address sender = _msgSender();
        _names[sender] = name;
        emit NameChanged(sender, name);
    }

    // ////////////////// CONSTRUCTOR /////////////////////////////
    constructor(ForwarderRegistry forwarderRegistry, address trustedForwarder)
        public MetaTxReceiverBaseWithInitialTrustedForwarder(forwarderRegistry, trustedForwarder) {
        _owner = msg.sender;
    }

    // ///////////////////     DATA      //////////////////////////
    mapping(address => string) _names;
    address _owner;
}
