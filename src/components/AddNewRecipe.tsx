import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { generateRecipeJSON } from "@/lib/generateRecipeJSON";
import type { Ingredient, Recipe } from "@/lib/generateRecipeJSON";
import { Textarea } from "./ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AddNewRecipeProps {
  onClose: () => void;
  initialRecipe?: Recipe | null;
  onSaveEdit?: (recipe: Recipe) => void;
}

export default function AddNewRecipe({
  onClose,
  initialRecipe,
  onSaveEdit,
}: AddNewRecipeProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialRecipe?.ingredients ?? [{ name: "", specification: 1, unit: "uds" }]
  );
  const [recipeName, setRecipeName] = useState(initialRecipe?.title ?? "");
  const [recipeDescription, setRecipeDescription] = useState(
    initialRecipe?.description ?? ""
  );

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", specification: 1, unit: "uds" },
    ]);
  };

  const onSave = () => {
    const filteredIngredients = ingredients.filter(
      (ing) => ing.name && ing.name.trim() !== ""
    );

    if (onSaveEdit && initialRecipe) {
      // Editar receta
      const updatedRecipe: Recipe = {
        ...initialRecipe,
        title: recipeName,
        ingredients: filteredIngredients,
        description: recipeDescription,
      };
      onSaveEdit(updatedRecipe);
      return;
    }

    if (filteredIngredients.length === 0) {
      toast.error("Por favor, añade al menos un ingrediente válido.");
      return;
    }

    const dbRequest = indexedDB.open("recetasDB", 2);

    dbRequest.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest | null;
      if (!target) return;
      const db = target.result;
      if (!db.objectStoreNames.contains("recetas")) {
        db.createObjectStore("recetas", { keyPath: "id", autoIncrement: true });
      }
    };

    dbRequest.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest | null;
      if (!target) return;
      const db = target.result;
      if (!db.objectStoreNames.contains("recetas")) {
        console.error("El object store 'recetas' no existe.");
        return;
      }
      const transaction = db.transaction("recetas", "readwrite");
      const store = transaction.objectStore("recetas");
      store.add({
        title: recipeName,
        ingredients: filteredIngredients,
        description: recipeDescription,
      });
      onClose(); // Cierra el Sheet al guardar
    };

    dbRequest.onerror = (event) => {
      console.error("Error al abrir la base de datos:", event);
    };
  };

  return (
    <SheetContent side="right" className="max-w-lg w-full flex flex-col h-full">
      <SheetHeader>
        <SheetTitle>Añadir nueva receta</SheetTitle>
        <SheetDescription>
          Añade los ingredientes que necesites para tu receta
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto p-2">
        <form>
          <Input
            type="text"
            placeholder="Nombre de la receta"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            className="mb-4"
          />
          <Textarea
            placeholder="Descripción de la receta"
            value={recipeDescription}
            onChange={(e) => setRecipeDescription(e.target.value)}
            className="mb-4"
          />

          <Separator className="my-4" />

          {ingredients.map((ingredient, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <Input
                id={`ingredient-name-${idx}`}
                type="text"
                placeholder={`Ingrediente ${idx + 1}`}
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(idx, "name", e.target.value)
                }
                className="flex-1"
              />
              <Input
                id={`ingredient-spec-${idx}`}
                type="number"
                min={1}
                placeholder="Cantidad"
                value={ingredient.specification ?? ""}
                onChange={(e) =>
                  handleIngredientChange(idx, "specification", e.target.value)
                }
                className="w-24"
              />
              <select
                id={`ingredient-unit-${idx}`}
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(idx, "unit", e.target.value)
                }
                className="border rounded px-2 py-1"
              >
                <option value="uds">uds</option>
                <option value="unidad">unidad</option>
                <option value="gr">gr</option>
                <option value="kg">kg</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="cucharada">cucharada</option>
                <option value="cucharadita">cucharadita</option>
                <option value="taza">taza</option>
                <option value="pizca">pizca</option>
                <option value="paquete">paquete</option>
                <option value="bote">bote</option>
              </select>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddIngredient}
            className="w-full mb-2"
          >
            + Añadir otro ingrediente
          </Button>
        </form>
      </div>
      <SheetFooter className="bg-white pt-2 pb-4 sticky bottom-0">
        <Button onClick={onSave} className="w-full">
          {initialRecipe ? "Guardar cambios" : "Añadir receta"}
        </Button>
        <SheetClose asChild>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}
