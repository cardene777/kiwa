// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVoteToken {
    function getVotes(address account) external view returns (uint256);
}

/// @notice Minimal Governor (propose / castVote / state / quorum)
contract SimpleDao {
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        string description;
        mapping(address => bool) hasVoted;
    }

    IVoteToken public immutable voteToken;
    uint256 public immutable votingPeriod;
    uint256 public immutable quorum;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) private _proposals;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event VoteCast(uint256 indexed id, address indexed voter, uint8 support, uint256 weight);

    error AlreadyVoted();
    error NotActive();
    error InvalidVoteType();

    constructor(address token, uint256 _votingPeriod, uint256 _quorum) {
        voteToken = IVoteToken(token);
        votingPeriod = _votingPeriod;
        quorum = _quorum;
    }

    function propose(string calldata description) external returns (uint256 id) {
        proposalCount++;
        id = proposalCount;
        Proposal storage p = _proposals[id];
        p.proposer = msg.sender;
        p.startBlock = block.number;
        p.endBlock = block.number + votingPeriod;
        p.description = description;
        emit ProposalCreated(id, msg.sender, description);
    }

    function castVote(uint256 id, uint8 support) external returns (uint256 weight) {
        Proposal storage p = _proposals[id];
        if (state(id) != ProposalState.Active) revert NotActive();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();
        if (support > uint8(VoteType.Abstain)) revert InvalidVoteType();

        weight = voteToken.getVotes(msg.sender);
        p.hasVoted[msg.sender] = true;
        if (VoteType(support) == VoteType.For) p.forVotes += weight;
        else if (VoteType(support) == VoteType.Against) p.againstVotes += weight;
        else p.abstainVotes += weight;

        emit VoteCast(id, msg.sender, support, weight);
    }

    function state(uint256 id) public view returns (ProposalState) {
        Proposal storage p = _proposals[id];
        if (p.startBlock == 0) return ProposalState.Pending;
        if (block.number <= p.endBlock) return ProposalState.Active;
        if (p.forVotes + p.abstainVotes < quorum) return ProposalState.Defeated;
        if (p.forVotes > p.againstVotes) return ProposalState.Succeeded;
        return ProposalState.Defeated;
    }

    function proposalView(uint256 id)
        external
        view
        returns (
            address proposer,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes
        )
    {
        Proposal storage p = _proposals[id];
        return (p.proposer, p.startBlock, p.endBlock, p.forVotes, p.againstVotes, p.abstainVotes);
    }

    function hasVoted(uint256 id, address voter) external view returns (bool) {
        return _proposals[id].hasVoted[voter];
    }
}
