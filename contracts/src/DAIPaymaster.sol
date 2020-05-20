pragma solidity 0.6.5;
pragma experimental ABIEncoderV2;

import "./GSN/BasePaymaster.sol";
import "./GSN/interfaces/IRelayHub.sol";
import "./Interfaces/Dai.sol";
import "./Interfaces/UniswapV2Router1.sol";

contract DAIPaymaster is BasePaymaster {
    event TokensCharged(uint256 gasUseWithoutPost, uint256 ethActualCharge, uint256 tokenActualCharge);

    Dai immutable internal _dai;
    address immutable internal _weth;
    UniswapV2Router1 immutable internal _uniswapRouter;

    bytes32 internal immutable DOMAIN_SEPARATOR;
    // bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");
    bytes32 internal constant PERMIT_TYPEHASH = 0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb;

    constructor(IRelayHub relayHub, Dai dai, address weth, UniswapV2Router1 uniswapRouter) public BasePaymaster(relayHub) {
        DOMAIN_SEPARATOR = dai.DOMAIN_SEPARATOR();
        dai.approve(address(uniswapRouter), uint256(-1));

        _dai = dai;
        _weth = weth;
        _uniswapRouter = uniswapRouter;
    }

    //return the payer of this request.
    // function getPayer(GSNTypes.RelayRequest calldata relayRequest) external pure returns (address) {
    //     return relayRequest.relayData.senderAddress;
    // }

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
        address payer = relayRequest.relayData.senderAddress;

        uint256 ethMaxCharge = _relayHub.calculateCharge(maxPossibleGas, relayRequest.gasData);
        uint256 daiPrecharge = _getDAIAmountForETH(ethMaxCharge);

        require(daiPrecharge < _dai.balanceOf(payer), "balance too low");

        if (daiPrecharge > _dai.allowance(payer, address(this))) {
            _checkValidPermit(payer, approvalData);
        }
        return abi.encode(payer, daiPrecharge, approvalData);
    }

    function deposit() external payable {
        _relayHub.depositFor{value: msg.value}(address(this));
    }

    receive() external payable {}
    fallback() external payable {}

    function _getDAIAmountForETH(uint256 eth) internal view returns (uint256) {
        address[] memory path = new address[](2); path[0] = _weth; path[1] = address(_dai);
        uint256[] memory amounts = _uniswapRouter.getAmountsOut(eth, path);
        return amounts[1];
    }

    function _callPermit(address payer, bytes memory approvalData) internal {
        (uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) = abi.decode(approvalData, (uint256, uint256, uint8, bytes32, bytes32));
        _dai.permit(payer, address(this), nonce, expiry, true, v, r, s);
    }

    function _checkValidPermit(address payer, bytes memory approvalData) internal view {
        (uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) = abi.decode(approvalData, (uint256, uint256, uint8, bytes32, bytes32));
        require(_isValidPermit(payer, address(this), nonce, expiry, true, v, r, s), "invalid permit");
    }

    // function _extractPermitArgs(bytes memory data) internal pure
    //     returns(uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) 
    // {    
    //     uint256 length = data.length;
    //     assembly { s := mload(sub(add(data, length), 0x00)) }
    //     assembly { r := mload(sub(add(data, length), 0x20)) }
    //     assembly { v := mload(sub(add(data, length), 0x40)) }
    //     // assembly { allowed := mload(sub(add(data, length), 0x60)) } // is true
    //     assembly { expiry := mload(sub(add(data, length), 0x60)) }
    //     assembly { nonce := mload(sub(add(data, length), 0x80)) }
    //     // assembly { spender := mload(sub(add(data, length), 0xC0)) } // is address(this)
    //     // assembly { holder := mload(sub(add(data, length), 0xE0)) } // is payer
    // }

    // duplicate DAI permit logic as DAI do not have a way to static_call the verification
    function _isValidPermit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) internal view returns(bool) {
        bytes32 digest =
            keccak256(abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH,
                                     holder,
                                     spender,
                                     nonce,
                                     expiry,
                                     allowed))
        ));

        require(holder != address(0), "Dai/invalid-address-0");
        require(holder == ecrecover(digest, v, r, s), "Dai/invalid-permit");
        require(expiry == 0 || now <= expiry, "Dai/permit-expired");
        require(nonce == _dai.nonces(holder), "Dai/invalid-nonce");
        return true;
    }

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
        (address payer, uint daiPrecharge, bytes memory approvalData) = abi.decode(context, (address, uint256, bytes));
        if (approvalData.length > 0) {
            _callPermit(payer, approvalData);
        }

        if (daiPrecharge != 0) {
            _dai.transferFrom(payer, address(this), daiPrecharge); // TODO give it to the relayhub directly no ?
        }
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
        (address payer, uint256 daiPrecharge,) = abi.decode(context, (address, uint256, bytes));
        uint256 ethActualCharge;
        uint256 justPost;
        uint256 daiActualCharge;

        if (daiPrecharge == 0) {
            justPost = 10000; // TODO gasUsedByPostWithoutPreCharge;
            ethActualCharge = _relayHub.calculateCharge(gasUseWithoutPost + justPost, gasData);
            daiActualCharge = _getDAIAmountForETH(ethActualCharge);

            //no precharge. we pay now entire sum.
            require(_dai.transferFrom(payer, address(this), daiActualCharge), "failed transfer");
        } else {
            justPost = 10000; //gasUsedByPostWithoutPreCharge;
            ethActualCharge = _relayHub.calculateCharge(gasUseWithoutPost + justPost, gasData);
            daiActualCharge = _getDAIAmountForETH(ethActualCharge);

            //refund payer
            require(_dai.transfer(payer, daiPrecharge - daiActualCharge), "failed refund");
        }

        address[] memory path = new address[](2); path[0] = address(_dai); path[1] = _weth;
        _uniswapRouter.swapTokensForExactETH(ethActualCharge, uint(-1), path, address(this), block.timestamp+60*15);
        _relayHub.depositFor{value:ethActualCharge}(address(this));
        emit TokensCharged(gasUseWithoutPost, ethActualCharge, daiActualCharge);
    }
}
