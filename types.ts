export interface OptionItem {
  key: 'A' | 'B' | 'C' | 'D';
  textEs: string;
  textAm: string;
}

export interface Question {
  id: number;
  part: 1 | 2 | 3 | 4;
  partTitleEs: string;
  partTitleAm: string;
  questionEs: string;
  questionAm: string;
  options: OptionItem[];
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  explanationEs: string;
  explanationAm: string;
}

export interface WheelSector {
  id: number;
  labelEs: string;
  labelAm: string;
  type: 'points' | 'plus' | 'prize' | 'double' | 'bankrupt' | 'chance';
  value: number;
  color: string;
  textColor: string;
}

export interface ConversationPrompt {
  id: number;
  promptEs: string;
  promptAm: string;
  helpfulStartersEs: string[];
  helpfulStartersAm: string[];
  explanation: string;
}
