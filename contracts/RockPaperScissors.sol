// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Commit-Reveal Rock Paper Scissors
/// @notice Two players stake ETH, commit their move hash, then reveal. Winner takes the pot; draw refunds.
/// @dev Moves: 0 = Rock, 1 = Paper, 2 = Scissors
contract RockPaperScissors {
    enum Stage { None, Committed, Revealing, Finished }

    struct Game {
        address player1;
        address player2;
        uint256 stake;
        bytes32 commit1;
        bytes32 commit2;
        uint8 move1;
        uint8 move2;
        Stage stage;
        uint256 deadline; // reveal deadline (block timestamp)
    }

    uint256 public constant REVEAL_WINDOW = 15 minutes;
    uint256 public nextGameId = 1;
    mapping(uint256 => Game) public games;

    event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 stake);
    event MoveCommitted(uint256 indexed gameId, address indexed player);
    event MoveRevealed(uint256 indexed gameId, address indexed player, uint8 move);
    event GameResolved(uint256 indexed gameId, address winner);
    event Refunded(uint256 indexed gameId, address player, uint256 amount);

    error InvalidStake();
    error NotParticipant();
    error BadStage();
    error AlreadyCommitted();
    error InvalidMove();
    error InvalidReveal();
    error TooEarly();

    modifier onlyPlayers(uint256 gameId) {
        Game storage g = games[gameId];
        if (msg.sender != g.player1 && msg.sender != g.player2) revert NotParticipant();
        _;
    }

    function createGame(address opponent, bytes32 yourCommit) external payable returns (uint256 gameId) {
        if (msg.value == 0) revert InvalidStake();
        require(opponent != address(0) && opponent != msg.sender, "bad opponent");
        require(yourCommit != bytes32(0), "empty commit");

        gameId = nextGameId++;
        Game storage g = games[gameId];
        g.player1 = msg.sender;
        g.player2 = opponent;
        g.stake = msg.value;
        g.commit1 = yourCommit;
    g.stage = Stage.Committed;
    // initialize moves as unrevealed sentinel 255
    g.move1 = 255;
    g.move2 = 255;

        emit GameCreated(gameId, g.player1, g.player2, g.stake);
        emit MoveCommitted(gameId, g.player1);
    }

    function joinAndCommit(uint256 gameId, bytes32 yourCommit) external payable {
        Game storage g = games[gameId];
        if (g.stage != Stage.Committed) revert BadStage();
        require(msg.sender == g.player2, "not invited");
        require(msg.value == g.stake, "stake mismatch");
        if (g.commit2 != bytes32(0)) revert AlreadyCommitted();
        require(yourCommit != bytes32(0), "empty commit");

        g.commit2 = yourCommit;
        g.stage = Stage.Revealing;
        g.deadline = block.timestamp + REVEAL_WINDOW;

        emit MoveCommitted(gameId, g.player2);
    }

    function reveal(uint256 gameId, uint8 move, bytes32 salt) external onlyPlayers(gameId) {
        Game storage g = games[gameId];
        if (g.stage != Stage.Revealing) revert BadStage();
        if (move > 2) revert InvalidMove();

        if (msg.sender == g.player1) {
            require(g.commit1 == keccak256(abi.encodePacked(move, salt)), "bad reveal");
            g.move1 = move;
        } else {
            require(g.commit2 == keccak256(abi.encodePacked(move, salt)), "bad reveal");
            g.move2 = move;
        }

        emit MoveRevealed(gameId, msg.sender, move);

        // If both revealed or deadline passed after this tx, resolve
    if ((g.move1 <= 2 && g.move2 <= 2) || block.timestamp >= g.deadline) {
            _resolve(gameId);
        }
    }

    function claimTimeout(uint256 gameId) external onlyPlayers(gameId) {
        Game storage g = games[gameId];
        if (g.stage != Stage.Revealing) revert BadStage();
        if (block.timestamp < g.deadline) revert TooEarly();
        _resolve(gameId);
    }

    function _resolve(uint256 gameId) internal {
        Game storage g = games[gameId];
        require(g.stage == Stage.Revealing, "bad stage");
        g.stage = Stage.Finished;

        uint256 pot = address(this).balance;
        uint256 total = g.stake * 2;
        require(pot >= total, "insufficient pot");

        // Cases
    bool p1Revealed = g.move1 <= 2;
    bool p2Revealed = g.move2 <= 2;

        address winner;
        if (p1Revealed && p2Revealed) {
            int8 result = _rps(g.move1, g.move2); // 1 p1 wins, -1 p2 wins, 0 draw
            if (result == 1) {
                winner = g.player1;
                _payout(winner, total);
            } else if (result == -1) {
                winner = g.player2;
                _payout(winner, total);
            } else {
                // draw: refund both
                _refund(g.player1, g.stake);
                _refund(g.player2, g.stake);
            }
        } else if (p1Revealed && !p2Revealed) {
            winner = g.player1;
            _payout(winner, total);
        } else if (!p1Revealed && p2Revealed) {
            winner = g.player2;
            _payout(winner, total);
        } else {
            // neither revealed, refund
            _refund(g.player1, g.stake);
            _refund(g.player2, g.stake);
        }

        emit GameResolved(gameId, winner);
    }

    function _payout(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
    }

    function _refund(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "refund failed");
        emit Refunded(0, to, amount); // gameId optional in event; left 0 for simplicity
    }

    function _rps(uint8 a, uint8 b) private pure returns (int8) {
        if (a == b) return 0;
        // (a - b + 3) % 3 == 1 => a wins
        return ((a + 3) - b) % 3 == 1 ? int8(1) : int8(-1);
    }

    // helpers
    function getCommit(uint8 move, bytes32 salt) external pure returns (bytes32) {
        require(move <= 2, "bad move");
        return keccak256(abi.encodePacked(move, salt));
    }

    receive() external payable {}
}
