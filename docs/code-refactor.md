# Phase 5: Code Refactor

## Original Code (Problematic)

```javascript
if (user.role == 'admin') {
  if (data.length > 0) {
    data.map(item => {
      if (item.status == 'active') {
        // Logic…
      }
    })
  }
}
```

## Problems Identified

1. **Loose equality (`==`)** — should use strict equality (`===`) to avoid type coercion bugs.
2. **Deep nesting** — 3 levels of `if` statements make the code hard to read and maintain.
3. **Misuse of `.map()`** — `.map()` creates a new array, but the return value is discarded. If the intent is side effects, use `.forEach()`. If filtering, use `.filter()`.
4. **Unnecessary length check** — `.filter()` on an empty array simply returns `[]`, no guard needed.
5. **No early return** — the entire function body is wrapped in a role check. An early return flattens the structure.

## Refactored Code

```javascript
function processActiveItems(user, data) {
  if (user.role !== 'admin') return;

  const activeItems = data.filter(item => item.status === 'active');

  activeItems.forEach(item => {
    // Logic…
  });
}
```

## What Changed and Why

| Change | Why |
|---|---|
| `==` → `===` | Prevents type coercion bugs (e.g., `0 == ''` is `true`) |
| Early return for non-admin | Eliminates first nesting level, improves readability |
| Removed `data.length > 0` guard | `.filter()` handles empty arrays gracefully |
| `.map()` → `.filter()` + `.forEach()` | Separates filtering from side effects; `.map()` without using its return value is a code smell |
| Extracted to named function | Makes the code testable and self-documenting |

## Principles Applied

- **Guard clause pattern** — fail fast, reduce indentation
- **Separation of concerns** — filtering vs. processing are distinct operations
- **Semantic correctness** — use the right array method for the job
- **Strict equality** — always use `===` in JavaScript
