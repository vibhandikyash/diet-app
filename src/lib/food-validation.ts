/**
 * Validation helpers for food CRUD operations
 */

export interface FoodInput {
  name: string;
  servingSize: string;
  servingUnit: string;
  brand?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateFoodInput(input: Partial<FoodInput>): ValidationError | null {
  // Validate required fields
  if (!input.name || input.name.trim().length === 0) {
    return { field: 'name', message: 'Name is required' };
  }

  if (!input.servingSize) {
    return { field: 'servingSize', message: 'Serving size is required' };
  }

  if (!input.servingUnit || input.servingUnit.trim().length === 0) {
    return { field: 'servingUnit', message: 'Serving unit is required' };
  }

  // Validate nutrition fields exist
  if (input.calories === undefined || input.calories === null) {
    return { field: 'calories', message: 'Calories is required' };
  }

  if (input.protein === undefined || input.protein === null) {
    return { field: 'protein', message: 'Protein is required' };
  }

  if (input.carbs === undefined || input.carbs === null) {
    return { field: 'carbs', message: 'Carbs is required' };
  }

  if (input.fat === undefined || input.fat === null) {
    return { field: 'fat', message: 'Fat is required' };
  }

  // Validate positive numbers
  if (input.calories < 0) {
    return { field: 'calories', message: 'Calories must be a positive number' };
  }

  if (input.protein < 0) {
    return { field: 'protein', message: 'Protein must be a positive number' };
  }

  if (input.carbs < 0) {
    return { field: 'carbs', message: 'Carbs must be a positive number' };
  }

  if (input.fat < 0) {
    return { field: 'fat', message: 'Fat must be a positive number' };
  }

  return null;
}
