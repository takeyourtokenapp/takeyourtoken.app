// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FeeConfig
 * @notice TYT v3 Canonical Fee Configuration Contract
 * @dev Stores fee profiles by bytes32 key with configurable recipients and split percentages.
 *      Default v3 canonical: 10% total fee (1000 bps), split 60/30/10 to protocol/charity/academy
 */
contract FeeConfig is AccessControl {
    bytes32 public constant FEE_SETTER_ROLE = keccak256("FEE_SETTER_ROLE");

    uint256 public constant MAX_FEE_BPS = 2000; // 20% max
    uint256 public constant BPS_DENOMINATOR = 10_000;

    struct FeeProfile {
        uint256 totalBps;
        address[] recipients;
        uint256[] splitBps;
        bool exists;
    }

    mapping(bytes32 => FeeProfile) private _profiles;
    bytes32[] private _profileKeys;

    event FeeProfileUpdated(
        bytes32 indexed key,
        uint256 totalBps,
        address[] recipients,
        uint256[] splitBps
    );
    event FeeProfileRemoved(bytes32 indexed key);

    error InvalidFeeAmount(uint256 provided, uint256 max);
    error ArrayLengthMismatch(uint256 recipientsLength, uint256 splitLength);
    error SplitSumInvalid(uint256 sum, uint256 expected);
    error ZeroAddressRecipient();
    error ProfileNotFound(bytes32 key);

    constructor(address admin, address feeSetter) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FEE_SETTER_ROLE, feeSetter);

        _initializeDefaultProfiles();
    }

    function _initializeDefaultProfiles() internal {
        address[] memory defaultRecipients = new address[](3);
        defaultRecipients[0] = address(0); // Placeholder for protocol
        defaultRecipients[1] = address(0); // Placeholder for charity
        defaultRecipients[2] = address(0); // Placeholder for academy

        uint256[] memory defaultSplits = new uint256[](3);
        defaultSplits[0] = 6000; // 60% to protocol
        defaultSplits[1] = 3000; // 30% to charity
        defaultSplits[2] = 1000; // 10% to academy
    }

    function setFeeProfile(
        bytes32 key,
        uint256 totalBps,
        address[] calldata recipients,
        uint256[] calldata splitBps
    ) external onlyRole(FEE_SETTER_ROLE) {
        if (totalBps > MAX_FEE_BPS) {
            revert InvalidFeeAmount(totalBps, MAX_FEE_BPS);
        }
        if (recipients.length != splitBps.length) {
            revert ArrayLengthMismatch(recipients.length, splitBps.length);
        }

        uint256 splitSum = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) {
                revert ZeroAddressRecipient();
            }
            splitSum += splitBps[i];
        }

        if (splitSum != BPS_DENOMINATOR) {
            revert SplitSumInvalid(splitSum, BPS_DENOMINATOR);
        }

        if (!_profiles[key].exists) {
            _profileKeys.push(key);
        }

        _profiles[key] = FeeProfile({
            totalBps: totalBps,
            recipients: recipients,
            splitBps: splitBps,
            exists: true
        });

        emit FeeProfileUpdated(key, totalBps, recipients, splitBps);
    }

    function removeFeeProfile(bytes32 key) external onlyRole(FEE_SETTER_ROLE) {
        if (!_profiles[key].exists) {
            revert ProfileNotFound(key);
        }

        delete _profiles[key];

        for (uint256 i = 0; i < _profileKeys.length; i++) {
            if (_profileKeys[i] == key) {
                _profileKeys[i] = _profileKeys[_profileKeys.length - 1];
                _profileKeys.pop();
                break;
            }
        }

        emit FeeProfileRemoved(key);
    }

    function getFeeProfile(bytes32 key) external view returns (
        uint256 totalBps,
        address[] memory recipients,
        uint256[] memory splitBps,
        bool exists
    ) {
        FeeProfile storage profile = _profiles[key];
        return (
            profile.totalBps,
            profile.recipients,
            profile.splitBps,
            profile.exists
        );
    }

    function calculateFee(bytes32 key, uint256 amount) external view returns (
        uint256 feeTotal,
        address[] memory recipients,
        uint256[] memory feeAmounts
    ) {
        FeeProfile storage profile = _profiles[key];
        if (!profile.exists) {
            revert ProfileNotFound(key);
        }

        feeTotal = (amount * profile.totalBps) / BPS_DENOMINATOR;
        recipients = profile.recipients;
        feeAmounts = new uint256[](profile.splitBps.length);

        for (uint256 i = 0; i < profile.splitBps.length; i++) {
            feeAmounts[i] = (feeTotal * profile.splitBps[i]) / BPS_DENOMINATOR;
        }
    }

    function profileExists(bytes32 key) external view returns (bool) {
        return _profiles[key].exists;
    }

    function getProfileKeys() external view returns (bytes32[] memory) {
        return _profileKeys;
    }

    function getProfileCount() external view returns (uint256) {
        return _profileKeys.length;
    }

    function DEPOSIT_DEFAULT_KEY() external pure returns (bytes32) {
        return keccak256("deposit.default");
    }

    function MARKETPLACE_DEFAULT_KEY() external pure returns (bytes32) {
        return keccak256("marketplace.default");
    }

    function WITHDRAWAL_DEFAULT_KEY() external pure returns (bytes32) {
        return keccak256("withdrawal.default");
    }
}
