export interface MatrixState {
  autoAchieve: boolean;
  autoSkill: boolean;
  autoOverclock: boolean;
  autoMining: boolean;
  autoForestry: boolean;
  autoBestiary: boolean;
  targetOverclockLevel: number;
}

export const matrixState: MatrixState = $state({
  autoAchieve: false,
  autoSkill: false,
  autoOverclock: false,
  autoMining: false,
  autoForestry: false,
  autoBestiary: false,
  targetOverclockLevel: 1000
});
