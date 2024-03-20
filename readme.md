# About

Provides functionality for targeting a contenteditable element and adding inline "mention" functionality to it. "Mention" functionality in this context refers to the process of inserting elements as references-to-data within an input. This is useful for say a messaging app where the user would like to create a reference to another user or object within their message that is visually distinct and may be interactable.

## Motivation

I had previously implemented existing custom text editor solutions supporting "mention" functionality and found myself only needing a small subset of their features, and or features that didn't exist or were only available via plugins that broke base functionality. Therefore, I implemented a minimal system to achieve mention functionality within contenteditable elements.

## Future

- Plan on migrating to a class-based design so multiple mention inputs can be instantiated with different config options
- Add more helper methods and config options
- AJAX for fetching menu options

# Usage

Note: as of now, this is a minimal implementation.

## General Workflow

1. User types keysymbol (default '#') into the input
2. Build a search string containing characters typed after the previous keysymbol
3. Filter menu option objects matching some keyvalue(s)
4. Render the options menu at the current caret pos
   - If part of the menu will render outside of the viewport, automatically reposition to not clip
5. User selects menu option
6. Instantiate a new span, assign selected option data to it, add click event listener, and replace the keysymbol + search string with the span
7. User clicks an inserted mention
8. Return clicked mention's data

## Menu Options

Each menu option object needs an `id` which gets assigned to the inserted element's `data-id`. This is used to target and attach event listeners to the menu option and inserted mention

```js
var menuOptions = [
  { title: "abc", id: 1 },
  { title: "123", id: 2 },
];
```
