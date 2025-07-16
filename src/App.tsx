import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AddNewRecipe from "./components/AddNewRecipe";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

import { Toaster, toast } from "sonner";

import type { Recipe } from "./lib/generateRecipeJSON";
import { Input } from "./components/ui/input";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);

  useEffect(() => {
    const dbRequest = indexedDB.open("recetasDB", 1);

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
      if (!db.objectStoreNames.contains("recetas")) return;
      const transaction = db.transaction("recetas", "readonly");
      const store = transaction.objectStore("recetas");
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        setRecipes(getAllRequest.result);
      };
    };
  }, [showForm]);

  const recipeDetail = recipes.find((r) => r.id === selectedRecipe);

  const handleDeleteRecipe = (id: number) => {
    const dbRequest = indexedDB.open("recetasDB", 1);
    dbRequest.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest | null;
      if (!target) return;
      const db = target.result;
      if (!db.objectStoreNames.contains("recetas")) return;
      const transaction = db.transaction("recetas", "readwrite");
      const store = transaction.objectStore("recetas");
      store.delete(id);
      transaction.oncomplete = () => {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      };
    };
  };

  const exportRecipe = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    if (recipes.length === 0) {
      toast.error("No hay recetas para exportar.");
      return;
    }
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recetas.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRecipes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error("Formato inválido");
      const dbRequest = indexedDB.open("recetasDB", 1);
      dbRequest.onsuccess = (event) => {
        const target = event.target as IDBOpenDBRequest | null;
        if (!target) return;
        const db = target.result;
        if (!db.objectStoreNames.contains("recetas")) return;
        const transaction = db.transaction("recetas", "readwrite");
        const store = transaction.objectStore("recetas");
        imported.forEach((receta: any) => {
          const { id, ...rest } = receta;
          store.add(rest);
        });
        transaction.oncomplete = () => {
          setShowForm((prev) => !prev);
          e.target.value = "";
        };
      };
    } catch {
      toast.error("Error al importar recetas. El archivo no es válido.");
    }
  };

  return (
    <>
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h1 className="text-3xl font-bold text-center">Gestor de Recetas</h1>
          <Sheet open={showForm} onOpenChange={setShowForm}>
            <SheetTrigger asChild>
              <Button className="px-6 py-3">Añadir Nueva Receta</Button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-lg w-full">
              <AddNewRecipe onClose={() => setShowForm(false)} />
            </SheetContent>
          </Sheet>
          <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="cursor-pointer hover:shadow-lg transition relative"
                onClick={() => setSelectedRecipe(recipe.id)}
              >
                <CardHeader>
                  <CardTitle>{recipe.title}</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRecipe(recipe.id);
                    }}
                  >
                    Borrar
                  </Button>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-muted-foreground">
                    {recipe.ingredients.length} ingredientes
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Sheet
            open={selectedRecipe !== null}
            onOpenChange={() => setSelectedRecipe(null)}
          >
            <SheetContent side="right" className="max-w-lg w-full">
              {recipeDetail && (
                <div className="p-2">
                  <h2 className="text-2xl font-bold mb-4">
                    {recipeDetail.title}
                  </h2>
                  <h3 className="text-2xl font-bold mb-4">
                    {recipeDetail.description}
                  </h3>
                  <ul className="list-disc pl-4">
                    {recipeDetail.ingredients.map((ing, idx) => (
                      <li key={idx}>
                        {ing.name}
                        {ing.specification ? ` (${ing.specification}` : ""}
                        {ing.unit
                          ? ` ${ing.unit})`
                          : ing.specification
                          ? ")"
                          : ""}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    onClick={() => setSelectedRecipe(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <Button className="mr-2" onClick={exportRecipe}>
            Exportar recetas
          </Button>

          <Input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            id="import-recipes"
            onChange={importRecipes}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("import-recipes")?.click()}
          >
            Importar recetas
          </Button>
        </div>
      </div>
      <Toaster position="top-center" />
    </>
  );
}

export default App;
