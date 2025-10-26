export interface BmiCategoryInfo {
    category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
    color: string;
}

export interface AnalysisResult extends BmiCategoryInfo {
    heightCm: number;
    weightKg: number;
    bmi: number;
    accuracy: 'high' | 'medium' | 'low';
}

export interface GeminiAnalysisResponse {
    analysisSuccess: boolean;
    heightCm: number;
    weightKg: number;
    accuracy: 'high' | 'medium' | 'low';
    reason?: 'no_person_detected' | 'child_detected' | 'image_unclear' | string;
}
