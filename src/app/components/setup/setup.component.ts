import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { PlayerCount } from '../../models/king.model';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css'
})
export class SetupComponent implements OnInit {
  public gameService = inject(GameService);
  private router = inject(Router);

  player1 = '';
  player2 = '';
  player3 = '';
  player4 = '';
  playerCount: PlayerCount = 4;
  maxPositives = 2;
  hasSavedGame = false;

  ngOnInit() {
    // Check if a saved match exists in local storage
    const saved = localStorage.getItem('king_players');
    if (saved && JSON.parse(saved).length > 0) {
      this.hasSavedGame = true;
    }
  }

  onResumeGame() {
    this.router.navigate(['/board']);
  }
onStartGame() {
    const names = this.playerCount === 3 
      ? [this.player1, this.player2, this.player3] 
      : [this.player1, this.player2, this.player3, this.player4];

    this.gameService.initGame(names, Number(this.maxPositives), this.playerCount);
    this.router.navigate(['/board']);
  }
}