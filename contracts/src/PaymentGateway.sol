pragma solidity 0.6.5;

import "./Interfaces/ERC20.sol";

interface PaymentDestination {
    function depositFor(address target) external payable;
    function tokensDeposited(address farget, address from, ERC20 token, uint256 amount) external;
}

contract PaymentGateway {
    PaymentDestination _destination;

    function setDestination(PaymentDestination destination) external {
        require(address(_destination) == address(0), "already set");
        _destination = destination; 
    }

    function depositFor(address target) external payable {
        _destination.depositFor{value: msg.value}(target);
    }

    function tokensDeposited(address target, ERC20 token, uint256 amount) external {
        token.transfer(address(_destination), amount);
        _destination.tokensDeposited(target, msg.sender, token, amount);
    }
}
