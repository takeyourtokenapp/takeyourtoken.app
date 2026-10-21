// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CharityVault
 * @notice TYT v3 Charity Vault - Receives and tracks charitable donations
 * @dev Receives ERC20 and native tokens, tracks totals by source category.
 *      Only TREASURY_ROLE can withdraw funds (intended for multisig).
 */
contract CharityVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    struct TokenStats {
        uint256 totalReceived;
        uint256 totalWithdrawn;
        uint256 currentBalance;
    }

    struct SourceStats {
        uint256 totalReceived;
        uint256 donationCount;
    }

    mapping(address => TokenStats) public tokenStats;
    mapping(bytes32 => mapping(address => SourceStats)) public sourceStats;

    address[] private _trackedTokens;
    mapping(address => bool) private _isTracked;

    bytes32[] private _sourceCategoriesList;
    mapping(bytes32 => bool) private _sourceExists;

    event DonationReceived(
        address indexed token,
        address indexed from,
        uint256 amount,
        bytes32 indexed sourceKey,
        string memo
    );

    event DonationWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount,
        string reason
    );

    event NativeDonationReceived(
        address indexed from,
        uint256 amount,
        bytes32 indexed sourceKey,
        string memo
    );

    error InsufficientBalance(address token, uint256 requested, uint256 available);
    error ZeroAmount();
    error TransferFailed();

    constructor(address treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, treasury);
        _grantRole(TREASURY_ROLE, treasury);
    }

    receive() external payable {
        _recordNativeDonation(msg.sender, msg.value, keccak256("native.direct"), "");
    }

    function donateNative(bytes32 sourceKey, string calldata memo) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        _recordNativeDonation(msg.sender, msg.value, sourceKey, memo);
    }

    function _recordNativeDonation(
        address from,
        uint256 amount,
        bytes32 sourceKey,
        string memory memo
    ) internal {
        address nativeToken = address(0);

        if (!_isTracked[nativeToken]) {
            _trackedTokens.push(nativeToken);
            _isTracked[nativeToken] = true;
        }

        tokenStats[nativeToken].totalReceived += amount;
        tokenStats[nativeToken].currentBalance += amount;

        _recordSource(sourceKey, nativeToken, amount);

        emit NativeDonationReceived(from, amount, sourceKey, memo);
    }

    function donateERC20(
        address token,
        uint256 amount,
        bytes32 sourceKey,
        string calldata memo
    ) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (!_isTracked[token]) {
            _trackedTokens.push(token);
            _isTracked[token] = true;
        }

        tokenStats[token].totalReceived += amount;
        tokenStats[token].currentBalance += amount;

        _recordSource(sourceKey, token, amount);

        emit DonationReceived(token, msg.sender, amount, sourceKey, memo);
    }

    function depositFromFee(
        address token,
        uint256 amount,
        bytes32 sourceKey
    ) external onlyRole(DEPOSITOR_ROLE) nonReentrant {
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (!_isTracked[token]) {
            _trackedTokens.push(token);
            _isTracked[token] = true;
        }

        tokenStats[token].totalReceived += amount;
        tokenStats[token].currentBalance += amount;

        _recordSource(sourceKey, token, amount);

        emit DonationReceived(token, msg.sender, amount, sourceKey, "fee_distribution");
    }

    function _recordSource(bytes32 sourceKey, address token, uint256 amount) internal {
        if (!_sourceExists[sourceKey]) {
            _sourceCategoriesList.push(sourceKey);
            _sourceExists[sourceKey] = true;
        }

        sourceStats[sourceKey][token].totalReceived += amount;
        sourceStats[sourceKey][token].donationCount += 1;
    }

    function withdraw(
        address token,
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyRole(TREASURY_ROLE) nonReentrant {
        if (amount == 0) revert ZeroAmount();

        if (token == address(0)) {
            if (address(this).balance < amount) {
                revert InsufficientBalance(token, amount, address(this).balance);
            }

            tokenStats[token].totalWithdrawn += amount;
            tokenStats[token].currentBalance -= amount;

            (bool success, ) = to.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance < amount) {
                revert InsufficientBalance(token, amount, balance);
            }

            tokenStats[token].totalWithdrawn += amount;
            tokenStats[token].currentBalance -= amount;

            IERC20(token).safeTransfer(to, amount);
        }

        emit DonationWithdrawn(token, to, amount, reason);
    }

    function getTokenStats(address token) external view returns (
        uint256 totalReceived,
        uint256 totalWithdrawn,
        uint256 currentBalance
    ) {
        TokenStats storage stats = tokenStats[token];
        return (stats.totalReceived, stats.totalWithdrawn, stats.currentBalance);
    }

    function getSourceStats(bytes32 sourceKey, address token) external view returns (
        uint256 totalReceived,
        uint256 donationCount
    ) {
        SourceStats storage stats = sourceStats[sourceKey][token];
        return (stats.totalReceived, stats.donationCount);
    }

    function getTrackedTokens() external view returns (address[] memory) {
        return _trackedTokens;
    }

    function getSourceCategories() external view returns (bytes32[] memory) {
        return _sourceCategoriesList;
    }

    function getActualBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    function DEPOSIT_FEE_CHARITY_KEY() external pure returns (bytes32) {
        return keccak256("deposit_fee.charity");
    }

    function DEPOSIT_FEE_ACADEMY_KEY() external pure returns (bytes32) {
        return keccak256("deposit_fee.academy");
    }

    function MARKETPLACE_FEE_KEY() external pure returns (bytes32) {
        return keccak256("marketplace_fee.charity");
    }
}
