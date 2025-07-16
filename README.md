# Gestor de Recetas

Aplicación web para gestionar recetas de cocina. Permite crear, visualizar, borrar, exportar e importar recetas usando IndexedDB como almacenamiento local.

## Tecnologías

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Sonner](https://sonner.emilkowal.dev/) (notificaciones)

## Funcionalidades

- Añadir nuevas recetas con ingredientes y descripción.
- Visualizar recetas en tarjetas y detalle.
- Borrar recetas individualmente.
- Exportar todas las recetas a un archivo JSON.
- Importar recetas desde un archivo JSON.
- Theming y componentes UI modernos.

## Scripts

```sh
bun install      # Instala dependencias
bun dev          # Inicia el servidor de desarrollo
bun build        # Compila la aplicación para producción
bun preview      # Sirve la app de producción localmente
bun lint         # Ejecuta ESLint
```

## Estructura de carpetas

```
src/
  App.tsx
  App.css
  index.css
  components/
    AddNewRecipe.tsx
    ui/
      button.tsx
      card.tsx
      input.tsx
      label.tsx
      popover.tsx
      separator.tsx
      sheet.tsx
      sonner.tsx
      table.tsx
      textarea.tsx
  lib/
    generateRecipeJSON.ts
    utils.ts
```
