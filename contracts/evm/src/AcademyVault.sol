// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AcademyVault
 * @notice Digital-Interactive-Technology-Blockchain Crypto Academia Vault
 * @dev Receives 10% of all TYT ecosystem fees for educational initiatives
 *
 * Purpose:
 * - Fund educational content creation
 * - Reward students for quiz completion
 * - Issue certificates and achievement NFTs
 * - Support academy operations
 * - Sponsor learning events and workshops
 */
contract AcademyVault is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 public constant EDUCATOR_ROLE = keccak256("EDUCATOR_ROLE");
    bytes32 public constant WITHDRAWAL_ROLE = keccak256("WITHDRAWAL_ROLE");

    struct RewardDistribution {
        address recipient;
        uint256 amount;
        string reason;
        uint256 timestamp;
        bool executed;
    }

    struct Budget {
        uint256 contentCreation;
        uint256 studentRewards;
        uint256 certificates;
        uint256 operations;
        uint256 events;
        uint256 reserved;
    }

    mapping(address => uint256) public totalRewardsReceived;
    mapping(uint256 => RewardDistribution) public distributions;
    uint256 public distributionCount;

    Budget public budget;
    uint256 public totalReceived;
    uint256 public totalDistributed;

    event FundsReceived(address indexed from, uint256 amount, string source);
    event RewardDistributed(
        uint256 indexed distributionId,
        address indexed recipient,
        uint256 amount,
        string reason
    );
    event BudgetUpdated(
        uint256 contentCreation,
        uint256 studentRewards,
        uint256 certificates,
        uint256 operations,
        uint256 events,
        uint256 reserved
    );
    event FundsWithdrawn(address indexed to, uint256 amount, string purpose);

    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidAmount();
    error ZeroAddress();
    error DistributionAlreadyExecuted();

    constructor(address admin, address fundManager) {
        if (admin == address(0) || fundManager == address(0)) {
            revert ZeroAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FUND_MANAGER_ROLE, fundManager);
        _grantRole(EDUCATOR_ROLE, admin);
        _grantRole(WITHDRAWAL_ROLE, admin);

        // Initialize budget allocations (in basis points, 10000 = 100%)
        budget = Budget({
            contentCreation: 3000,  // 30% - Create courses, videos, tutorials
            studentRewards: 4000,   // 40% - Quiz rewards, achievement bonuses
            certificates: 1000,     // 10% - NFT certificates, badges
            operations: 1500,       // 15% - Platform maintenance, staff
            events: 500,            // 5% - Workshops, webinars, conferences
            reserved: 0             // 0% - Emergency fund
        });
    }

    /**
     * @notice Receive funds from fee splits
     */
    receive() external payable {
        _recordFundsReceived(msg.sender, msg.value, "fee_split");
    }

    /**
     * @notice Receive funds with source tracking
     */
    function receiveFunds(string calldata source) external payable {
        _recordFundsReceived(msg.sender, msg.value, source);
    }

    function _recordFundsReceived(address from, uint256 amount, string memory source) internal {
        if (amount == 0) revert InvalidAmount();

        totalReceived += amount;

        emit FundsReceived(from, amount, source);
    }

    /**
     * @notice Distribute student rewards (quiz completion, achievements)
     * @dev Can be called by educators to reward students
     */
    function distributeStudentReward(
        address student,
        uint256 amount,
        string calldata reason
    ) external onlyRole(EDUCATOR_ROLE) nonReentrant whenNotPaused returns (uint256 distributionId) {
        if (student == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        distributionId = distributionCount++;

        distributions[distributionId] = RewardDistribution({
            recipient: student,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp,
            executed: false
        });

        _executeDistribution(distributionId);
    }

    /**
     * @notice Batch distribute rewards to multiple students
     */
    function batchDistributeRewards(
        address[] calldata students,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyRole(EDUCATOR_ROLE) nonReentrant whenNotPaused {
        if (students.length != amounts.length) revert InvalidAmount();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        if (address(this).balance < totalAmount) {
            revert InsufficientBalance(totalAmount, address(this).balance);
        }

        for (uint256 i = 0; i < students.length; i++) {
            if (students[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) continue;

            uint256 distributionId = distributionCount++;

            distributions[distributionId] = RewardDistribution({
                recipient: students[i],
                amount: amounts[i],
                reason: reason,
                timestamp: block.timestamp,
                executed: false
            });

            _executeDistribution(distributionId);
        }
    }

    function _executeDistribution(uint256 distributionId) internal {
        RewardDistribution storage dist = distributions[distributionId];

        if (dist.executed) revert DistributionAlreadyExecuted();

        dist.executed = true;
        totalRewardsReceived[dist.recipient] += dist.amount;
        totalDistributed += dist.amount;

        (bool success, ) = dist.recipient.call{value: dist.amount}("");
        require(success, "Transfer failed");

        emit RewardDistributed(distributionId, dist.recipient, dist.amount, dist.reason);
    }

    /**
     * @notice Update budget allocations
     * @dev All percentages must sum to 10000 (100%)
     */
    function updateBudget(
        uint256 contentCreation,
        uint256 studentRewards,
        uint256 certificates,
        uint256 operations,
        uint256 events,
        uint256 reserved
    ) external onlyRole(FUND_MANAGER_ROLE) {
        uint256 total = contentCreation + studentRewards + certificates + operations + events + reserved;
        require(total == 10000, "Budget must sum to 100%");

        budget = Budget({
            contentCreation: contentCreation,
            studentRewards: studentRewards,
            certificates: certificates,
            operations: operations,
            events: events,
            reserved: reserved
        });

        emit BudgetUpdated(contentCreation, studentRewards, certificates, operations, events, reserved);
    }

    /**
     * @notice Withdraw funds for specific purpose
     * @dev Requires WITHDRAWAL_ROLE
     */
    function withdrawForPurpose(
        address payable to,
        uint256 amount,
        string calldata purpose
    ) external onlyRole(WITHDRAWAL_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(to, amount, purpose);
    }

    /**
     * @notice Withdraw ERC20 tokens
     */
    function withdrawToken(
        IERC20 token,
        address to,
        uint256 amount,
        string calldata purpose
    ) external onlyRole(WITHDRAWAL_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        token.safeTransfer(to, amount);

        emit FundsWithdrawn(to, amount, purpose);
    }

    /**
     * @notice Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 currentBalance,
        uint256 totalRec,
        uint256 totalDist,
        uint256 totalStudentsRewarded,
        Budget memory currentBudget
    ) {
        return (
            address(this).balance,
            totalReceived,
            totalDistributed,
            distributionCount,
            budget
        );
    }

    /**
     * @notice Get student's total rewards
     */
    function getStudentRewards(address student) external view returns (uint256) {
        return totalRewardsReceived[student];
    }

    /**
     * @notice Get distribution details
     */
    function getDistribution(uint256 distributionId) external view returns (RewardDistribution memory) {
        return distributions[distributionId];
    }

    /**
     * @notice Calculate budget allocations for current balance
     */
    function getBudgetAllocations() external view returns (
        uint256 contentCreationAmount,
        uint256 studentRewardsAmount,
        uint256 certificatesAmount,
        uint256 operationsAmount,
        uint256 eventsAmount,
        uint256 reservedAmount
    ) {
        uint256 balance = address(this).balance;

        return (
            (balance * budget.contentCreation) / 10000,
            (balance * budget.studentRewards) / 10000,
            (balance * budget.certificates) / 10000,
            (balance * budget.operations) / 10000,
            (balance * budget.events) / 10000,
            (balance * budget.reserved) / 10000
        );
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
