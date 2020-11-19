const REQUIRED = {
  op_sys: "OS (Categories > Platform > OS)",
  platform: "Platform (Categories > Platform)",
  url: "URL (References > URL)",
  version: "Browser version (Categories > Version)"
};

const BUGZILLA_ORIGIN = window.location.origin;

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
    `${BUGZILLA_ORIGIN}/rest/bug/${bugId}?include_fields=url,platform,op_sys,version`
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
    }
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
