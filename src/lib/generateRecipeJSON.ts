export interface Recipe {
  id: number;
  title: string;
  ingredients: Ingredient[];
  description?: string; // Optional description for the recipe
}

export interface Ingredient {
  name: string;
  specification?: number;
  unit?: string; // e.g., "gr", "ml"
}

export function generateRecipeJSON(
  RecipeName: string,
  Ingredients: Ingredient[],
  Description?: string
): Recipe | null {
  const filteredIngredients = (Ingredients || []).filter(
    (ing) => ing.name && ing.name.trim() !== ""
  );

  if (filteredIngredients.length === 0) {
    return null;
  }

  return {
    id: Date.now() + Math.floor(Math.random() * (1000 + Ingredients.length)),
    title: RecipeName,
    ingredients: filteredIngredients,
    description: Description,
  };
}
