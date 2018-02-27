const REQ_LIMIT = 20;
const API_URL =
  "https://addons.mozilla.org/api/v3/addons/search/?sort=created&page_size=100";
const UPDATE_RATE = 10 * 60 * 1000; // 10 minutes (in ms)
const SETTINGS_STORAGE = "la-settings";

let latestAddons = [];

/**
 * Updates the list of latest add-ons.
 */
function updateAddons() {
  browser.storage.local.get(SETTINGS_STORAGE, results => {
    let type = "all";

    if (results[SETTINGS_STORAGE] && results[SETTINGS_STORAGE]["type"]) {
      type = results[SETTINGS_STORAGE]["type"];
    }

    getAddons(type);
  });
}

/**
 * Gets the add-ons list using the AMO API.
 */
function getAddons(aType) {
  let xhr = new XMLHttpRequest();
  let url = API_URL;

  if ("extensions" == aType) {
    url += "&type=extension";
  } else if ("themes" == aType) {
    url += "&type=persona";
  }

  //console.log("Updating add-ons");

  xhr.addEventListener("load", function() {
    let data = JSON.parse(xhr.responseText);

    if (data && data.results && (0 < data.results.length)) {
      latestAddons = [];
      let addonData = {};

      for (let addon of data.results) {
        try {
          addonData =
            { "id": addon.id,
              "url": addon.url,
              "name": addon.name[addon.default_locale],
              "lastUpdated": addon.last_updated,
              "iconURL": addon.icon_url,
              "summary": "" };

          if (("persona" != addon.type) && addon.summary &&
              addon.summary[addon.default_locale]) {
            addonData["summary"] = addon.summary[addon.default_locale];
          } else if (addon.description &&
            addon.description[addon.default_locale]){
            addonData["summary"] = addon.description[addon.default_locale];
          }

          latestAddons.push(addonData);
        } catch (e) {
          console.log(`Invalid post entry:\n${e}`);
        }
      }

      updateSidebar();
    } else {
      console.log(`Invalid return data:\n${data}`);
    }
  });

  xhr.open("GET", url);
  xhr.send();

  window.setTimeout(function() { updateAddons(); }, UPDATE_RATE);
}

/**
 * Updates the contents of the sidebar with the available list of add-ons.
 */
function updateSidebar() {
  let loadingMessage = document.getElementById("loading-message");
  let addonList = document.getElementById("addon-list");
  let tempList = document.createDocumentFragment();

  clearSidebar();

  for (let addon of latestAddons) {
    try {
      tempList.appendChild(createAddonNode(addon));
    } catch (e) {
      console.log(
        `Error appending add-on node:\n${e}\nData:\n${JSON.stringify(addon)}`);
    }
  }

  addonList.appendChild(tempList);
  loadingMessage.hidden = true;
}

/**
 * Clears all add-ons from the sidebar and shows a loading message.
 */
function clearSidebar() {
  let loadingMessage = document.getElementById("loading-message");
  let addonList = document.getElementById("addon-list");

  while (addonList.firstChild) {
    addonList.removeChild(addonList.firstChild);
  }

  loadingMessage.hidden = false;
}

/**
 * Creates a DOM node with the metadata of the provided add-on.
 * @param addon an object with the add-on metadata.
 * @return the generated DOM node with the metadata for the add-on.
 */
function createAddonNode(addon) {
  let container = document.createElement("div");
  let imageContainer = document.createElement("div");
  let nameContainer = document.createElement("div");
  let metadataContainer = document.createElement("div");
  let image = document.createElement("img");
  let nameNode = document.createElement("a");
  let summaryNode = document.createElement("p");
  let lastUpdatedNode = document.createElement("p");
  let summaryText = formatSummary(addon.summary);
  let lastUpdatedText = "Last updated: " + formatDate(addon.lastUpdated);

  container.setAttribute("class", "addon-container");

  imageContainer.setAttribute("class", "image-container");
  image.setAttribute("src", addon.iconURL);

  imageContainer.appendChild(image);
  container.appendChild(imageContainer);

  nameContainer.setAttribute("class", "name-container");
  nameNode.setAttribute("class", "addon-name");
  nameNode.setAttribute("href", addon.url);

  nameContainer.appendChild(nameNode);
  container.appendChild(nameContainer);

  nameNode.appendChild(document.createTextNode(addon.name));
  summaryNode.setAttribute("class", "addon-summary");
  summaryNode.appendChild(document.createTextNode(summaryText));
  lastUpdatedNode.setAttribute("class", "last-updated");

  lastUpdatedNode.appendChild(document.createTextNode(lastUpdatedText));
  metadataContainer.setAttribute("class", "metadata-container");
  metadataContainer.appendChild(summaryNode);
  metadataContainer.appendChild(lastUpdatedNode);
  container.appendChild(metadataContainer);

  return container;
}

/**
 * Strips some HTML fomatting from summaries.
 * @param text the text to format.
 * @return the formatted text.
 */
function formatSummary(text) {
  return text.replace(/\<[^<]+\>/g, "");
}

/**
 * Formats a date string for display.
 * @param text the text to format.
 * @return the formatted date.
 */
function formatDate(text) {
  return text.split("T")[0];
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ("update-type-filter" == request) {
    updateAddons();
  }
});

updateAddons();
