# AI Coding Guidelines

You are extending an EXISTING website (an Online Judge platform for programmers), not building a new project. Preserve its architecture, design language, and conventions.

## 1. Priorities (in order)
1. Consistency with the existing codebase
2. Preserve existing functionality
3. Reuse existing components, styles, utilities
4. Readable, maintainable code
5. New implementations only when necessary

Do not rewrite, restructure, rename, or replace existing code unless required. Make the smallest change that accomplishes the task. Do not touch unrelated code.

## 2. Workflow
1. **Inspect**: project structure, relevant HTML/CSS/JS, shared components, theme variables, dependencies. Never assume a component, utility, or style doesn't exist without checking.
2. **Plan**: which files change, what can be reused, whether new files are needed, whether other pages are affected.
3. **Implement**: follow conventions, reuse code, stay minimal.
4. **Verify**: interactions work, no JS errors, no missing assets or bad paths, light/dark themes, responsive behavior, no regressions on other pages (see Section 7).
5. **Report** concisely: what was implemented; files modified; new files created and why; key architectural decisions; remaining issues or limitations.

## 3. Architecture & File Organization
- Follow the existing structure and naming conventions. No new files or directories without a clear justification.
- Shared components stay shared; never duplicate an implementation. Before modifying one, consider its impact on every page that uses it.
- Global CSS/JS: anything reused across pages (layout, typography, buttons, forms, nav, theme management, shared handlers).
- Page-specific CSS/JS: logic or styles used only by that page.
- Create a new CSS/JS file only if the page has genuinely unique needs the existing files can't reasonably hold. Never create one just to organize a few rules.

## 4. Code Standards

### HTML
- Semantic elements, logical structure, descriptive IDs/classes.
- Preserve accessibility attributes.
- No needless wrappers; no inline CSS/JS unless the architecture requires it.

### JavaScript
- Readable code with meaningful names and simple logic.
- No unnecessary globals or abstractions.
- No duplicated functions or event handlers.
- Organized DOM code; handle errors and unexpected states.

### CSS
- Multi-line only: one property per line, consistent indentation, blank lines between selectors. Never compress rules into single lines.
- Group selectors by component. Avoid deep nesting, high specificity, and `!important`.
- Follow the existing class naming; use descriptive, component-oriented names. Reuse existing classes.

## 5. Theme System
- Use existing CSS variables from `:root` and the dark theme. Never hardcode colors, backgrounds, borders, or shadows when a variable exists.
- Add a new variable only for a clear, reusable need.
- Never create a separate theme system. All new components must work in both light and dark themes.

## 6. Design Language
Modern Neo-Brutalist / Technical Editorial: professional, precise, developer-oriented. Apply restrained.
- Do: strong hierarchy, structured layouts, clear typography, intentional spacing, distinctive borders and geometric elements, consistent proportions, a restrained palette, purposeful interactions.
- Avoid: decorative clutter, unnecessary gradients, generic SaaS look, heavy rounded corners, needless animation, inconsistent shadows/borders.

## 7. Functional Integrity
Implementations must work, not just look right. Never fake functionality. If something needs a backend that isn't available, say so and clearly separate working frontend behavior from what still needs integration.

## 8. Tie-breakers
Inspect before implementing. Reuse before creating. Consistency over personal preference. Readability over brevity. Functionality over appearance. Minimal change over refactoring.