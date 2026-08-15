export type NegativeContract = 
  | 'noTricks' 
  | 'noHearts' 
  | 'noBoys' 
  | 'noQueens' 
  | 'noKingOfHearts' 
  | 'noLastTwo';

export type ContractType = NegativeContract | 'trump';

export interface Player {
  id: number;
  name: string;
  totalScore: number;
  usedNegativeContracts: Record<NegativeContract, boolean>;
  usedPositiveContractsCount: number;
}

export interface RoundEntry {
  roundNumber: number;
  declarerId: number;
  contract: ContractType;
  scores: Record<number, number>;
}