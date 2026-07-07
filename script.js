/* ==========================================
   DOM ELEMENTS
========================================== */
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const themeBtn = document.getElementById("themeBtn");

const loader = document.getElementById("loader");
const messageBox = document.getElementById("message");

const artworkCard = document.getElementById("artworkCard");

const artworkImage = document.getElementById("artworkImage");
const artworkTitle = document.getElementById("artworkTitle");
const artistName = document.getElementById("artistName");
const artworkDate = document.getElementById("artworkDate");
const artworkMedium = document.getElementById("artworkMedium");
const artworkDepartment = document.getElementById("artworkDepartment");
const artworkCulture = document.getElementById("artworkCulture");
const artworkRepository = document.getElementById("artworkRepository");

const recentSearches = document.getElementById("recentSearches");

const favoriteBtn = document.getElementById("favoriteBtn");
const favoritesContainer = document.getElementById("favoritesContainer");

const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const clearRecentBtn = document.getElementById("clearRecentBtn");
const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");

const backToTop = document.getElementById("backToTop");

/* ==========================================
   API
========================================== */

const SEARCH_API =
    "https://collectionapi.metmuseum.org/public/collection/v1/search";

const OBJECT_API =
    "https://collectionapi.metmuseum.org/public/collection/v1/objects/";

/* ==========================================
   APP STATE
========================================== */

let currentArtwork = null;

let recentList =
    JSON.parse(localStorage.getItem("recentSearches")) || [];

let favorites =
    JSON.parse(localStorage.getItem("favoriteArtworks")) || [];

/* ==========================================
   HELPERS
========================================== */

function sanitizeInput(value) {

    return value.replace(/[<>]/g, "").trim();

}

function showLoader() {

    loader.style.display = "block";

}

function hideLoader() {

    loader.style.display = "none";

}

function showMessage(text) {

    messageBox.style.display = "block";

    messageBox.textContent = text;

}

function hideMessage() {

    messageBox.style.display = "none";

    messageBox.textContent = "";

}

function hideArtwork() {

    artworkCard.style.display = "none";

}

function showArtwork() {

    artworkCard.style.display = "grid";

}

