import { Component, OnInit } from '@angular/core';
import io from 'socket.io-client';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  private socket: any;
  public board: string[][] = [['', '', ''], ['', '', ''], ['', '', '']];
  public currentPlayer: string | null = null;
  public winner: string | null = null;

  ngOnInit(): void {
    this.socket = io('http://localhost:3000');

    this.socket.on('updateBoard', (data: { board: string[][]; currentPlayer: string }) => {
      console.log(data)
      this.board = data.board;
      this.currentPlayer = data.currentPlayer;
      this.checkWinner();
    });

    this.socket.emit('joinGame');
  }

  makeMove(row: number, col: number): void {
    if (!this.winner && this.board[row][col] === '' && this.currentPlayer) {
      this.socket.emit('makeMove', { row, col, player: this.currentPlayer });
    }
  }

  checkWinner(): void {
    const lines = [
      // Check rows
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      // Check columns
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      // Check diagonals
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (this.board[a[0]][a[1]] && this.board[a[0]][a[1]] === this.board[b[0]][b[1]] && this.board[a[0]][a[1]] === this.board[c[0]][c[1]]) {
        this.winner = this.board[a[0]][a[1]];
        break;
      }
    }
  }

  resetGame(): void {
    this.socket.emit('resetGame');
    this.winner = null;
    this.currentPlayer = null;
  }
}
