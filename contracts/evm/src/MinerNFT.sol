// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IFeeConfig {
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
 * @title MinerNFT
 * @notice TYT v3 Miner NFT - Represents ownership of virtual mining power
 * @dev ERC-721 with metadata for miner type, hashrate/power, level, and active status.
 *      Supports upgrades and status changes with proper event emission.
 *      Integrates with FeeConfigGovernance for 60/30/10 fee splits.
 */
contract MinerNFT is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    Counters.Counter private _tokenIdCounter;

    IFeeConfig public feeConfig;
    uint256 public mintPrice;

    struct MinerData {
        uint256 minerTypeId;
        uint256 powerHashrate;
        uint256 level;
        bool isActive;
        uint256 mintedAt;
        uint256 lastUpgradeAt;
    }

    mapping(uint256 => MinerData) private _minerData;

    uint256 public constant MAX_LEVEL = 10;
    uint256 public constant MAX_POWER = 1_000_000 * 1e18; // 1M TH/s max

    string private _baseTokenURI;

    event MinerMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 minerTypeId,
        uint256 initialPower
    );

    event MinerUpgraded(
        uint256 indexed tokenId,
        uint256 oldPower,
        uint256 newPower,
        uint256 oldLevel,
        uint256 newLevel
    );

    event MinerStatusChanged(
        uint256 indexed tokenId,
        bool isActive
    );

    event BaseURIUpdated(string newBaseURI);
    event FeeConfigUpdated(address indexed newFeeConfig);
    event MintPriceUpdated(uint256 newPrice);
    event FeesDistributed(
        uint256 indexed tokenId,
        uint256 totalFee,
        uint256 protocolFee,
        uint256 charityFee,
        uint256 academyFee
    );

    error MinerNotFound(uint256 tokenId);
    error NotOwnerOrApproved(uint256 tokenId, address caller);
    error InvalidPower(uint256 power);
    error InvalidLevel(uint256 level);
    error MinerInactive(uint256 tokenId);
    error AlreadyMaxLevel(uint256 tokenId);
    error InsufficientPayment(uint256 required, uint256 provided);
    error InvalidFeeConfig();
    error FeeTransferFailed();

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address admin,
        address _feeConfig,
        uint256 _mintPrice
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _baseTokenURI = baseURI;
        feeConfig = IFeeConfig(_feeConfig);
        mintPrice = _mintPrice;
    }

    function mint(
        address to,
        uint256 minerTypeId,
        uint256 initialPower,
        string calldata tokenURI_
    ) external payable nonReentrant returns (uint256) {
        if (initialPower == 0 || initialPower > MAX_POWER) {
            revert InvalidPower(initialPower);
        }

        if (msg.value < mintPrice) {
            revert InsufficientPayment(mintPrice, msg.value);
        }

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Distribute fees (60/30/10 split)
        _distributeFees(tokenId, msg.value);

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        _minerData[tokenId] = MinerData({
            minerTypeId: minerTypeId,
            powerHashrate: initialPower,
            level: 1,
            isActive: true,
            mintedAt: block.timestamp,
            lastUpgradeAt: block.timestamp
        });

        emit MinerMinted(tokenId, to, minerTypeId, initialPower);

        return tokenId;
    }

    function mintFree(
        address to,
        uint256 minerTypeId,
        uint256 initialPower,
        string calldata tokenURI_
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        if (initialPower == 0 || initialPower > MAX_POWER) {
            revert InvalidPower(initialPower);
        }

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        _minerData[tokenId] = MinerData({
            minerTypeId: minerTypeId,
            powerHashrate: initialPower,
            level: 1,
            isActive: true,
            mintedAt: block.timestamp,
            lastUpgradeAt: block.timestamp
        });

        emit MinerMinted(tokenId, to, minerTypeId, initialPower);

        return tokenId;
    }

    function _distributeFees(uint256 tokenId, uint256 amount) internal {
        bytes32 mintKey = keccak256("mint.default");

        (
            uint256 feeTotal,
            uint256 protocolFee,
            uint256 charityFee,
            uint256 academyFee
        ) = feeConfig.calculateFees(mintKey, amount);

        (
            address protocolTreasury,
            address charityVault,
            address academyVault
        ) = feeConfig.getFeeRecipients(mintKey);

        // Transfer fees to recipients
        if (protocolFee > 0) {
            (bool success, ) = protocolTreasury.call{value: protocolFee}("");
            if (!success) revert FeeTransferFailed();
        }

        if (charityFee > 0) {
            (bool success, ) = charityVault.call{value: charityFee}("");
            if (!success) revert FeeTransferFailed();
        }

        if (academyFee > 0) {
            (bool success, ) = academyVault.call{value: academyFee}("");
            if (!success) revert FeeTransferFailed();
        }

        emit FeesDistributed(tokenId, feeTotal, protocolFee, charityFee, academyFee);
    }

    function upgrade(
        uint256 tokenId,
        uint256 newPower,
        uint256 newLevel
    ) external {
        if (!_exists(tokenId)) revert MinerNotFound(tokenId);

        address owner = ownerOf(tokenId);
        if (
            msg.sender != owner &&
            !isApprovedForAll(owner, msg.sender) &&
            getApproved(tokenId) != msg.sender &&
            !hasRole(UPGRADER_ROLE, msg.sender)
        ) {
            revert NotOwnerOrApproved(tokenId, msg.sender);
        }

        MinerData storage miner = _minerData[tokenId];

        if (!miner.isActive) revert MinerInactive(tokenId);
        if (newPower == 0 || newPower > MAX_POWER) revert InvalidPower(newPower);
        if (newLevel == 0 || newLevel > MAX_LEVEL) revert InvalidLevel(newLevel);
        if (newLevel <= miner.level && newPower <= miner.powerHashrate) {
            revert InvalidLevel(newLevel);
        }

        uint256 oldPower = miner.powerHashrate;
        uint256 oldLevel = miner.level;

        miner.powerHashrate = newPower;
        miner.level = newLevel;
        miner.lastUpgradeAt = block.timestamp;

        emit MinerUpgraded(tokenId, oldPower, newPower, oldLevel, newLevel);
    }

    function setActive(uint256 tokenId, bool isActive) external {
        if (!_exists(tokenId)) revert MinerNotFound(tokenId);

        address owner = ownerOf(tokenId);
        if (
            msg.sender != owner &&
            !isApprovedForAll(owner, msg.sender) &&
            getApproved(tokenId) != msg.sender &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) {
            revert NotOwnerOrApproved(tokenId, msg.sender);
        }

        _minerData[tokenId].isActive = isActive;

        emit MinerStatusChanged(tokenId, isActive);
    }

    function getMinerData(uint256 tokenId) external view returns (
        uint256 minerTypeId,
        uint256 powerHashrate,
        uint256 level,
        bool isActive,
        uint256 mintedAt,
        uint256 lastUpgradeAt
    ) {
        if (!_exists(tokenId)) revert MinerNotFound(tokenId);

        MinerData storage miner = _minerData[tokenId];
        return (
            miner.minerTypeId,
            miner.powerHashrate,
            miner.level,
            miner.isActive,
            miner.mintedAt,
            miner.lastUpgradeAt
        );
    }

    function getPower(uint256 tokenId) external view returns (uint256) {
        if (!_exists(tokenId)) revert MinerNotFound(tokenId);
        return _minerData[tokenId].powerHashrate;
    }

    function getLevel(uint256 tokenId) external view returns (uint256) {
        if (!_exists(tokenId)) revert MinerNotFound(tokenId);
        return _minerData[tokenId].level;
    }

    function isActive(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) revert MinerNotFound(tokenId);
        return _minerData[tokenId].isActive;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function setBaseURI(string calldata newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setFeeConfig(address _feeConfig) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_feeConfig == address(0)) revert InvalidFeeConfig();
        feeConfig = IFeeConfig(_feeConfig);
        emit FeeConfigUpdated(_feeConfig);
    }

    function setMintPrice(uint256 _mintPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }

    function withdrawBalance() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = msg.sender.call{value: balance}("");
            require(success, "Withdrawal failed");
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        delete _minerData[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
