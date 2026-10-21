// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MinerNFT.sol";

interface IFeeConfigMarketplace {
    function calculateFees(bytes32 key, uint256 amount) external view returns (
        uint256 feeTotal,
        uint256 protocolFee,
        uint256 charityFee,
        uint256 academyFee
    );

    function getFeeRecipients(bytes32 key) external view returns (
        address protocolTreasury,
        address charityVault,
        address academyVault
    );
}

/**
 * @title MinerMarketplace
 * @notice TYT v3 Miner NFT Marketplace - List and buy MinerNFTs with 60/30/10 fee distribution
 * @dev Integrates with FeeConfigGovernance for configurable fee profiles.
 *      Fees are split: 60% Protocol, 30% Charity Foundation, 10% Academy
 */
contract MinerMarketplace is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    Counters.Counter private _orderIdCounter;

    IFeeConfigMarketplace public feeConfig;
    MinerNFT public minerNFT;

    enum OrderStatus { Active, Filled, Cancelled }

    struct Order {
        uint256 orderId;
        uint256 tokenId;
        address seller;
        address paymentToken;
        uint256 price;
        OrderStatus status;
        uint256 createdAt;
        uint256 filledAt;
        address buyer;
    }

    mapping(uint256 => Order) public orders;
    mapping(uint256 => uint256) public tokenIdToOrderId;
    uint256[] private _activeOrderIds;

    bool public isPaused;

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed tokenId,
        address indexed seller,
        address paymentToken,
        uint256 price
    );

    event OrderFilled(
        uint256 indexed orderId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price,
        uint256 feeTotal,
        uint256[] feeAmounts
    );

    event OrderCancelled(
        uint256 indexed orderId,
        uint256 indexed tokenId,
        address indexed seller
    );

    event FeeConfigUpdated(address newFeeConfig);
    event FeeProfileKeyUpdated(bytes32 newKey);
    event MarketplacePaused(bool isPaused);

    error OrderNotFound(uint256 orderId);
    error OrderNotActive(uint256 orderId);
    error NotSeller(uint256 orderId, address caller);
    error TokenAlreadyListed(uint256 tokenId);
    error NotTokenOwner(uint256 tokenId, address caller);
    error InsufficientPayment(uint256 required, uint256 provided);
    error MarketplacePausedError();
    error InvalidPrice();
    error CannotBuyOwnToken();
    error TransferFailed();

    constructor(
        address _feeConfig,
        address _minerNFT,
        address admin
    ) {
        feeConfig = IFeeConfigMarketplace(_feeConfig);
        minerNFT = MinerNFT(_minerNFT);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    function createOrder(
        uint256 tokenId,
        address paymentToken,
        uint256 price
    ) external whenNotPaused nonReentrant returns (uint256) {
        if (price == 0) revert InvalidPrice();
        if (minerNFT.ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner(tokenId, msg.sender);
        }
        if (tokenIdToOrderId[tokenId] != 0 && orders[tokenIdToOrderId[tokenId]].status == OrderStatus.Active) {
            revert TokenAlreadyListed(tokenId);
        }

        minerNFT.transferFrom(msg.sender, address(this), tokenId);

        uint256 orderId = _orderIdCounter.current();
        _orderIdCounter.increment();

        orders[orderId] = Order({
            orderId: orderId,
            tokenId: tokenId,
            seller: msg.sender,
            paymentToken: paymentToken,
            price: price,
            status: OrderStatus.Active,
            createdAt: block.timestamp,
            filledAt: 0,
            buyer: address(0)
        });

        tokenIdToOrderId[tokenId] = orderId;
        _activeOrderIds.push(orderId);

        emit OrderCreated(orderId, tokenId, msg.sender, paymentToken, price);

        return orderId;
    }

    function fillOrder(uint256 orderId) external payable whenNotPaused nonReentrant {
        Order storage order = orders[orderId];

        if (order.createdAt == 0) revert OrderNotFound(orderId);
        if (order.status != OrderStatus.Active) revert OrderNotActive(orderId);
        if (order.seller == msg.sender) revert CannotBuyOwnToken();

        bytes32 marketplaceKey = keccak256("marketplace.default");

        // Calculate fees with 60/30/10 split
        (
            uint256 feeTotal,
            uint256 protocolFee,
            uint256 charityFee,
            uint256 academyFee
        ) = feeConfig.calculateFees(marketplaceKey, order.price);

        (
            address protocolTreasury,
            address charityVault,
            address academyVault
        ) = feeConfig.getFeeRecipients(marketplaceKey);

        uint256 sellerReceives = order.price - feeTotal;

        if (order.paymentToken == address(0)) {
            // Native token payment (e.g., ETH/MATIC)
            if (msg.value < order.price) {
                revert InsufficientPayment(order.price, msg.value);
            }

            // Transfer to seller
            (bool successSeller, ) = order.seller.call{value: sellerReceives}("");
            if (!successSeller) revert TransferFailed();

            // Distribute fees
            if (protocolFee > 0) {
                (bool successProtocol, ) = protocolTreasury.call{value: protocolFee}("");
                if (!successProtocol) revert TransferFailed();
            }

            if (charityFee > 0) {
                (bool successCharity, ) = charityVault.call{value: charityFee}("");
                if (!successCharity) revert TransferFailed();
            }

            if (academyFee > 0) {
                (bool successAcademy, ) = academyVault.call{value: academyFee}("");
                if (!successAcademy) revert TransferFailed();
            }

            // Refund excess
            if (msg.value > order.price) {
                (bool successRefund, ) = msg.sender.call{value: msg.value - order.price}("");
                if (!successRefund) revert TransferFailed();
            }
        } else {
            // ERC20 token payment
            IERC20 token = IERC20(order.paymentToken);
            token.safeTransferFrom(msg.sender, address(this), order.price);

            // Transfer to seller
            token.safeTransfer(order.seller, sellerReceives);

            // Distribute fees
            if (protocolFee > 0) {
                token.safeTransfer(protocolTreasury, protocolFee);
            }

            if (charityFee > 0) {
                token.safeTransfer(charityVault, charityFee);
            }

            if (academyFee > 0) {
                token.safeTransfer(academyVault, academyFee);
            }
        }

        // Transfer NFT to buyer
        minerNFT.transferFrom(address(this), msg.sender, order.tokenId);

        order.status = OrderStatus.Filled;
        order.filledAt = block.timestamp;
        order.buyer = msg.sender;

        _removeFromActiveOrders(orderId);

        // Create feeAmounts array for event
        uint256[] memory feeAmounts = new uint256[](3);
        feeAmounts[0] = protocolFee;
        feeAmounts[1] = charityFee;
        feeAmounts[2] = academyFee;

        emit OrderFilled(orderId, order.tokenId, msg.sender, order.price, feeTotal, feeAmounts);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];

        if (order.createdAt == 0) revert OrderNotFound(orderId);
        if (order.status != OrderStatus.Active) revert OrderNotActive(orderId);
        if (order.seller != msg.sender && !hasRole(OPERATOR_ROLE, msg.sender)) {
            revert NotSeller(orderId, msg.sender);
        }

        minerNFT.transferFrom(address(this), order.seller, order.tokenId);

        order.status = OrderStatus.Cancelled;

        _removeFromActiveOrders(orderId);

        emit OrderCancelled(orderId, order.tokenId, order.seller);
    }

    function _removeFromActiveOrders(uint256 orderId) internal {
        for (uint256 i = 0; i < _activeOrderIds.length; i++) {
            if (_activeOrderIds[i] == orderId) {
                _activeOrderIds[i] = _activeOrderIds[_activeOrderIds.length - 1];
                _activeOrderIds.pop();
                break;
            }
        }
    }

    function getOrder(uint256 orderId) external view returns (
        uint256 tokenId,
        address seller,
        address paymentToken,
        uint256 price,
        OrderStatus status,
        uint256 createdAt,
        uint256 filledAt,
        address buyer
    ) {
        Order storage order = orders[orderId];
        if (order.createdAt == 0) revert OrderNotFound(orderId);

        return (
            order.tokenId,
            order.seller,
            order.paymentToken,
            order.price,
            order.status,
            order.createdAt,
            order.filledAt,
            order.buyer
        );
    }

    function getActiveOrders() external view returns (uint256[] memory) {
        return _activeOrderIds;
    }

    function getActiveOrdersCount() external view returns (uint256) {
        return _activeOrderIds.length;
    }

    function getOrdersRange(uint256 start, uint256 count) external view returns (Order[] memory) {
        if (start >= _activeOrderIds.length) {
            return new Order[](0);
        }

        uint256 end = start + count;
        if (end > _activeOrderIds.length) {
            end = _activeOrderIds.length;
        }

        Order[] memory result = new Order[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = orders[_activeOrderIds[i]];
        }

        return result;
    }

    function calculateFeeForPrice(uint256 price) external view returns (
        uint256 feeTotal,
        address[] memory recipients,
        uint256[] memory feeAmounts
    ) {
        return feeConfig.calculateFee(feeProfileKey, price);
    }

    function setFeeConfig(address _feeConfig) external onlyRole(DEFAULT_ADMIN_ROLE) {
        feeConfig = FeeConfig(_feeConfig);
        emit FeeConfigUpdated(_feeConfig);
    }

    function setFeeProfileKey(bytes32 _feeProfileKey) external onlyRole(DEFAULT_ADMIN_ROLE) {
        feeProfileKey = _feeProfileKey;
        emit FeeProfileKeyUpdated(_feeProfileKey);
    }

    function setPaused(bool _isPaused) external onlyRole(OPERATOR_ROLE) {
        isPaused = _isPaused;
        emit MarketplacePaused(_isPaused);
    }

    function totalOrders() external view returns (uint256) {
        return _orderIdCounter.current();
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
