# MR Stats Development Rules

This is an Electron desktop app.

Use only plain HTML, CSS and modern JavaScript.

Do not use React, Vue, Angular, Svelte or TypeScript.

Keep code modular.

Do not put all logic into index.html.

Use this structure:

src/pages
src/components
src/styles
src/storage
src/utils
src/recipes
src/training
src/weight
src/calendar
src/shopping
src/settings

Dark theme only.

Do not redesign existing UI unless requested.

Use localStorage for now.

Never delete user data.

Never change storage keys without permission.

Recipes must have:
- list of dish names
- recipe details after clicking
- step-by-step cooking mode
- timers
- no photos

Preserve existing functionality.