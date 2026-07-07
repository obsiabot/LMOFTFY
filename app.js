(function () {
  const targetBase = "https://observatoire-ia-formation.univ-amu.fr/";
  const searchApiBase = `${targetBase}wp-json/wp/v2/search`;
  const pluginParams = [
    ["asl_active", "1"],
    ["p_asl_data", "1"],
    ["categoryset[]", "29"],
    ["categoryset[]", "27"],
    ["categoryset[]", "172"],
    ["categoryset[]", "28"],
    ["categoryset[]", "55"],
    ["categoryset[]", "1"],
    ["customset[]", "tribe_events"],
    ["customset[]", "page"],
    ["customset[]", "post"],
    ["asl_gen[]", "excerpt"],
    ["asl_gen[]", "content"],
    ["asl_gen[]", "title"],
    ["qtranslate_lang", "0"],
    ["filters_initial", "1"],
    ["filters_changed", "0"],
  ];

  const app = document.querySelector(".app");
  const form = document.querySelector("#linkForm");
  const keywordInput = document.querySelector("#keyword");
  const shareBox = document.querySelector("#shareBox");
  const shareUrl = document.querySelector("#shareUrl");
  const copyButton = document.querySelector("#copyButton");
  const previewLink = document.querySelector("#previewLink");
  const demoTitle = document.querySelector("#demoTitle");
  const typedTerm = document.querySelector("#typedTerm");
  const statusLine = document.querySelector("#statusLine");
  const playButton = document.querySelector("#playButton");
  const directLink = document.querySelector("#directLink");
  const resultPreview = document.querySelector("#resultPreview");
  const resultLabel = document.querySelector("#resultLabel");
  const firstResultLink = document.querySelector("#firstResultLink");
  const resultExcerpt = document.querySelector("#resultExcerpt");
  const countdown = document.querySelector("#countdown");
  const countValue = document.querySelector("#countValue");
  const navSearch = document.querySelector(".nav-search");
  let hasGeneratedLink = false;

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function readQuery() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") === "lucky" ? "lucky" : "search";
    return {
      term: cleanTerm(params.get("q") || params.get("s") || ""),
      mode,
      auto: params.get("auto") !== "0",
      directUrl: cleanTerm(params.get("url") || ""),
    };
  }

  function cleanTerm(value) {
    return String(value).replace(/\s+/g, " ").trim();
  }

  function normalizeTerm(value) {
    return cleanTerm(value)
      .toLocaleLowerCase("fr-FR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function buildSearchUrl(term) {
    const params = new URLSearchParams();
    params.set("s", term);
    pluginParams.forEach(([key, value]) => params.append(key, value));
    return `${targetBase}?${params.toString()}`;
  }

  function buildSearchApiUrl(term) {
    const params = new URLSearchParams();
    params.set("search", term);
    params.set("per_page", "1");
    params.set("_fields", "id,title,url,subtype,type");
    return `${searchApiBase}?${params.toString()}`;
  }

  async function fetchFirstResult(term) {
    const response = await fetch(buildSearchApiUrl(term), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const results = await response.json();
    if (!Array.isArray(results) || !results.length || !results[0].url) {
      return null;
    }

    return {
      title: decodeHtml(results[0].title || "Premier résultat"),
      url: results[0].url,
    };
  }

  async function resolveDestination(term, mode, directUrl) {
    if (mode !== "lucky") {
      return {
        title: "",
        url: buildSearchUrl(term),
        fallback: false,
      };
    }

    if (directUrl) {
      return {
        title: "Premier résultat",
        url: directUrl,
        fallback: false,
      };
    }

    try {
      const result = await fetchFirstResult(term);
      if (result) {
        return {
          ...result,
          fallback: false,
        };
      }
    } catch {
      // La recherche guidée doit rester utilisable même si l'API REST est indisponible.
    }

    return {
      title: "",
      url: buildSearchUrl(term),
      fallback: true,
    };
  }

  function buildDemoUrl(term, mode) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("q", term);
    if (mode === "lucky") url.searchParams.set("mode", "lucky");
    return url.toString();
  }

  function selectedMode() {
    const checked = form.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : "search";
  }

  function updatePreview(term, mode, directUrl) {
    directLink.href = term ? buildSearchUrl(term) : targetBase;
    demoTitle.textContent = term
      ? `Recherche : ${term}`
      : "Que souhaitez-vous chercher ?";
    directLink.textContent =
      term && mode === "lucky"
        ? "Chercher le premier résultat"
        : "Ouvrir maintenant";
  }

  function renderResultPreview(term, mode, destination) {
    const safeTerm = escapeHtml(term);

    resultPreview.hidden = false;
    resultLabel.textContent = mode === "lucky" && !destination.fallback
      ? "Premier résultat"
      : "Résultats de recherche";
    firstResultLink.href = destination.url;

    if (mode === "lucky" && destination.title && !destination.fallback) {
      firstResultLink.innerHTML = markTerm(destination.title, term);
      resultExcerpt.innerHTML = `Ouverture du premier résultat trouvé pour <mark>${safeTerm}</mark>.`;
      return;
    }

    firstResultLink.innerHTML = `Recherche ObsiaFormation : <mark>${safeTerm}</mark>`;
    resultExcerpt.innerHTML = `Ouvrir les contenus correspondant à <mark>${safeTerm}</mark>.`;
  }

  async function runCountdown() {
    countdown.hidden = false;
    for (let value = 3; value > 0; value -= 1) {
      countValue.textContent = String(value);
      await wait(1000);
    }
  }

  async function playDemo(term, mode, directUrl) {
    if (!term) return;
    app.classList.remove("is-complete");
    app.classList.add("is-playing");
    playButton.disabled = true;
    typedTerm.textContent = "";
    resultPreview.hidden = true;
    countdown.hidden = true;
    updatePreview(term, mode, directUrl);

    statusLine.textContent = "Ouverture du moteur de recherche.";
    await wait(700);

    statusLine.textContent = "Saisie du mot-clé.";
    for (const character of term) {
      typedTerm.textContent += character;
      await wait(105);
    }
    await wait(450);

    let destination = {
      title: "",
      url: buildSearchUrl(term),
      fallback: false,
    };

    if (mode === "lucky") {
      statusLine.textContent = "Recherche du premier résultat disponible.";
      destination = await resolveDestination(term, mode, directUrl);
      statusLine.textContent = destination.fallback
        ? "Aucun premier résultat direct. Ouverture des résultats de recherche."
        : "Ouverture du premier résultat disponible.";
    } else {
      statusLine.textContent = "Ouverture des résultats de recherche.";
    }

    typedTerm.textContent = term;
    renderResultPreview(term, mode, destination);
    app.classList.add("is-complete");

    await wait(700);
    await runCountdown();
    window.location.href = destination.url;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function decodeHtml(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  function markTerm(text, term) {
    const safeText = escapeHtml(text);
    const normalizedText = normalizeTerm(text);
    const normalizedTerm = normalizeTerm(term);
    const index = normalizedText.indexOf(normalizedTerm);

    if (index === -1 || !normalizedTerm) {
      return safeText;
    }

    const before = escapeHtml(text.slice(0, index));
    const match = escapeHtml(text.slice(index, index + term.length));
    const after = escapeHtml(text.slice(index + term.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const term = cleanTerm(keywordInput.value);
    if (!term) return;
    const mode = selectedMode();
    const demoUrl = buildDemoUrl(term, mode);
    shareUrl.value = demoUrl;
    previewLink.href = demoUrl;
    shareBox.hidden = false;
    hasGeneratedLink = true;
    updatePreview(term, mode, "");
    window.setTimeout(() => previewLink.focus(), 120);
  });

  previewLink.addEventListener("click", () => {
    shareBox.classList.add("is-closing");
  });

  copyButton.addEventListener("click", async () => {
    if (!shareUrl.value) return;
    try {
      await navigator.clipboard.writeText(shareUrl.value);
      copyButton.textContent = "Copié";
      await wait(1200);
      copyButton.textContent = "Copier";
    } catch {
      shareUrl.select();
      document.execCommand("copy");
    }
  });

  playButton.addEventListener("click", () => {
    const query = readQuery();
    const term = cleanTerm(keywordInput.value || query.term);
    const mode = app.dataset.view === "demo" ? query.mode : selectedMode();
    playDemo(term, mode, query.directUrl);
  });

  directLink.addEventListener("click", async (event) => {
    const query = readQuery();
    const term = cleanTerm(keywordInput.value || query.term);
    const mode = app.dataset.view === "demo" ? query.mode : selectedMode();

    if (!term || mode !== "lucky") return;

    event.preventDefault();
    directLink.textContent = "Recherche...";
    const destination = await resolveDestination(term, mode, query.directUrl);
    window.location.href = destination.url;
  });

  navSearch.addEventListener("click", () => {
    keywordInput.focus();
    keywordInput.select();
  });

  const initial = readQuery();
  if (initial.term) {
    app.dataset.view = "demo";
    keywordInput.value = initial.term;
    updatePreview(initial.term, initial.mode, initial.directUrl);
    if (initial.auto) {
      window.setTimeout(
        () => playDemo(initial.term, initial.mode, initial.directUrl),
        650
      );
    }
  } else {
    updatePreview("", "search", "");
  }
})();
