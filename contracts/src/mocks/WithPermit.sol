pragma solidity 0.6.5;

import "./SimpleERC20TokenWithInitialBalance.sol";
import "../Interfaces/Dai.sol";

contract WithPermit is SimpleERC20TokenWithInitialBalance, Dai {

    string public constant name = "Dai Stablecoin";
    string public constant symbol = "DAI";
    
     // --- EIP712 niceties ---
    bytes32 public override immutable DOMAIN_SEPARATOR;
    // bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");
    bytes32 public override constant PERMIT_TYPEHASH = 0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb;

    string public override constant version = "1";
    mapping(address => uint256) public override nonces;

    constructor(
        uint256 supply,
        ForwarderRegistry forwarderRegistry,
        uint256 chainId_
    ) public SimpleERC20TokenWithInitialBalance(supply, forwarderRegistry) {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId_,
                address(this)
            )
        );
    }


    // --- Approve by signature ---
    function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) external override {
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
        require(nonce == nonces[holder]++, "Dai/invalid-nonce"); // TODO check what is wrong
        uint wad = allowed ? uint(-1) : 0;
        _allowances[holder][spender] = wad;
        emit Approval(holder, spender, wad);
    }
}
