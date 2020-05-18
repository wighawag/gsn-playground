pragma solidity 0.6.5;
pragma experimental ABIEncoderV2;

import "./interfaces/IPaymaster.sol";
import "./interfaces/IRelayHub.sol";


/**
 * Abstract base class to be inherited by a concrete Paymaster
 * A subclass must implement:
 *  - acceptRelayedCall
 *  - preRelayedCall
 *  - postRelayedCall
 */
abstract contract BasePaymaster is IPaymaster {
    // Gas stipends for acceptRelayedCall, preRelayedCall and postRelayedCall
    uint256 private constant ACCEPT_RELAYED_CALL_GAS_LIMIT = 50000;
    uint256 private constant PRE_RELAYED_CALL_GAS_LIMIT = 100000;
    uint256 private constant POST_RELAYED_CALL_GAS_LIMIT = 110000;

    IRelayHub immutable internal _relayHub;

    constructor(IRelayHub relayHub) internal {
        _relayHub = relayHub;
    }
    
    function getHubAddr() external override view returns (address) {
        return address(_relayHub);
    }

    function getGasLimits() external override view returns (GSNTypes.GasLimits memory limits) {
        return
            GSNTypes.GasLimits(ACCEPT_RELAYED_CALL_GAS_LIMIT, PRE_RELAYED_CALL_GAS_LIMIT, POST_RELAYED_CALL_GAS_LIMIT);
    }

    /*
     * modifier to be used by recipients as access control protection for preRelayedCall & postRelayedCall
     */
    modifier relayHubOnly() {
        require(msg.sender == address(_relayHub), "Function can only be called by RelayHub");
        _;
    }

    /// check current deposit on relay hub.
    // (wanted to name it "getRelayHubDeposit()", but we use the name from IRelayRecipient...
    function getRelayHubDeposit() public override view returns (uint256) {
        return _relayHub.balanceOf(address(this));
    }
}
