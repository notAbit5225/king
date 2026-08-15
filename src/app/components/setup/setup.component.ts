import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css'
})
export class SetupComponent {
  private gameService = inject(GameService);
  private router = inject(Router);

  player1 = '';
  player2 = '';
  player3 = '';
  player4 = '';
  maxPositives = 2;

  onStartGame() {
    const names = [this.player1, this.player2, this.player3, this.player4];
    this.gameService.initGame(names, Number(this.maxPositives));
    this.router.navigate(['/board']);
  }
}