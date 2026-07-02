# MR Stats

## Project Goal

MR Stats is a desktop fitness application built with Electron.

The project must remain lightweight, fast and modular.

Use only:

- HTML
- CSS
- Modern JavaScript (ES Modules)
- Electron

No React.
No Vue.
No Angular.
No TypeScript.

---

# Current Modules

## Home

Dashboard with:

- Today's checklist
- Quick weight entry
- Daily notes

---

## Recipes

This is the highest priority module.

Features:

- list of recipes (names only)
- search
- categories
- favourites
- recipe details
- ingredients
- nutrition values
- cooking mode
- step-by-step instructions
- timer on every step
- completed steps
- automatic progress saving
- recipe import/export

No recipe photos.

---

## Training

Features:

- workout plans
- exercises
- sets
- reps
- weight
- rest timer
- workout history
- progress

---

## Weight

Features:

- daily weight
- history
- graphs
- BMI
- body measurements
- goals

---

## Calendar

Features:

- training schedule
- meal reminders
- notifications
- planning

---

## Shopping

Features:

- shopping lists
- recipe ingredients
- categories
- completed items

---

## Storage

Features:

- products
- expiration dates
- quantity
- inventory

---

## Settings

Features:

- theme
- backup
- import
- export
- future cloud sync

---

# Future Features

- user accounts
- cloud synchronization
- multiple devices
- statistics
- advanced graphs
- achievements
- goals
- backups

---

# Design

Dark theme.

Modern.

Rounded interface.

Desktop first.

No redesign unless requested.

---

# Data

Current storage:

localStorage

Future:

SQLite + Cloud Sync

Never remove existing user data.

Never change storage keys without permission.

---

# Code Rules

Every feature must be a separate module.

Never create giant files.

Always keep the project easy to maintain.

Prefer reusable components.

Keep UI and logic separated whenever possible.

Always preserve existing functionality.