function showToast(text) {

    toastMessage.textContent = text;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

/* ==========================================
   ANALYTICS
========================================== */

function logAnalytics(action) {

    console.log(`[Analytics] ${action}`);

}

/* ==========================================
   SEARCH ARTWORK
========================================== */

async function searchArtwork() {

    const keyword = sanitizeInput(searchInput.value);

    if (!keyword) {

        searchInput.focus();

        showMessage("Please enter an artwork name.");

        hideArtwork();

        return;
    }

    hideMessage();

    showLoader();

    try {

        const response = await fetch(
            `${SEARCH_API}?hasImages=true&q=${encodeURIComponent(keyword)}`
        );

        if (!response.ok) {

            throw new Error("Search request failed.");

        }

        const data = await response.json();

        if (!data.objectIDs || data.objectIDs.length === 0) {

            hideLoader();

            hideArtwork();

            showMessage("No artwork found for your search.");

            return;
        }

        saveRecentSearch(keyword);

        await fetchArtwork(data.objectIDs[0]);

    } catch (error) {

        console.error(error);

        hideLoader();

        hideArtwork();

        showMessage("Unable to connect to the museum collection.");

    }

}

/* ==========================================
   FETCH SINGLE ARTWORK
========================================== */

async function fetchArtwork(id) {

    try {

        const response = await fetch(`${OBJECT_API}${id}`);

        if (!response.ok) {

            throw new Error("Artwork not found.");

        }

        const artwork = await response.json();

        currentArtwork = artwork;

        displayArtwork(artwork);

        logAnalytics("Artwork Loaded");

    }

    catch (error) {

        console.error(error);

        hideArtwork();

        showMessage("Unable to load artwork details.");

    }

    finally {

        hideLoader();

    }

}

/* ==========================================
   RANDOM ARTWORK
========================================== */

async function randomArtwork() {

    hideMessage();

    showLoader();

    let attempts = 0;

    while (attempts < 20) {

        attempts++;

        const randomId =
            Math.floor(Math.random() * 900000) + 1;

        try {

            const response =
                await fetch(`${OBJECT_API}${randomId}`);

            if (!response.ok) {

                continue;

            }

            const artwork = await response.json();

            if (!artwork.primaryImageSmall) {

                continue;

            }

            currentArtwork = artwork;

            displayArtwork(artwork);

            hideLoader();

            logAnalytics("Random Artwork");

            return;

        }

        catch {

            continue;

        }

    }

    hideLoader();

    showMessage("Unable to load a random artwork. Please try again.");

}

/* ==========================================
   FEATURED ARTWORK
========================================== */

async function loadFeaturedArtwork() {

    showLoader();

    await fetchArtwork(436535);

}

/* ==========================================
   DISPLAY ARTWORK
========================================== */

function displayArtwork(artwork) {

    hideMessage();

    showArtwork();

    artworkImage.src =
        artwork.primaryImageSmall ||
        artwork.primaryImage ||
        "https://placehold.co/700x900?text=No+Image";

    artworkImage.alt =
        artwork.title || "Artwork";

    artworkTitle.textContent =
        artwork.title || "Untitled Artwork";

    artistName.textContent =
        artwork.artistDisplayName || "Unknown Artist";

    artworkDate.textContent =
        artwork.objectDate || "Not Available";

    artworkMedium.textContent =
        artwork.medium || "Not Available";

    artworkDepartment.textContent =
        artwork.department || "Not Available";

    artworkCulture.textContent =
        artwork.culture || "Not Available";

    artworkRepository.textContent =
        artwork.repository || "Metropolitan Museum of Art";
    updateFavoriteButton();
}

/* ==========================================
   IMAGE FALLBACK
========================================== */

artworkImage.addEventListener("error", function () {

    artworkImage.src =
        "https://placehold.co/700x900?text=Image+Unavailable";

});

/* ==========================================
   INITIAL FEATURED ARTWORK
========================================== */

window.addEventListener("load", function () {

    loadFeaturedArtwork();

});
/* ==========================================
   RECENT SEARCHES
========================================== */

function saveRecentSearch(keyword) {

    keyword = keyword.trim();

    if (!keyword) return;

    recentList = recentList.filter(item =>
        item.toLowerCase() !== keyword.toLowerCase()
    );

    recentList.unshift(keyword);

    if (recentList.length > 5) {
        recentList.pop();
    }

    localStorage.setItem(
        "recentSearches",
        JSON.stringify(recentList)
    );

    renderRecentSearches();
}

function renderRecentSearches() {

    recentSearches.innerHTML = "";

    if (recentList.length === 0) {

        recentSearches.innerHTML =
            "<p>No recent searches available.</p>";

        return;
    }

    recentList.forEach(keyword => {

        const button = document.createElement("button");

        button.textContent = keyword;

        button.addEventListener("click", () => {

            searchInput.value = keyword;

            searchArtwork();

        });

        recentSearches.appendChild(button);

    });

}

clearRecentBtn.addEventListener("click", () => {

    recentList = [];

    localStorage.removeItem("recentSearches");

    renderRecentSearches();

});


/* ==========================================
   FAVORITES
========================================== */

function isFavorite(id) {

    return favorites.some(item => item.objectID === id);

}

function updateFavoriteButton() {

    if (!currentArtwork) return;

    favoriteBtn.innerHTML = isFavorite(currentArtwork.objectID)
        ? '<i class="fa-solid fa-bookmark"></i> Saved'
        : '<i class="fa-regular fa-bookmark"></i> Save';

}

function saveFavorite() {

    if (!currentArtwork) return;

    if (isFavorite(currentArtwork.objectID)) {

        favorites = favorites.filter(
            item => item.objectID !== currentArtwork.objectID
        );

    } else {

        favorites.unshift({

            objectID: currentArtwork.objectID,

            title: currentArtwork.title,

            artist: currentArtwork.artistDisplayName,

            image:
                currentArtwork.primaryImageSmall ||
                currentArtwork.primaryImage

        });

    }

    localStorage.setItem(
        "favoriteArtworks",
        JSON.stringify(favorites)
    );

    renderFavorites();

    updateFavoriteButton();

}

function renderFavorites() {

    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {

        favoritesContainer.innerHTML =
            "<p>No saved artworks yet.</p>";

        return;

    }

    favorites.forEach(item => {

        favoritesContainer.innerHTML += `

        <div class="favorite-card">

            <img src="${item.image}" alt="${item.title}">

            <div class="favorite-card-content">

                <h4>${item.title}</h4>

                <p>${item.artist || "Unknown Artist"}</p>

            </div>

        </div>

        `;

    });

}

favoriteBtn.addEventListener("click", saveFavorite);

/* ==========================================
   COPY DETAILS
========================================== */

copyBtn.addEventListener("click", async () => {

    if (!currentArtwork) return;

    const details = `
Title : ${currentArtwork.title || "N/A"}

Artist : ${currentArtwork.artistDisplayName || "Unknown"}

Date : ${currentArtwork.objectDate || "N/A"}

Medium : ${currentArtwork.medium || "N/A"}

Department : ${currentArtwork.department || "N/A"}

Culture : ${currentArtwork.culture || "N/A"}

Repository : ${currentArtwork.repository || "N/A"}
`;

    await navigator.clipboard.writeText(details);

    showToast("Artwork details copied successfully.");

});


/* ==========================================
   DOWNLOAD DETAILS
========================================== */

downloadBtn.addEventListener("click", () => {

    if (!currentArtwork) return;

    const text = `
Classic Artwork Details

Title : ${currentArtwork.title}

Artist : ${currentArtwork.artistDisplayName}

Date : ${currentArtwork.objectDate}

Medium : ${currentArtwork.medium}

Department : ${currentArtwork.department}

Culture : ${currentArtwork.culture}

Repository : ${currentArtwork.repository}
`;

    const blob = new Blob([text], {

        type: "text/plain"

    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "artwork-details.txt";

    link.click();

    showToast("Artwork details downloaded successfully.");

});


/* ==========================================
   DARK MODE
========================================== */


function applyTheme(theme) {

    if (theme === "dark") {

        document.body.classList.add("dark");

        themeBtn.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

    }

    else {

        document.body.classList.remove("dark");

        themeBtn.innerHTML =
            '<i class="fa-solid fa-moon"></i>';

    }

}

themeBtn.addEventListener("click", () => {

    const darkMode =
        document.body.classList.toggle("dark");

    localStorage.setItem(

        "theme",

        darkMode ? "dark" : "light"

    );

    applyTheme(

        darkMode ? "dark" : "light"

    );

});

applyTheme(

    localStorage.getItem("theme") || "light"

);




/* ==========================================
   BACK TO TOP
========================================== */

window.addEventListener("scroll", () => {

    if (window.scrollY > 300) {

        backToTop.style.display = "block";

    }

    else {

        backToTop.style.display = "none";

    }

});

backToTop.addEventListener("click", () => {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});


/* ==========================================
   EVENTS
========================================== */

searchBtn.addEventListener("click", searchArtwork);

randomBtn.addEventListener("click", randomArtwork);

searchInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {

        searchArtwork();

    }

});


/* ==========================================
   INIT
========================================== */

renderRecentSearches();

renderFavorites();

loadFeaturedArtwork();