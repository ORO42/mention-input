////////////////////////////////////////
// initialize consts
////////////////////////////////////////

// get 'mentionarea' element
const mentionArea = document.getElementById("mentionarea");

var relativeX = 0;
var relativeY = 0;

// menu options
var menuOptions = [
  { title: "abc", id: 1 },
  { title: "123", id: 2 },
];

////////////////////////////////////////
// initial mutations
////////////////////////////////////////

hideMenu();

////////////////////////////////////////
// custom events
////////////////////////////////////////

function dispatchMenuOpenedEvent(data = {}) {
  const customEvent = new CustomEvent("menuOpened", {
    detail: data,
    bubbles: true,
    cancelable: true,
    composed: false,
  });

  const targetElement = document.getElementById("mentionmenu");

  if (targetElement) {
    targetElement.dispatchEvent(customEvent);
  }
}

function dispatchMenuClosedEvent(data = {}) {
  const customEvent = new CustomEvent("menuClosed", {
    detail: data,
    bubbles: true,
    cancelable: true,
    composed: false,
  });

  const targetElement = document.getElementById("mentionmenu");

  if (targetElement) {
    targetElement.dispatchEvent(customEvent);
  }
}

function dispatchRenderMenuItemEvent(data = {}) {
  const customEvent = new CustomEvent("renderMenuItem", {
    detail: data,
    bubbles: true,
    cancelable: true,
    composed: false,
  });

  const targetElement = document.getElementById("mentionmenu");

  if (targetElement) {
    targetElement.dispatchEvent(customEvent);
  }
}

function dispatchMenuItemSelectedEvent(data = {}) {
  const customEvent = new CustomEvent("menuItemSelected", {
    detail: data,
    bubbles: true,
    cancelable: true,
    composed: false,
  });

  const targetElement = document.getElementById("mentionmenu");

  if (targetElement) {
    targetElement.dispatchEvent(customEvent);
  }
}

////////////////////////////////////////
// add event listeners
////////////////////////////////////////

function onClickOutside(selector, callback) {
  const element = document.querySelector(selector);
  document.addEventListener("click", (e) => {
    if (element && !element.contains(e.target)) callback();
  });
}

mentionArea.addEventListener("input", function (event) {
  handleInput(event.data);
});

////////////////////////////////////////
// logic
////////////////////////////////////////

// comment out if menu should not close upon click outside
onClickOutside("#mentionmenu", () => {
  if (
    document.getElementById("mentionmenu") &&
    document.getElementById("mentionmenu").style.visibility === "visible"
  ) {
    hideMenu();
  }
});

function getCaretPosition() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  // get global position
  const rect = range.getBoundingClientRect();
  const relativeX = rect.x + window.scrollX;
  const relativeY = rect.y + window.scrollY;

  // get the text idx of the caret
  const caretIdx = range.startOffset;

  return { relativeX, relativeY, caretIdx };
}

function filterMenuOptions(menuOptions, searchString) {
  // convert search string to lowercase for case-insensitive matching
  const searchLowerCase = searchString?.toLowerCase();

  // filter options
  const matchingOptions = menuOptions.filter((option) =>
    option.title.toLowerCase().includes(searchLowerCase)
  );

  return matchingOptions;
}

function isOutOfViewport(elem) {
  // get elem bounding
  const bounding = elem.getBoundingClientRect();

  // check where out of viewport
  const out = {};
  out.top = bounding.top < 0;
  out.left = bounding.left < 0;
  out.bottom =
    bounding.bottom >
    (window.innerHeight || document.documentElement.clientHeight);
  out.right =
    bounding.right >
    (window.innerWidth || document.documentElement.clientWidth);
  out.any = out.top || out.left || out.bottom || out.right;
  out.all = out.top && out.left && out.bottom && out.right;

  return out;
}

