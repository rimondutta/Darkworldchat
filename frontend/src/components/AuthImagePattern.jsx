import { useState, useEffect } from 'react';

// =========================
// Helper Functions
// =========================
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

function getBestMove(board) {
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = 'O';
      if (calculateWinner(copy) === 'O') return i;
    }
  }

  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = 'X';
      if (calculateWinner(copy) === 'X') return i;
    }
  }

  if (!board[4]) return 4;

  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  const sides = [1, 3, 5, 7].filter((i) => !board[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

  return null;
}

// =========================
// AuthImagePattern Component
// =========================
const AuthImagePattern = ({ title, subtitle }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState('Your turn (X)');

  const winner = calculateWinner(board);

  useEffect(() => {
    if (!isPlayerTurn && !winner && board.some((c) => !c)) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board);
        if (bestMove !== null) {
          const newBoard = [...board];
          newBoard[bestMove] = 'O';
          setBoard(newBoard);
        }
        setIsPlayerTurn(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner]);

  useEffect(() => {
    if (winner) {
      setStatus(winner === 'X' ? 'You Win! 🎉' : 'Computer Wins 😈');
    } else if (board.every(Boolean)) {
      setStatus("It's a Draw 🤝");
    } else {
      setStatus(isPlayerTurn ? 'Your turn (X)' : "Computer's turn (O)");
    }
  }, [winner, isPlayerTurn, board]);

  const handleClick = (index) => {
    if (!isPlayerTurn || board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setStatus('Your turn (X)');
  };

  return (
    <div className="max-w-sm text-center w-full">
      <h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
      <p className="text-gray-400 mb-8">{subtitle}</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`aspect-square rounded-2xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-5xl font-bold text-white transition-all duration-200 border border-gray-700 ${
              i % 2 === 0 ? 'animate-pulse' : ''
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-gray-300 mb-4 font-medium">{status}</p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-[#605dff] hover:bg-[#6663ffc9] text-white font-medium rounded-lg transition-colors duration-200"
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default AuthImagePattern;
