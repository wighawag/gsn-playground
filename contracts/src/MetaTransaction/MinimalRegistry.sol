pragma solidity 0.6.5;
contract ForwarderRegistry {

    /// @notice emitted for each Forwarder Approval or Disaproval
    event ForwarderApproved(address indexed signer, address indexed forwarder);

    /// @notice return whether a forwarder is approved by a particular signer
    /// @param signer signer who authorized or not the forwarder
    /// @param forwarder meta transaction forwarder contract address
    function isForwarderFor(address signer, address forwarder) external view returns(bool) {
        return forwarder == address(this) || _forwarders[signer][forwarder];
    }

    /// @notice approve forwarder using the forwarder (which is msg.sender)
    /// @param approved whether to approve or disapprove (if previously approved) the forwarder
    /// @param signature signature by signer for approving forwarder
    function approveForwarder(bool approved, bytes calldata signature) external {
        _approveForwarder(_getSigner(), approved, signature, true);
    }

    /// @notice check signature and forward the meta transaction in one call.
    /// This does not record approval, it just check signature and pass through
    /// @param signature signature by signer for approving forwarder
    /// @param to destination of the call (that will receive the meta transaction)
    /// @param data the content of the call (the signer address will be appended to it)
    function forward(bytes calldata signature, address to, bytes calldata data) external payable {
        _forward(signature, to, data, false);
    }

    /// @notice approve and forward the meta transaction in one call.
    /// This is useful for forwarder that would not support call batching so that the first meta-tx is self approving
    /// @param signature signature by signer for approving forwarder
    /// @param to destination of the call (that will receive the meta transaction)
    /// @param data the content of the call (the signer address will be appended to it)
    function approveAndForward(bytes calldata signature, address to, bytes calldata data) external payable {
        _forward(signature, to, data, true);
    }
    
    // //////////////////////////////      INTERNAL         ////////////////////////////////////////
    function _forward((bytes memory signature, address to, bytes memory data, bool save) internal {
        address signer = _getSigner();
        _approveForwarder(signer, true, signature, save);

        (bool success,) = to.call{value:msg.value}(abi.encodePacked(data, signer));
        if (!success) {
            assembly { // This assembly ensure the revert contains the exact string data
                let returnDataSize := returndatasize()
                returndatacopy(0, 0, returnDataSize)
                revert(0, returnDataSize)
            }
        }
    }

    function _getSigner() internal view returns(address signer) {
        bytes memory data = msg.data;
        uint256 length = msg.data.length;
        assembly { signer := mload(sub(add(data, length), 0x00)) } // forwarder would have added that
    }

    function _approveForwarder(address signer, bool approved, bytes memory signature, bool save) internal {
        address forwarder = msg.sender;
        bytes memory dataToHash = _encodeMessage(signer, forwarder);

        if (Utilities.isContract(signer)) {
            try ERC1271(signer).isValidSignature(dataToHash, signature) returns (bytes4 value) {
                require(value == ERC1271(0).isValidSignature.selector, "SIGNATURE_1271_INVALID");
            } catch (bytes memory /*lowLevelData*/) {}
            
            try ERC1654(signer).isValidSignature(keccak256(dataToHash), signature) returns (bytes4 value) {
                require(value == ERC1654(0).isValidSignature.selector, "SIGNATURE_1654_INVALID");
            } catch (bytes memory /*lowLevelData*/) {}
            revert("NO_SUPPORTED_CONTRACT_SIGNATURE");
        } else {
            require(signer == Utilities.recoverSigner(keccak256(dataToHash), signature), "SIGNATURE_INVALID");
        }

        if (save) {
            _forwarders[signer][forwarder] = true;
            emit ForwarderApproved(signer, forwarder);
        }
    }

    function _chainId() internal virtual view returns(uint256 chainId) {
        assembly { chainId := chainid() }
    }

    // //////////////////////////// SIGNED MESSAGE ENCODING //////////////////////////////////////////
    bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId)");
    bytes32 constant EIP712DOMAIN_NAME = keccak256("ForwarderRegistry");
    bytes32 constant APPROVAL_TYPEHASH = keccak256("ApproveForwarder(address signer,address forwarder)");
    function _encodeMessage(address signer, address forwarder) internal view returns (bytes memory) {
        
        return abi.encodePacked(
            "\x19\x01",
            keccak256(abi.encode(
                EIP712DOMAIN_TYPEHASH,
                EIP712DOMAIN_NAME,
                _chainId()
            )),
            keccak256(abi.encode(
                APPROVAL_TYPEHASH,
                signer,
                forwarder
            ))
        );
    }

    // ////////////////////////////  INTERNAL STORAGE  ///////////////////////////////////////////
    mapping(address => mapping(address => bool)) internal _forwarders;
}

library Utilities {
    // ///////////////////////////// UTILITIES //////////////////////////////////////////////////
    function recoverSigner(bytes32 digest, bytes memory signature) internal pure returns(address recovered) {
        require(signature.length == 65, "SIGNATURE_INVALID_LENGTH");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }
        require(v == 27 || v == 28, "SIGNATURE_INVALID_V");

        recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0), "SIGNATURE_ZERO_ADDRESS");
    }

    function isContract(address addr) internal view returns(bool) {
        // for accounts without code, i.e. `keccak256('')`:
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

        bytes32 codehash;
        assembly {
            codehash := extcodehash(addr)
        }
        return (codehash != 0x0 && codehash != accountHash);
    }
}

interface ERC1271 {
    function isValidSignature(bytes calldata data, bytes calldata signature) external view returns (bytes4 magicValue);
}

interface ERC1654 {
   function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4 magicValue);
}
