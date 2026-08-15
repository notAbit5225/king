import { Injectable, signal, computed } from '@angular/core';
import { Player, RoundEntry, NegativeContract, ContractType } from '../models/king.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  players = signal<Player[]>([]);
  rounds = signal<RoundEntry[]>([]);
  maxPositivesPerPlayer = signal<number>(2);

  constructor() {
    const savedPlayers = localStorage.getItem('king_players');
    const savedRounds = localStorage.getItem('king_rounds');
    const savedMaxPos = localStorage.getItem('king_max_positives');

    if (savedPlayers) this.players.set(JSON.parse(savedPlayers));
    if (savedRounds) this.rounds.set(JSON.parse(savedRounds));
    if (savedMaxPos) this.maxPositivesPerPlayer.set(JSON.parse(savedMaxPos));
  }

  globalContractCounts = computed(() => {
    const counts: Record<string, number> = {};
    this.rounds().forEach(r => {
      counts[r.contract] = (counts[r.contract] || 0) + 1;
    });
    return counts;
  });

  isGameComplete = computed(() => {
    const p = this.players();
    if (p.length === 0) return false;
    
    const targetPositives = this.maxPositivesPerPlayer();
    const allNegativesDone = p.every(player => 
      Object.values(player.usedNegativeContracts).every(val => val === true)
    );
    const allPositivesDone = p.every(player => player.usedPositiveContractsCount >= targetPositives);
    
    return allNegativesDone && allPositivesDone;
  });

  leaderboard = computed(() => {
    return [...this.players()].sort((a, b) => b.totalScore - a.totalScore);
  });

  initGame(playerNames: string[], maxPositives: number = 2) {
    this.maxPositivesPerPlayer.set(maxPositives);

    const initialPlayers: Player[] = playerNames.map((name, index) => ({
      id: index + 1,
      name: name.trim() || `Player ${index + 1}`,
      totalScore: 0,
      usedNegativeContracts: {
        noTricks: false,
        noHearts: false,
        noBoys: false,
        noQueens: false,
        noKingOfHearts: false,
        noLastTwo: false
      },
      usedPositiveContractsCount: 0
    }));

    this.players.set(initialPlayers);
    this.rounds.set([]);
    this.saveState();
  }

  submitRound(declarerId: number, contract: ContractType, roundScores: Record<number, number>) {
    this.players.update(currentPlayers => 
      currentPlayers.map(player => {
        const addedScore = roundScores[player.id] || 0;
        const isDeclarer = player.id === declarerId;

        let updatedNegatives = { ...player.usedNegativeContracts };
        let updatedPositives = player.usedPositiveContractsCount;

        if (isDeclarer) {
          if (contract === 'trump') {
            updatedPositives += 1;
          } else {
            updatedNegatives[contract as NegativeContract] = true;
          }
        }

        return {
          ...player,
          totalScore: player.totalScore + addedScore,
          usedNegativeContracts: updatedNegatives,
          usedPositiveContractsCount: updatedPositives
        };
      })
    );

    this.rounds.update(history => [
      ...history,
      {
        roundNumber: history.length + 1,
        declarerId,
        contract,
        scores: roundScores
      }
    ]);

    this.saveState();
  }

  private saveState() {
    localStorage.setItem('king_players', JSON.stringify(this.players()));
    localStorage.setItem('king_rounds', JSON.stringify(this.rounds()));
    localStorage.setItem('king_max_positives', JSON.stringify(this.maxPositivesPerPlayer()));
  }

  resetGame() {
    localStorage.removeItem('king_players');
    localStorage.removeItem('king_rounds');
    localStorage.removeItem('king_max_positives');
    this.players.set([]);
    this.rounds.set([]);
  }
}