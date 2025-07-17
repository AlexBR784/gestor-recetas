import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AddNewRecipe from "./components/AddNewRecipe";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Toaster, toast } from "sonner";

import type { Recipe } from "./lib/generateRecipeJSON";
import { Input } from "./components/ui/input";

import { Pencil, Trash } from "lucide-react";

function useDynamicTitleLength() {
  const [maxLength, setMaxLength] = useState(30);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 500) setMaxLength(12);
      else if (window.innerWidth < 900) setMaxLength(20);
      else setMaxLength(30);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return maxLength;
}

function App() {
  const [showForm, setShowForm] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);

  const maxTitleLength = useDynamicTitleLength();

  useEffect(() => {
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
  const confirmAndDeleteRecipe = (id: number) => {
    toast(
      () => (
        <div>
          <span>¿Seguro que quieres borrar esta receta?</span>
          <div className="flex gap-2 mt-2">
            <Button
              variant="destructive"
              className="cursor-pointer"
              size="sm"
              onClick={() => {
                toast.dismiss();
                const dbRequest = indexedDB.open("recetasDB", 2);
                dbRequest.onupgradeneeded = (event) => {
                  const target = event.target as IDBOpenDBRequest | null;
                  if (!target) return;
                  const db = target.result;
                  if (!db.objectStoreNames.contains("recetas")) {
                    db.createObjectStore("recetas", {
                      keyPath: "id",
                      autoIncrement: true,
                    });
                  }
                };
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
                    toast.success("Receta borrada");
                  };
                };
              }}
            >
              Sí, borrar
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              size="sm"
              onClick={() => toast.dismiss()}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
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
      const dbRequest = indexedDB.open("recetasDB", 2);

      dbRequest.onupgradeneeded = (event) => {
        const target = event.target as IDBOpenDBRequest | null;
        if (!target) return;
        const db = target.result;
        if (!db.objectStoreNames.contains("recetas")) {
          db.createObjectStore("recetas", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      dbRequest.onsuccess = (event) => {
        const target = event.target as IDBOpenDBRequest | null;
        if (!target) return;
        const db = target.result;
        if (!db.objectStoreNames.contains("recetas")) return;
        const transaction = db.transaction("recetas", "readwrite");
        const store = transaction.objectStore("recetas");
        imported.forEach((receta: Recipe) => {
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

  const handleEditRecipe = (recipe: Recipe) => {
    setEditRecipe(recipe);
    setShowForm(true);
  };

  const handleSaveEditedRecipe = (updatedRecipe: Recipe) => {
    const dbRequest = indexedDB.open("recetasDB", 2);
    dbRequest.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest | null;
      if (!target) return;
      const db = target.result;
      if (!db.objectStoreNames.contains("recetas")) return;
      const transaction = db.transaction("recetas", "readwrite");
      const store = transaction.objectStore("recetas");
      store.put(updatedRecipe);
      transaction.oncomplete = () => {
        setShowForm(false);
        setEditRecipe(null);
        toast.success("Receta actualizada");
        // Actualiza el estado local
        setRecipes((prev) =>
          prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
      };
    };
  };

  return (
    <>
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h1 className="text-3xl font-bold text-center">Gestor de Recetas</h1>
          <Sheet open={showForm} onOpenChange={setShowForm}>
            <SheetTrigger asChild>
              <Button
                className="px-6 py-3 cursor-pointer"
                onClick={() => {
                  setEditRecipe(null);
                  setShowForm(true);
                }}
              >
                Añadir Nueva Receta
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-lg w-full">
              <AddNewRecipe
                onClose={() => {
                  setShowForm(false);
                  setEditRecipe(null);
                }}
                initialRecipe={editRecipe}
                onSaveEdit={handleSaveEditedRecipe}
              />
            </SheetContent>
          </Sheet>
          <div
            className="w-full mt-8 p-2 flex justify-center"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            <div className="w-full max-w-4xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>

                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="cursor-pointer font-semibold truncate max-w-[100px] overflow-hidden">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="text-xs cursor-pointer"
                              onClick={() => setSelectedRecipe(recipe.id)}
                            >
                              {recipe.title.length > maxTitleLength
                                ? recipe.title.slice(0, maxTitleLength) + "..."
                                : recipe.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{recipe.title}</TooltipContent>
                        </Tooltip>
                        <Badge variant="destructive" className="ml-2">
                          {recipe.ingredients.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="default"
                          size="sm"
                          className="mr-2 cursor-pointer"
                          onClick={() => handleEditRecipe(recipe)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          className="cursor-pointer"
                          size="sm"
                          onClick={() => confirmAndDeleteRecipe(recipe.id)}
                        >
                          <Trash />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                    {recipeDetail.ingredients
                      .filter((ing) => ing.name && ing.name.trim() !== "")
                      .map((ing, idx) => (
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
                    className="mt-6 w-full cursor-pointer"
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
          <Button className="mr-2 cursor-pointer" onClick={exportRecipe}>
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
            className="cursor-pointer"
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
