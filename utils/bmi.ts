
import type { BmiCategoryInfo } from '../types';

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    return 0;
  }
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBmiCategory(bmi: number): BmiCategoryInfo {
  if (bmi < 18.5) {
    return { category: 'Underweight', color: '#3b82f6' }; // Blue
  }
  if (bmi >= 18.5 && bmi < 25) {
    return { category: 'Normal weight', color: '#22c55e' }; // Green
  }
  if (bmi >= 25 && bmi < 30) {
    return { category: 'Overweight', color: '#f97316' }; // Orange
  }
  return { category: 'Obese', color: '#ef4444' }; // Red
}
