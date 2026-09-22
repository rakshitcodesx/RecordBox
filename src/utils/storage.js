export function saveShows(shows) {
  localStorage.setItem("showTrackerShows", JSON.stringify(shows));
}

export function loadShows() {
  const savedShows = localStorage.getItem("showTrackerShows");

  if (!savedShows) {
    return null;
  }

  return JSON.parse(savedShows);
}

export function saveRanking(ranking) {
  localStorage.setItem("showTrackerRanking", JSON.stringify(ranking));
}

export function loadRanking() {
  const savedRanking = localStorage.getItem("showTrackerRanking");

  if (!savedRanking) {
    return null;
  }

  return JSON.parse(savedRanking);
}