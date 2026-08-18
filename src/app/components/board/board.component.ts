import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { ContractType, NegativeContract } from '../../models/king.model';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {
  gameService = inject(GameService);
  private router = inject(Router);
  
  selectedDeclarerId: number = 1;
  selectedContract: ContractType = 'noTricks';
  
  playerInputs: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  contractLabels: Record<ContractType, string> = {
    noTricks: 'No Tricks (-20/trick)',
    noHearts: 'No Hearts (-20/heart)',
    noBoys: 'No Boys (-30/boy)',
    noQueens: 'No Queens (-50/queen)',
    noKingOfHearts: 'No King of Hearts (-160)',
    noLastTwo: 'No Last Two (-90/trick)',
    trump: 'Trump / Positives (+25/trick)'
  };

  showResetModal = false;

  // 🎯 Dynamic target trick count (16 for 3 players with 48 cards, 13 for 4 players)
  get targetTricks(): number {
    return this.gameService.players().length === 3 ? 16 : 13;
  }

  openResetModal() {
    this.showResetModal = true;
  }

  cancelReset() {
    this.showResetModal = false;
  }

  confirmNewGame() {
    this.showResetModal = false;
    this.gameService.resetGame();
    this.router.navigate(['/setup']);
  }

  ngOnInit() {
    // Restore exact turn state from gameService
    this.selectedDeclarerId = this.gameService.currentDeclarerId();
    this.onDeclarerChange();
  }

  availableContracts = computed(() => {
    const declarer = this.gameService.players().find(p => p.id === Number(this.selectedDeclarerId));
    if (!declarer) return [];

    const globalCounts = this.gameService.globalContractCounts();
    const maxPositives = this.gameService.maxPositivesPerPlayer();
    const maxNegatives = this.gameService.players().length; // Adjusts global limit based on player count
    const list: { key: ContractType; label: string }[] = [];

    const negs = declarer.usedNegativeContracts;
    (Object.keys(negs) as NegativeContract[]).forEach(key => {
      const timesPlayedGlobally = globalCounts[key] || 0;
      if (!negs[key] && timesPlayedGlobally < maxNegatives) {
        list.push({ key, label: this.contractLabels[key] });
      }
    });

    const trumpsGlobally = globalCounts['trump'] || 0;
    if (declarer.usedPositiveContractsCount < maxPositives && trumpsGlobally < (maxPositives * maxNegatives)) {
      list.push({ key: 'trump', label: this.contractLabels['trump'] });
    }

    return list;
  });

  onDeclarerChange() {
    this.gameService.setDeclarerId(Number(this.selectedDeclarerId));
    const avail = this.availableContracts();
    if (avail.length > 0) {
      this.selectedContract = avail[0].key;
    }
  }

  increment(playerId: number) {
    const current = Number(this.playerInputs[playerId]) || 0;
    this.playerInputs[playerId] = current + 1;
  }

  decrement(playerId: number) {
    const current = Number(this.playerInputs[playerId]) || 0;
    if (current > 0) {
      this.playerInputs[playerId] = current - 1;
    }
  }

  calculateCalculatedScores(): Record<number, number> {
    const calculated: Record<number, number> = {};
    const players = this.gameService.players();

    players.forEach(p => {
      const count = Number(this.playerInputs[p.id]) || 0;
      switch (this.selectedContract) {
        case 'noTricks': calculated[p.id] = count * -20; break;
        case 'noHearts': calculated[p.id] = count * -20; break;
        case 'noBoys': calculated[p.id] = count * -30; break;
        case 'noQueens': calculated[p.id] = count * -50; break;
        case 'noKingOfHearts': calculated[p.id] = count > 0 ? -160 : 0; break;
        case 'noLastTwo': calculated[p.id] = count * -90; break;
        case 'trump': calculated[p.id] = count * 25; break;
      }
    });

    return calculated;
  }

  isInputValid(): boolean {
    const activePlayerIds = this.gameService.players().map(p => p.id);
    const inputs = activePlayerIds.map(id => Number(this.playerInputs[id]) || 0);
    const sum = inputs.reduce((a, b) => a + b, 0);

    switch (this.selectedContract) {
      case 'noTricks': return sum === this.targetTricks; // 🎯 Uses 16 for 3 players, 13 for 4
      case 'noHearts': return sum === 13;               // 13 Hearts in deck
      case 'noBoys': return sum === 8;                 // 8 Jacks + Kings
      case 'noQueens': return sum === 4;               // 4 Queens
      case 'noKingOfHearts': return sum === 1;         // 1 King of Hearts
      case 'noLastTwo': return sum === 2;              // 2 Last tricks
      case 'trump': return sum === this.targetTricks;    // 🎯 Uses 16 for 3 players, 13 for 4
    }
  }

  onSubmitRound() {
    if (!this.isInputValid()) return;

    const roundScores = this.calculateCalculatedScores();
    this.gameService.submitRound(Number(this.selectedDeclarerId), this.selectedContract, roundScores);

    this.playerInputs = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    // Sync UI with updated declarer state from service
    this.selectedDeclarerId = this.gameService.currentDeclarerId();
    this.onDeclarerChange();
  }

  getDeclarerName(id: number): string {
    return this.gameService.players().find(p => p.id === id)?.name || '';
  }

  trackByPlayerId(index: number, player: any) {
  return player.id;
}

  startNewGame() {
    this.gameService.resetGame();
    this.router.navigate(['/setup']);
  }
}