// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVoteToken {
    function getVotes(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/// @notice Minimal Governor (propose / castVote / queue / execute)
contract SimpleDao {
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Queued,
        Executed
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        string description;
        address target;
        uint256 value;
        bytes data;
        uint256 readyAt;
        bool queued;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    IVoteToken public immutable voteToken;
    uint256 public immutable votingPeriod;
    uint256 public immutable quorumBps;
    uint256 public immutable timelockDelay;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) private _proposals;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event VoteCast(uint256 indexed id, address indexed voter, uint8 support, uint256 weight);
    event ProposalQueued(uint256 indexed id, uint256 readyAt);
    event ProposalExecuted(uint256 indexed id, address indexed target, uint256 value);

    error AlreadyVoted();
    error NotActive();
    error InvalidVoteType();
    error ProposalNotFound();
    error VotingClosed();
    error QuorumNotReached(uint256 voted, uint256 required);
    error ProposalNotSucceeded();
    error AlreadyQueued();
    error ProposalNotQueued();
    error AlreadyExecuted();
    error TimelockNotElapsed(uint256 readyAt, uint256 currentTime);
    error ExecutionFailed();

    constructor(address token, uint256 _votingPeriod, uint256 _quorumBps, uint256 _timelockDelay) {
        voteToken = IVoteToken(token);
        votingPeriod = _votingPeriod;
        quorumBps = _quorumBps;
        timelockDelay = _timelockDelay;
    }

    function propose(string calldata description) external returns (uint256 id) {
        return _propose(address(0), 0, bytes(""), description);
    }

    function propose(
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external returns (uint256 id) {
        return _propose(target, value, data, description);
    }

    function _propose(
        address target,
        uint256 value,
        bytes memory data,
        string calldata description
    ) internal returns (uint256 id) {
        proposalCount++;
        id = proposalCount;
        Proposal storage p = _proposals[id];
        p.proposer = msg.sender;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;
        p.description = description;
        p.target = target;
        p.value = value;
        p.data = data;
        emit ProposalCreated(id, msg.sender, description);
    }

    function castVote(uint256 id, uint8 support) external returns (uint256 weight) {
        Proposal storage p = _proposals[id];
        if (p.startTime == 0) revert ProposalNotFound();
        if (block.timestamp > p.endTime) revert VotingClosed();
        if (p.queued || p.executed) revert NotActive();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();
        if (support > uint8(VoteType.Abstain)) revert InvalidVoteType();

        weight = voteToken.getVotes(msg.sender);
        p.hasVoted[msg.sender] = true;
        if (VoteType(support) == VoteType.For) p.forVotes += weight;
        else if (VoteType(support) == VoteType.Against) p.againstVotes += weight;
        else p.abstainVotes += weight;

        emit VoteCast(id, msg.sender, support, weight);
    }

    function queueProposal(uint256 id) external {
        Proposal storage p = _proposals[id];
        if (p.startTime == 0) revert ProposalNotFound();
        if (p.executed) revert AlreadyExecuted();
        if (p.queued) revert AlreadyQueued();
        if (block.timestamp <= p.endTime) revert NotActive();

        uint256 voted = _totalVotes(p);
        uint256 required = quorumVotes();
        if (voted < required) revert QuorumNotReached(voted, required);
        if (p.forVotes <= p.againstVotes) revert ProposalNotSucceeded();

        p.queued = true;
        p.readyAt = block.timestamp + timelockDelay;
        emit ProposalQueued(id, p.readyAt);
    }

    function executeProposal(uint256 id) external {
        Proposal storage p = _proposals[id];
        if (p.startTime == 0) revert ProposalNotFound();
        if (p.executed) revert AlreadyExecuted();

        uint256 voted = _totalVotes(p);
        uint256 required = quorumVotes();
        if (voted < required) revert QuorumNotReached(voted, required);
        if (p.forVotes <= p.againstVotes) revert ProposalNotSucceeded();
        if (!p.queued) revert ProposalNotQueued();
        if (block.timestamp < p.readyAt) {
            revert TimelockNotElapsed(p.readyAt, block.timestamp);
        }

        p.executed = true;
        if (p.target != address(0) || p.value != 0 || p.data.length != 0) {
            (bool ok,) = p.target.call{value: p.value}(p.data);
            if (!ok) revert ExecutionFailed();
        }

        emit ProposalExecuted(id, p.target, p.value);
    }

    function state(uint256 id) public view returns (ProposalState) {
        Proposal storage p = _proposals[id];
        if (p.startTime == 0) return ProposalState.Pending;
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp <= p.endTime) return ProposalState.Active;
        if (_totalVotes(p) < quorumVotes()) return ProposalState.Defeated;
        if (p.forVotes <= p.againstVotes) return ProposalState.Defeated;
        if (p.queued) return ProposalState.Queued;
        if (p.forVotes > p.againstVotes) return ProposalState.Succeeded;
        return ProposalState.Defeated;
    }

    function quorumVotes() public view returns (uint256) {
        return (voteToken.totalSupply() * quorumBps) / 10_000;
    }

    function proposalView(uint256 id)
        external
        view
        returns (
            address proposer,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes
        )
    {
        Proposal storage p = _proposals[id];
        return (p.proposer, p.startTime, p.endTime, p.forVotes, p.againstVotes, p.abstainVotes);
    }

    function proposalExecutionView(uint256 id)
        external
        view
        returns (address target, uint256 value, uint256 readyAt, bool queued, bool executed)
    {
        Proposal storage p = _proposals[id];
        return (p.target, p.value, p.readyAt, p.queued, p.executed);
    }

    function hasVoted(uint256 id, address voter) external view returns (bool) {
        return _proposals[id].hasVoted[voter];
    }

    function _totalVotes(Proposal storage p) internal view returns (uint256) {
        return p.forVotes + p.againstVotes + p.abstainVotes;
    }
}
