const SETTINGS_STORAGE = "la-settings";
let settings = {};

/**
 * Loads settings from storage.
 */
function loadSettings() {
  browser.storage.local.get(SETTINGS_STORAGE, results => {
    //console.log("Loading settings.");
    settings =
      (results[SETTINGS_STORAGE] ? results[SETTINGS_STORAGE] :
        { "type": "all" });
    setTypeFilter();
  });
}

/**
 * Sets the type filter radio buttons depending on the stored value.
 */
function setTypeFilter() {
  //console.log("Type: " + settings["type"]);

  if ("all" == settings["type"]) {
    document.getElementById("filter-all").checked = true;
  } else if ("extensions" == settings["type"]) {
    document.getElementById("filter-extensions").checked = true;
  } else if ("themes" == settings["type"]) {
    document.getElementById("filter-themes").checked = true;
  }
}

/**
 * Updates the filter setting if the user changes it.
 */
function updateTypeFilter() {
  if (document.getElementById("filter-all").checked) {
    settings["type"] = "all";
  } else if  (document.getElementById("filter-extensions").checked) {
    settings["type"] = "extensions";
  } else {
    settings["type"] = "themes";
  }
  //console.log("Updated type: " + settings["type"]);
  storeSettings();
  browser.runtime.sendMessage("update-type-filter");
}

/**
 * Stores settings.
 */
function storeSettings() {
  let toStore = {};

  toStore[SETTINGS_STORAGE] = settings;
  browser.storage.local.set(toStore);
}

window.addEventListener("load", function() {
  document.getElementById("type-filter-radio").addEventListener(
    "click", function() { updateTypeFilter(); });
  loadSettings();
});
