"use strict";

const WEBCOMPAT_ENDPOINT = "https://webcompat.com/issues/new";
const BUGZILLA_ORIGIN = window.location.origin;
const FALLBACK_MESSAGE = `More information is available on ${window.location}`;
const BUTTON_TEXT = "Move to webcompat.com";

const REQUIRED = {
  op_sys: "OS (Categories > Platform > OS)",
  url: "URL (References > URL)",
  version: "Browser version (Categories > Version)"
};

let moveButton;

const getBugId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
};

const openDropDown = (text, elms) => {
  const dropdown = document.querySelector("#bw-move .dropdown-content");

  if (!dropdown) return;
  if (text) dropdown.innerText = text;
  if (elms && elms.length) elms.forEach(el => dropdown.appendChild(el));

  dropdown.style.display = "block";

  const hideDropDown = function(event) {
    const withinBoundaries = event.composedPath().includes(dropdown);

    if (!withinBoundaries) {
      dropdown.style.display = "none";
      document.removeEventListener("click", hideDropDown);
    }
  };

  setTimeout(() => document.addEventListener("click", hideDropDown), 100);
};

const getBugData = bugId => {
  return fetch(
    `${BUGZILLA_ORIGIN}/rest/bug/${bugId}?include_fields=url,op_sys,version,comments,status`
  )
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      openDropDown(error);
    });
};

const getRequired = bugData => {
  const required = [];

  for (const [key, value] of Object.entries(bugData)) {
    if (key in REQUIRED && (!value || value.toLowerCase() === "unspecified")) {
      const errList = document.createElement("li");
      errList.innerText = REQUIRED[key];
      errList.classList.add("bw-error");
      required.push(errList);
    }
  }

  return required;
};

const convertToFormData = object => {
  return Object.keys(object).reduce((formData, key) => {
    formData.append(key, object[key]);
    return formData;
  }, new FormData());
};

const disableMoveButton = () => {
  moveButton.innerText = "Moving to webcompat.com...";
  moveButton.disabled = true;
};

const enableMoveButton = () => {
  moveButton.innerText = BUTTON_TEXT;
  moveButton.disabled = false;
};

const showError = errorText => {
  enableMoveButton();
  return openDropDown(errorText);
};

const sendToWebcompat = async bug => {
  const browser = await utils
    .getBrowser(bug.version, bug.op_sys)
    .catch(err => new Error(err));

  if (browser instanceof Error) {
    return showError("Something went wrong while retrieving browser version.");
  }

  const os = utils.getOS(bug.op_sys);
  const steps = utils.getSteps(bug.comments, FALLBACK_MESSAGE);

  const data = {
    url: bug.url,
    src: "bugzilla",
    submit_type: "github-proxy-report",
    problem_category: "unknown_bug",
    browser,
    os,
    username: "",
    description: "Moved from bugzilla",
    steps_reproduce: steps
  };

  return await fetch(WEBCOMPAT_ENDPOINT, {
    method: "POST",
    body: convertToFormData(data)
  });
};

const onMoveButtonClick = async () => {
  const bugId = getBugId();
  if (!bugId) {
    return showError(
      "A valid bug ID could not be found. Please check you're actually viewing a bug."
    );
  }

  disableMoveButton();

  const result = await getBugData(bugId).catch(err => new Error(err));

  if (result instanceof Error) {
    return showError(
      "There is an error with retrieving bug data from bugzilla."
    );
  }

  if (result.bugs && result.bugs.length) {
    const bug = result.bugs[0];

    if (bug.status === "RESOLVED") {
      return showError(
        "The bug has already been resolved. Please reopen it and try again."
      );
    }

    const required = getRequired(bug);
    if (required.length) {
      enableMoveButton();
      return openDropDown("Please fill in the following:", required);
    }

    const response = await sendToWebcompat(bug).catch(err => new Error(err));

    if (response instanceof Error) {
      return showError(
        "There is an error with importing the bug to webcompat.com. Please try to create it manually."
      );
    }

    if (response.url) {
      enableMoveButton();
      resolveAsMoved(response.url);
    }
  }
};

const fillSeeAlso = issueLink => {
  document.getElementById("mode-btn").click();
  document.getElementById("see_also-btn").click();
  document.getElementById("see_also").value = issueLink;
};

const resolveAsMoved = issueLink => {
  fillSeeAlso(issueLink);

  [...document.getElementById("resolve-as").children]
    .filter(el => el.textContent.includes("FIXED"))[0]
    .click();

  const resolution = document.getElementById("bottom-resolution");
  resolution.value = "MOVED";
  resolution.dispatchEvent(new Event("change"));
  document.getElementById("bottom-save-btn").click();
};

const buildButton = () => {
  const mb = document.createElement("button");
  mb.classList.add("secondary");
  mb.type = "button";
  mb.title = "Import bug to webcompat.com and resolve issue as Moved";
  mb.innerText = BUTTON_TEXT;
  mb.id = "move-to-webcompat";

  return mb;
};

const buildDropDown = () => {
  const dropDown = document.createElement("ul");
  dropDown.classList.add("dropdown-content", "left", "bw-dropdown");
  dropDown.style.display = "none";

  return dropDown;
};

const buildWrapper = () => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("bw-wrapper");
  wrapper.id = "bw-move";

  return wrapper;
};

const addMoveButtonUI = () => {
  const parentContainer = document.querySelector("#page-toolbar .buttons");
  moveButton = buildButton();
  const dropDown = buildDropDown();
  const wrapper = buildWrapper();

  wrapper.appendChild(moveButton);
  wrapper.appendChild(dropDown);

  parentContainer.insertAdjacentElement("afterbegin", wrapper);
  moveButton.addEventListener("click", onMoveButtonClick);
};

const editButton = document.getElementById("mode-btn");
if (editButton) addMoveButtonUI();
