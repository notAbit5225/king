import { Injectable, signal, computed } from '@angular/core';
import { Player, RoundEntry, NegativeContract, ContractType, PlayerCount } from '../models/king.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  theme = signal<'dark' | 'light'>('dark');
  players = signal<Player[]>([]);
  playerCount = signal<PlayerCount>(4);

  getContractValue(contract: ContractType): number {
    const is3P = this.playerCount() === 3;
    switch (contract) {
      case 'noTricks': return is3P ? -15 : -20;
      case 'noHearts': return is3P ? -15 : -20;
      case 'noBoys': return -30;
      case 'noQueens': return -50;
      case 'noKingOfHearts': return -160;
      case 'noLastTwo': return -90;
      case 'trump': return is3P ? 20 : 25;
      default: return 0;
    }
  }


  rounds = signal<RoundEntry[]>([]);
  maxPositivesPerPlayer = signal<number>(2);
  currentDeclarerId = signal<number>(1);

  constructor() {
    const savedTheme = localStorage.getItem('king_theme') as 'dark' | 'light';
    if (savedTheme) {
      this.theme.set(savedTheme);
      this.applyTheme(savedTheme);
    } else {
      this.applyTheme('dark');
    }




  const savedPlayers = localStorage.getItem('king_players');
    const savedRounds = localStorage.getItem('king_rounds');
    const savedMaxPos = localStorage.getItem('king_max_positives');
    const savedDeclarer = localStorage.getItem('king_declarer_id');
    const savedPlayerCount = localStorage.getItem('king_player_count');

    if (savedPlayerCount) this.playerCount.set(JSON.parse(savedPlayerCount) as PlayerCount);

    if (savedPlayers) this.players.set(JSON.parse(savedPlayers));
    if (savedRounds) {
      const roundsData: RoundEntry[] = JSON.parse(savedRounds);
      this.rounds.set(roundsData);
      
      // Auto-calculate who should deal next if saved declarer isn't set
      if (!savedDeclarer && roundsData.length > 0) {
        if (!savedDeclarer && roundsData.length > 0) {
      this.currentDeclarerId.set((roundsData.length % this.playerCount()) + 1);
    }
      }
    }
    if (savedMaxPos) this.maxPositivesPerPlayer.set(JSON.parse(savedMaxPos));
    if (savedDeclarer) this.currentDeclarerId.set(JSON.parse(savedDeclarer));




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

initGame(playerNames: string[], maxPositives: number = 2, count: PlayerCount = 4) {
    this.playerCount.set(count);
    this.maxPositivesPerPlayer.set(maxPositives);

    const initialPlayers: Player[] = playerNames.slice(0, count).map((name, index) => ({
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
    this.currentDeclarerId.set(1);
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

    // Pass turn to next player in clockwork rotation
    const total = this.playerCount();
    const nextDeclarerId = (declarerId % total) + 1;
    this.currentDeclarerId.set(nextDeclarerId);
  

    this.saveState();
  }

  setDeclarerId(id: number) {
    this.currentDeclarerId.set(id);
    this.saveState();
  }

  private saveState() {
    localStorage.setItem('king_players', JSON.stringify(this.players()));
    localStorage.setItem('king_rounds', JSON.stringify(this.rounds()));
    localStorage.setItem('king_max_positives', JSON.stringify(this.maxPositivesPerPlayer()));
    localStorage.setItem('king_declarer_id', JSON.stringify(this.currentDeclarerId()));
    localStorage.setItem('king_player_count', JSON.stringify(this.playerCount()));
  }


toggleTheme() {
    const nextTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(nextTheme);
    localStorage.setItem('king_theme', nextTheme);
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: 'dark' | 'light') {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }


  resetGame() {
    localStorage.removeItem('king_players');
    localStorage.removeItem('king_rounds');
    localStorage.removeItem('king_max_positives');
    localStorage.removeItem('king_declarer_id');
    localStorage.removeItem('king_player_count');
    this.players.set([]);
    this.rounds.set([]);
    this.currentDeclarerId.set(1);
  }
}