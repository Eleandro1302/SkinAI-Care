export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface SkincareStep {
  step: string;
  productType: string;
  description: string;
}

export interface SkincareRoutine {
  skinType: string;
  morning: SkincareStep[];
  evening: SkincareStep[];
  weekly: SkincareStep[];
}

export interface AnalysisResult {
  id: string;
  date: string;
  imageUrl: string;
  riskLevel: RiskLevel;
  conditions: string[];
  analysis: {
    asymmetry: string;
    border: string;
    color: string;
    size: string;
    evolution: string;
  };
  recommendations: string[];
  skincareRoutine?: SkincareRoutine;
  requiresSpecialist: boolean;
}
