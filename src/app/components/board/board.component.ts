import { Component, inject, computed } from '@angular/core';
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
export class BoardComponent {
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

  availableContracts = computed(() => {
    const declarer = this.gameService.players().find(p => p.id === Number(this.selectedDeclarerId));
    if (!declarer) return [];

    const globalCounts = this.gameService.globalContractCounts();
    const maxPositives = this.gameService.maxPositivesPerPlayer();
    const list: { key: ContractType; label: string }[] = [];

    // Check 6 negative contracts
    const negs = declarer.usedNegativeContracts;
    (Object.keys(negs) as NegativeContract[]).forEach(key => {
      const timesPlayedGlobally = globalCounts[key] || 0;
      
      // Rule 1: Declarer hasn't played it
      // Rule 2: Played less than 4 times globally
      if (!negs[key] && timesPlayedGlobally < 4) {
        list.push({ key, label: this.contractLabels[key] });
      }
    });

    // Check positive trumps
    const trumpsGlobally = globalCounts['trump'] || 0;
    if (declarer.usedPositiveContractsCount < maxPositives && trumpsGlobally < (maxPositives * 4)) {
      list.push({ key: 'trump', label: this.contractLabels['trump'] });
    }

    return list;
  });

  onDeclarerChange() {
    const avail = this.availableContracts();
    if (avail.length > 0) {
      this.selectedContract = avail[0].key;
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
    const inputs = Object.values(this.playerInputs).map(v => Number(v) || 0);
    const sum = inputs.reduce((a, b) => a + b, 0);

    switch (this.selectedContract) {
      case 'noTricks': return sum === 13;
      case 'noHearts': return sum === 13;
      case 'noBoys': return sum === 8;
      case 'noQueens': return sum === 4;
      case 'noKingOfHearts': return sum === 1;
      case 'noLastTwo': return sum === 2;
      case 'trump': return sum === 13;
    }
  }

  onSubmitRound() {
    if (!this.isInputValid()) return;

    const roundScores = this.calculateCalculatedScores();
    this.gameService.submitRound(Number(this.selectedDeclarerId), this.selectedContract, roundScores);

    this.playerInputs = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    const nextId = (Number(this.selectedDeclarerId) % 4) + 1;
    this.selectedDeclarerId = nextId;
    this.onDeclarerChange();
  }

  getDeclarerName(id: number): string {
    return this.gameService.players().find(p => p.id === id)?.name || '';
  }

  startNewGame() {
    this.gameService.resetGame();
    this.router.navigate(['/setup']);
  }
}