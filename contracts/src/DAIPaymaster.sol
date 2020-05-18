pragma solidity 0.6.5;
pragma experimental ABIEncoderV2;

import "./GSN/BasePaymaster.sol";
import "./GSN/interfaces/IRelayHub.sol";
import "./Interfaces/Dai.sol";

contract DAIPaymaster is BasePaymaster {
    Dai immutable internal _dai;
    constructor(IRelayHub relayHub, Dai dai) public BasePaymaster(relayHub) {
        _dai = dai;
    }

    //return the payer of this request.
    // for account-based target, this is the target account.
    function getPayer(GSNTypes.RelayRequest calldata relayRequest) external pure returns (address) {
        return relayRequest.target;
    }

    /**
     * Called by Relay (and RelayHub), to validate if this recipient accepts this call.
     * revert to signal the paymaster will NOT pay for this call.
     * Note: Accepting this call means paying for the tx whether the relayed call reverted or not.
     *  @param relayRequest - the full relay request structure
     *  @param approvalData - extra dapp-specific data (e.g. signature from trusted party)
     *  @param maxPossibleGas - based on values returned from {@link getGasLimits},
     *         the RelayHub will calculate the maximum possible amount of gas the user may be charged for.
     *         In order to convert this value to wei, the Paymaster has to call "relayHub.calculateCharge()"
     *  @return a context to be passed to preRelayedCall and postRelayedCall.
     */
    function acceptRelayedCall(
        GSNTypes.RelayRequest calldata relayRequest,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external override view returns (bytes memory) {
        address payer = this.getPayer(relayRequest); // call to itself as a poor decoder of struct type

        uint256 ethMaxCharge = _relayHub.calculateCharge(maxPossibleGas, relayRequest.gasData);
        uint256 tokenPreCharge = ethMaxCharge;
        // TODO _uniswapV2Router01.getTokenToEthOutputPrice(ethMaxCharge);
        //uint256[] memory amounts = router.getAmountsOut(eth, [WETH, TOKEN]);
        // uint256 tokenPreCharge = amounts[1];

        require(tokenPreCharge < _dai.balanceOf(payer), "balance too low");

        bytes memory permitArgs;
        if (tokenPreCharge > _dai.allowance(payer, address(this))) {
            permitArgs = _callValidPermit(payer, relayRequest.encodedFunction);
        }
        return permitArgs;
    }

    function _callPermit(bytes memory context) internal {
        (address payer, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) = abi.decode(context, (address, uint256, uint256, uint8, bytes32, bytes32));
        _dai.permit(payer, address(this), nonce, expiry, true, v, r, s);
    }

    function _callValidPermit(address payer, bytes memory data) internal view returns (bytes memory permitArgs) {
        (uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) = _extractPermitArgs(data);
        require(_isValidPermit(payer, address(this), nonce, expiry, true, v, r, s), "invalid permit");
        permitArgs = abi.encode(payer, nonce, expiry, v, r, s); // TODO abi.encodeWithSelector to have the whole encoded data ready (including: holder, spender and allowed)
    }

    function _extractPermitArgs(bytes memory data) internal pure
        returns(uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) 
    {    
        uint256 length = data.length;
        assembly { s := mload(sub(add(data, length), 0x00)) }
        assembly { r := mload(sub(add(data, length), 0x20)) }
        assembly { v := mload(sub(add(data, length), 0x40)) }
        // assembly { allowed := mload(sub(add(data, length), 0x60)) } // is true
        assembly { expiry := mload(sub(add(data, length), 0x60)) }
        assembly { nonce := mload(sub(add(data, length), 0x80)) }
        // assembly { spender := mload(sub(add(data, length), 0xC0)) } // is address(this)
        // assembly { holder := mload(sub(add(data, length), 0xE0)) } // is payer
    }

    function _isValidPermit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) internal view returns(bool) {
        return true; // TODO
    }

    // function getSlice(bytes data, uint256 begin, uint256 end) internal pure returns (bytes memory slice) {
    //     slice = new bytes(end-begin+1);
    //     for(uint i=0;i<=end-begin;i++){
    //         a[i] = data[i+begin-1];
    //     }
    //     return slice;
    // }

    /** this method is called before the actual relayed function call.
     * It may be used to charge the caller before
     * (in conjunction with refunding him later in postRelayedCall for example).
     * the method is given all parameters of acceptRelayedCall and actual used gas.
     *
     *
     * NOTICE: if this method modifies the contract's state, it must be
     * protected with access control i.e. require msg.sender == getHubAddr()
     *
     *
     * Revert in this functions causes a revert of the client's relayed call but not in the entire transaction
     * (that is, the relay will still get compensated)
     */
    function preRelayedCall(bytes calldata context) external override relayHubOnly returns (bytes32) {
        if (context.length > 0) {
            _callPermit(context);
        }
        // TODO preCharge here to ensure balance is available
        // see TokenPaymaster
        return bytes32(0);
    }

    /**
     * This method is called after the actual relayed function call.
     * It may be used to record the transaction (e.g. charge the caller by some contract logic) for this call.
     * the method is given all parameters of acceptRelayedCall, and also the success/failure status and actual used gas.
     *
     *
     * NOTICE: if this method modifies the contract's state,
     * it must be protected with access control i.e. require msg.sender == getHubAddr()
     *
     *
     * @param success - true if the relayed call succeeded, false if it reverted
     * @param gasUseWithoutPost - the actual amount of gas used by the entire transaction.
              Does not included any estimate of how much gas PostRelayCall itself will consume.
              NOTE: The gas overhead estimation is included in this number.
     * @param preRetVal - preRelayedCall() return value passed back to the recipient
     *
     * Revert in this functions causes a revert of the client's relayed call but not in the entire transaction
     * (that is, the relay will still get compensated)
     */
    function postRelayedCall(
        bytes calldata context,
        bool success,
        bytes32 preRetVal,
        uint256 gasUseWithoutPost,
        GSNTypes.GasData calldata gasData
    ) external override relayHubOnly {
        // TODO refund extra charge
        // see TokenPaymaster
    }
}
