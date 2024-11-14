import { Chess } from "chess.js";

export const getGameOverState = (chess) => {
    // const chess = new Chess(fen);
    if (!chess.isGameOver()) {
        return '';
    }
    if (chess.isCheckmate()) {
        if (turn === 'b') {
            return 'white';
        } else {
            return 'black';
        }
    }

    if (chess.isStalemate()) {
        return 'stalemate';
    }
    if (chess.isThreefoldRepetition()) {
        return 'three fold repetition';
    }
    if (chess.isDraw()) {
        return 'draw';
    }
    return 'ERROR';
};
