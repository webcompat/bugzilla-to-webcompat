"use strict";

const WEBCOMPAT_ENDPOINT = "https://webcompat.com/issues/new";
const BUGZILLA_ORIGIN = window.location.origin;
const FALLBACK_MESSAGE = `More information is available on ${window.location}`;

const REQUIRED = {
  op_sys: "OS (Categories > Platform > OS)",
  url: "URL (References > URL)",
  version: "Browser version (Categories > Version)"
};

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
    `${BUGZILLA_ORIGIN}/rest/bug/${bugId}?include_fields=url,op_sys,version,comments`
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

const sendToWebcompat = async bug => {
  const browser = await utils.getBrowser(bug.version, bug.op_sys);
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

  const form = convertToFormData(data);

  return await fetch(WEBCOMPAT_ENDPOINT, {
    method: "POST",
    body: form
  });
};

const onMoveButtonClick = async () => {
  const bugId = getBugId();
  if (!bugId)
    openDropDown(
      "A valid bug ID could not be found. Please check you're actually viewing a bug."
    );

  const result = await getBugData(bugId);

  if (result.bugs && result.bugs.length) {
    const required = getRequired(result.bugs[0]);
    if (required.length) {
      openDropDown("Please fill in the following:", required);
      return;
    }

    const response = await sendToWebcompat(result.bugs[0]);
  }
};

const buildButton = () => {
  const moveButton = document.createElement("button");
  moveButton.classList.add("secondary");
  moveButton.type = "button";
  moveButton.title = "Import bug to webcompat.com and resolve issue as Moved";
  moveButton.innerText = "Move to webcompat.com";

  return moveButton;
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
  const moveButton = buildButton();
  const dropDown = buildDropDown();
  const wrapper = buildWrapper();

  wrapper.appendChild(moveButton);
  wrapper.appendChild(dropDown);

  parentContainer.insertAdjacentElement("afterbegin", wrapper);
  moveButton.addEventListener("click", onMoveButtonClick);
};

const editButton = document.getElementById("mode-btn");
if (editButton) addMoveButtonUI();
