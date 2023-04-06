// SPDX-License-Identifier: CC-BY-NC-4.0

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./IDC.sol";

// Replace domain name like s.country at the top of the profile page by a list of 5 emoji icons ☝️🥇💯 – 💌☎️ and their counters. Emoji reactions: 1 token for☝️ (one above), 10 tokens for🥇 (first prize), 100 tokens for 💯 (100 percent). Each emoji icon and its counter – similar to Discord’s post reactions but with payment. User clicks the emoji icon to pay the token amounts (1, 10, 100) to increase its counter. Contact info: 💌 (email address) and  ☎️ (phone number). User clicks the emoji icon to pay the token amounts (20, 40) to reveal the contact info.

contract Emoji is Ownable {
    // Enum for the emoji reactions
    enum EmojiType {
      ONE_ABOVE,
      FIRST_PRIZE,
      ONE_HUNDRED_PERCENT
    }

    /// @dev DC contract
    address public dc;

    /// @dev Revenue account
    address public revenueAccount;

    /// @dev Emoji Type -> Price
    mapping(EmojiType => uint256) public emojiReactionPrices;

    mapping(string => mapping(EmojiType => uint256)) public emojiReactionCounters;

    mapping(EmojiType => uint256) public totalEmojiReactionCounter;

    mapping(string => uint256) public lastEmojiReactionTimestamp;

    event RevenueAccountChanged(address indexed from, address indexed to);

    constructor(address _dc, address _revenueAccount) {
      dc = _dc;
      revenueAccount = _revenueAccount;
    }

    function setRevenueAccount(address _revenueAccount) public onlyOwner {
      emit RevenueAccountChanged(revenueAccount, _revenueAccount);
      revenueAccount = _revenueAccount;
    }

    function setEmojiReactionPrice(EmojiType _emojiType, uint256 _price) external onlyOwner {
      emojiReactionPrices[_emojiType] = _price;
    }

    function addEmojiReaction(string memory _name, EmojiType _emojiType) external payable {
      require(msg.value == emojiReactionPrices[_emojiType], "Invalid payment");

      // Check if the emoji reaction counter should be initialized
      if (lastEmojiReactionTimestamp[_name] < IDC(dc).registerAt(_name)) {
        _resetEmojiReactionCounters(_name);
      }

      ++emojiReactionCounters[_name][_emojiType];
      ++totalEmojiReactionCounter[_emojiType];
    }

    function _resetEmojiReactionCounters(string memory _name) _internal {
      delete emojiReactionCounters[_name][EmojiType.ONE_ABOVE];
      delete emojiReactionCounters[_name][EmojiType.FIRST_PRIZE];
      delete emojiReactionCounters[_name][EmojiType.ONE_HUNDRED_PERCENT];
    }

    function withdraw() external {
      require(
        msg.sender == owner() || msg.sender == revenueAccount,
        "D1DC: must be owner or revenue account"
      );
      (bool success, ) = revenueAccount.call{value: address(this).balance}("");
      require(success, "D1DC: failed to withdraw");
    }
}
