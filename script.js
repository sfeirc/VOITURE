// script.js

// URL de base de l'API OpenDataSoft
const BASE_API_URL = 'https://public.opendatasoft.com/api/records/1.0/search/';

// Sélection des éléments du DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const yearFilter = document.getElementById('year-filter');
const fuelFilter = document.getElementById('fuel-filter');
const transmissionFilter = document.getElementById('transmission-filter');
const showFavoritesBtn = document.getElementById('show-favorites');
const paginationDiv = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

let currentPage = 1;
const resultsPerPage = 20; // Augmenté de 10 à 20
let totalResults = 0;
let allResults = [];
let favorites = [];

// Charger les favoris depuis le localStorage
function loadFavorites() {
  const storedFavorites = localStorage.getItem('favorites');
  if (storedFavorites) {
    favorites = JSON.parse(storedFavorites);
  }
}

// Sauvegarder les favoris dans le localStorage
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Fonction pour afficher les résultats sur la page donnée
function displayResults(page) {
  resultsDiv.innerHTML = '';

  const startIndex = (page - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = allResults.slice(startIndex, endIndex);

  if (paginatedResults.length > 0) {
    paginatedResults.forEach(function(record) {
      const vehicle = record.fields;

      // Créer une carte pour chaque véhicule
      const carCard = document.createElement('div');
      carCard.classList.add('car-card');

      // Bouton Favori
      const favoriteBtn = document.createElement('button');
      favoriteBtn.classList.add('favorite-btn');
      favoriteBtn.innerHTML = favorites.some(fav => fav.recordid === record.recordid) ? '❤️' : '🤍';
      favoriteBtn.addEventListener('click', function() {
        toggleFavorite(record, favoriteBtn);
      });
      carCard.appendChild(favoriteBtn);

      // Image du véhicule
      const carImage = document.createElement('img');
      carImage.classList.add('car-image');

      // Générer l'URL de l'image en utilisant la marque et le modèle
      const make = vehicle.make.replace(/\s+/g, '_');
      const model = vehicle.model.replace(/\s+/g, '_');
      const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${make}_${model}.jpg`;

      carImage.src = imageUrl;
      carImage.alt = `${vehicle.make} ${vehicle.model}`;

      // Gestion des erreurs d'image
      carImage.onerror = function() {
        carImage.src = 'default-image.jpg'; // Chemin vers votre image par défaut
      };

      // Événement au clic sur l'image
      carImage.addEventListener('click', function() {
        showImageModal(imageUrl);
      });
      carCard.appendChild(carImage);

      // Informations sur le véhicule
      const carInfo = document.createElement('div');
      carInfo.classList.add('car-info');
      carInfo.innerHTML = `
        <h3>${vehicle.make} ${vehicle.model}</h3>
        <p>Année : ${vehicle.year || 'N/A'}</p>
        <p>Type de carburant : ${vehicle.fueltype || vehicle.fueltype1 || 'N/A'}</p>
        <p>Transmission : ${vehicle.trany || 'N/A'}</p>
      `;
      carCard.appendChild(carInfo);

      resultsDiv.appendChild(carCard);
    });

    // Mettre à jour les informations de pagination
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;

    // Désactiver les boutons si nécessaire
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  } else {
    resultsDiv.innerHTML = 'Aucun résultat trouvé.';
    pageInfo.textContent = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
  }
}

// Fonction pour effectuer la recherche
function searchCars(query) {
  // Afficher un message de chargement
  resultsDiv.innerHTML = '<p>Chargement des résultats...</p>';
  pageInfo.textContent = '';

  const selectedYear = yearFilter.value;
  const selectedFuel = fuelFilter.value;
  const selectedTransmission = transmissionFilter.value;

  // Paramètres de la requête
  const params = {
    dataset: 'all-vehicles-model',
    q: query,
    rows: resultsPerPage,
    start: (currentPage - 1) * resultsPerPage
  };

  if (selectedYear) {
    params.refine = { ...params.refine, 'year': selectedYear };
  }
  if (selectedFuel) {
    params.refine = { ...params.refine, 'fueltype': selectedFuel };
  }
  if (selectedTransmission) {
    params.refine = { ...params.refine, 'trany': selectedTransmission };
  }

  // Requête AJAX à l'API OpenDataSoft
  $.ajax({
    url: BASE_API_URL,
    dataType: 'json',
    data: params,
    success: function(response) {
      if (response && response.records && response.records.length > 0) {
        totalResults = response.nhits;
        allResults = response.records;
        displayResults(currentPage);
      } else {
        resultsDiv.innerHTML = 'Aucun résultat trouvé.';
        pageInfo.textContent = '';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
      }
    },
    error: function() {
      resultsDiv.innerHTML = 'Erreur lors de la récupération des données.';
      pageInfo.textContent = '';
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
    }
  });
}

// Toggle favorite
function toggleFavorite(record, favoriteBtn) {
  const index = favorites.findIndex(fav => fav.recordid === record.recordid);
  if (index === -1) {
    favorites.push(record);
    favoriteBtn.innerHTML = '❤️';
  } else {
    favorites.splice(index, 1);
    favoriteBtn.innerHTML = '🤍';
  }
  saveFavorites();
}

// Fonction pour afficher une modal avec l'image agrandie
function showImageModal(imageSrc) {
  // Créer les éléments de la modal
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const closeBtn = document.createElement('span');
  closeBtn.classList.add('close-button');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', function() {
    document.body.removeChild(modal);
  });

  const modalImage = document.createElement('img');
  modalImage.src = imageSrc;
  modalImage.classList.add('modal-image');

  // Assembler les éléments
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalImage);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// Event listeners
searchForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    currentPage = 1; // Réinitialiser à la première page
    searchCars(query);
  }
});

prevPageBtn.addEventListener('click', function() {
  if (currentPage > 1) {
    currentPage--;
    searchCars(searchInput.value.trim());
  }
});

nextPageBtn.addEventListener('click', function() {
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    searchCars(searchInput.value.trim());
  }
});

// Afficher les favoris
showFavoritesBtn.addEventListener('click', function() {
  if (favorites.length > 0) {
    allResults = favorites;
    totalResults = favorites.length;
    currentPage = 1;
    displayResults(currentPage);
  } else {
    resultsDiv.innerHTML = 'Aucun favori ajouté.';
    pageInfo.textContent = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
  }
});

// Charger les favoris au chargement de la page
loadFavorites();
