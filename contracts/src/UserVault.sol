pragma solidity 0.6.5;

import "./Interfaces/ERC20.sol";
import "./PaymentGateway.sol";
import "./MetaTransaction/MetaTxReceiverBase.sol";

contract UserVault is PaymentDestination, MetaTxReceiverBase {

    event Withdrawn(
        address indexed account,
        address indexed dest,
        address token, // address(0) for ETH
        uint256 amount
    );

    event Deposited(
        address indexed paymaster,
        address indexed from,
        address token, // address(0) for ETH
        uint256 amount
    );

    event DelegateApproval(address indexed user, address indexed delegate, bool approved);

    ERC20 immutable _payToken;
    PaymentGateway _paymentGateway;
    mapping(address => mapping(ERC20 => uint256)) _tokenBalances;
    mapping(address => uint256) _ethBalances;
    // mapping(address => address) _delegateToUser;
    mapping(address => mapping(address => bool)) _userDelegates;

    constructor(ForwarderRegistry forwarderRegistry, ERC20 payToken, PaymentGateway paymentGateway) public MetaTxReceiverBase(forwarderRegistry) {
        _payToken = payToken;
        _paymentGateway = paymentGateway;
        paymentGateway.setDestination(this);
    }

    function depositFor(address target) external override payable {
        _ethBalances[target] += msg.value;
        emit Deposited(target, msg.sender, address(0), msg.value);
    }

    function tokensDeposited(address target, address from, ERC20 token, uint256 amount) external override {
        require(msg.sender == address(_paymentGateway), "UNAUTHORIZED");
        _tokenBalances[target][token] += amount;
        emit Deposited(target, from, address(token), amount);
    }

    function withdraw(uint256 amount, address payable dest) external {
        address payable account = _msgSender();
        require(_ethBalances[account] >= amount, "FUND_INSUFICIENT");
        _ethBalances[account] -= amount;
        dest.transfer(amount);
        emit Withdrawn(account, dest, address(0), amount);
    }

    function withdrawToken(ERC20 token, uint256 amount, address payable dest) external {
        address payable account = _msgSender();
        require(_tokenBalances[account][token] >= amount, "");
        _tokenBalances[account][token] -= amount;
        token.transfer(dest, amount);
        emit Withdrawn(account, dest, address(token), amount);
    }

    function forward(address from, address destination, bytes calldata data) external payable returns (bool success, bytes memory returnData) {
        require(destination != address(this), "DESTINATION_INVALID_SELF");
        address sender = _msgSender();
        if (sender != from) {
            require(_userDelegates[from][sender], "UNAUTHORIZED_DELEGATE");
        }
        (success, returnData) = destination.call{value:msg.value}(abi.encodePacked(data, from));
    }

    function approveDelegate(address delegate, bool approved) external {
        address sender = _msgSender();
        _userDelegates[sender][delegate] = approved;
        emit DelegateApproval(sender, delegate, approved);
    }

    // function forward(address destination, bytes calldata data) external payable returns (bool success, bytes memory returnData) {
    //     require(destination != address(this), "DESTINATION_INVALID_SELF");
    //     address sender = _msgSender();
    //     address addressViaDelegate = _delegateToUser[sender]; // is the signer a delegate ? if so forward the user address instead
    //     if (addressViaDelegate != address(0)) {
    //         sender = addressViaDelegate;
    //     }
    //     (success, returnData) = to.call{value:msg.value}(abi.encodePacked(data, sender));
    // }

    // function addDelegateFor(address user) {
    //     address delegate = _msgSender();
    //     _delegateToUser[delegate] = user;
    // }
}