function repositionMenu(menu, relativeX, relativeY) {
  // set initial pos
  menu.style.left = `${relativeX}px`;
  menu.style.top = `${relativeY + 10}px`;

  // check if out of viewport
  const out = isOutOfViewport(menu);

  // if out of viewport, reposition
  if (out.any) {
    // flip horizontally if out on the right
    if (out.right) {
      menu.style.left = `${relativeX - menu.offsetWidth}px`;
    }
    // flip vertically if out on the bottom
    if (out.bottom) {
      menu.style.top = `${relativeY - menu.offsetHeight - 10}px`;
    }
  }
}

function renderMenuItems(options) {
  const menu = document.getElementById("mentionmenu");
  menu.style.display = "flex";
  setTimeout(() => {
    repositionMenu(menu, relativeX, relativeY);
    menu.style.visibility = "visible";
    dispatchMenuOpenedEvent(); // used to know when to optionally customize list option elements
  }, 10);

  // clear existing mentionmenu content
  menu.innerHTML = "";

  // render only the first 5 matches
  options.slice(0, 5).forEach(function (option) {
    const listItem = document.createElement("button");
    listItem.className = "mention-list-item";
    listItem.textContent = option.title;
    listItem.setAttribute("data-id", option.id);
    listItem.addEventListener("click", (e) => {
      insertMentionElement(option.id, option.title);
      dispatchMenuItemSelectedEvent({ id: option.id, value: option.title });
      hideMenu();
    });
    menu.appendChild(listItem);
    dispatchRenderMenuItemEvent({ id: option.id, textValue: option.title });
  });
}

function insertMentionElement(dataID, text) {
  const selection = document.getSelection();
  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.className = "mention-chip";
  span.setAttribute("data-id", dataID);
  span.textContent = text;
  span.contentEditable = false;

  // get pos after current selection
  const afterSelection = range.cloneRange();
  afterSelection.setStartAfter(range.endContainer, range.endOffset);
  afterSelection.collapse(true);

  // check if parent node is the contenteditable div
  if (range.commonAncestorContainer.parentNode.id === "mentionarea") {
    // remove '#' and preceding characters
    const precedingText = range.startContainer.textContent.substring(
      0,
      range.startOffset
    );
    const newText = precedingText.replace(/#[^#]*$/, "");

    // set new text content for range start container
    range.startContainer.textContent = newText;
    // insert span at position after current selection
    afterSelection.insertNode(span);

    // move cursor to end of newly inserted span
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}

function hideMenu() {
  const menu = document.getElementById("mentionmenu");
  menu.style.visibility = "hidden";
  menu.style.display = "none";
  dispatchMenuClosedEvent();
}

function getTextAfterLastHash(str, startIdx) {
  let lastHashidx = str.lastIndexOf("#", startIdx);
  if (lastHashidx !== -1) {
    return str.substring(lastHashidx + 1, startIdx);
  }
}

function handleInput(text) {
  // update caret pos data
  const caretPosData = getCaretPosition();
  relativeX = caretPosData.relativeX;
  relativeY = caretPosData.relativeY;
  const caretIdx = caretPosData.caretIdx;

  // match menu options
  const searchString = getTextAfterLastHash(mentionArea.innerHTML, caretIdx);
  const matches = filterMenuOptions(menuOptions, searchString);
  if (matches.length > 0) {
    renderMenuItems(matches, searchString);
  } else {
    hideMenu();
  }
}

function getAllMentions() {
  // select all span elements within container
  const spanElements = mentionArea.querySelectorAll("span");
  // create array to store extracted data
  const dataArray = [];
  // iterate over span elements and extract data
  spanElements.forEach((span) => {
    const text = span.innerText;
    const dataId = span.getAttribute("data-id");

    // create object and add it to the array
    const spanData = {
      text: text,
      dataId: dataId,
    };

    dataArray.push(spanData);
  });
  return dataArray;
}

function handlePaste(e) {
  // check if pasted content includes images
  const clipboardData = e.clipboardData || window.clipboardData;
  const types = clipboardData.types || [];
  const hasImage = types.includes("Files") || types.includes("public.file-url");

  if (hasImage) {
    e.preventDefault(); // prevent default paste behavior
    alert("Image paste is disabled.");
  }
}
