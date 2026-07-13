document.getElementById("year").textContent = new Date().getFullYear();

const localTime = document.getElementById("localTime");

function updateLocalTime() {
  if (!localTime) {
    return;
  }

  const now = new Date();
  localTime.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Europe/Athens",
  }).format(now);
  localTime.dateTime = now.toISOString();
}

updateLocalTime();
window.setInterval(updateLocalTime, 1000);

const welcomeOverlay = document.getElementById("welcomeOverlay");

if (welcomeOverlay) {
  const referrer = document.referrer ? new URL(document.referrer) : null;
  const cameFromThisSite = referrer && referrer.origin === window.location.origin;

  if (cameFromThisSite) {
    welcomeOverlay.classList.add("is-hidden");
    document.body.classList.remove("has-welcome");
  } else {
    window.setTimeout(() => {
      welcomeOverlay.classList.add("is-hidden");
      document.body.classList.remove("has-welcome");
    }, 2500);
  }
}

document.querySelectorAll(".menu-toggle").forEach((toggle) => {
  const submenu = toggle.nextElementSibling;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));

    if (submenu) {
      submenu.hidden = isOpen;
    }
  });
});

const lightbox = document.getElementById("lightbox");

const slides = [
  {
    web: "/assets/photos/banihtse-29-web.jpg",
    full: "/assets/photos/banihtse-29.jpg",
    caption: "Sofia, Bulgaria, 2019",
    label: "01 / Sofia, Bulgaria",
    alt: "Analogue black and white photograph of a reflected street scene in Sofia",
  },
  {
    web: "/assets/photos/untitled-11-web.jpg",
    full: "/assets/photos/untitled-11.jpg",
    caption: "Corfu, Greece, 2018",
    label: "02 / Corfu, Greece, 2018",
    alt: "Analogue black and white photograph of pigeons flying through a narrow street",
  },
];

const emptyImage =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

let currentSlideIndex = 0;

slides.forEach((slide) => {
  const preload = new Image();
  preload.src = slide.web;
});

if (lightbox) {
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("figcaption");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const previousButton = lightbox.querySelector(".lightbox-prev");
  const nextButton = lightbox.querySelector(".lightbox-next");
  let lightboxSlideIndex = currentSlideIndex;

  function showLightboxSlide(index) {
    const slide = slides[index];

    if (!slide) {
      return;
    }

    lightboxSlideIndex = index;
    lightboxImage.alt = slide.alt;
    lightboxCaption.textContent = slide.caption;
    lightboxImage.onerror = () => {
      const fallbackImage = document.querySelector(`.photo-open[data-slide="${index}"] img`);
      const fallbackSource = fallbackImage?.currentSrc || fallbackImage?.src;

      lightboxImage.onerror = null;

      if (fallbackSource) {
        lightboxImage.src = fallbackSource;
      }
    };
    lightboxImage.src = slide.full;
  }

  function goToLightboxSlide(direction) {
    const nextIndex = (lightboxSlideIndex + direction + slides.length) % slides.length;
    showLightboxSlide(nextIndex);
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.onerror = null;
    lightboxImage.src = emptyImage;
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".photo-open, .meta-open").forEach((button) => {
    button.addEventListener("click", () => {
      const slideIndex = Number(button.dataset.slide ?? currentSlideIndex);
      currentSlideIndex = Number.isNaN(slideIndex) ? currentSlideIndex : slideIndex;

      showLightboxSlide(currentSlideIndex);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  previousButton.addEventListener("click", () => goToLightboxSlide(-1));
  nextButton.addEventListener("click", () => goToLightboxSlide(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }

    if (event.key === "ArrowLeft" && lightbox.classList.contains("is-open")) {
      goToLightboxSlide(-1);
    }

    if (event.key === "ArrowRight" && lightbox.classList.contains("is-open")) {
      goToLightboxSlide(1);
    }
  });
}

document.querySelectorAll(".book-viewer").forEach((viewer) => {
  const pdfUrl = viewer.dataset.pdf;
  const status = viewer.querySelector("[data-book-status]");
  const counter = viewer.querySelector("[data-book-counter]");
  const leftCanvas = viewer.querySelector("[data-book-canvas-left]");
  const rightCanvas = viewer.querySelector("[data-book-canvas-right]");
  const previousButton = viewer.querySelector("[data-book-prev]");
  const nextButton = viewer.querySelector("[data-book-next]");
  const bookLightbox = document.getElementById("bookLightbox");
  const bookLightboxCanvas = bookLightbox?.querySelector("[data-book-lightbox-canvas]");
  const bookLightboxCaption = bookLightbox?.querySelector("[data-book-lightbox-caption]");
  const bookLightboxClose = bookLightbox?.querySelector("[data-book-lightbox-close]");
  const bookLightboxPrev = bookLightbox?.querySelector("[data-book-lightbox-prev]");
  const bookLightboxNext = bookLightbox?.querySelector("[data-book-lightbox-next]");

  if (!pdfUrl || !window.pdfjsLib || !leftCanvas || !rightCanvas) {
    if (status) {
      status.textContent = "open pdf";
    }

    return;
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDocument = null;
  let spreadStart = 1;
  let isRendering = false;
  let expandedPage = 1;

  function setStatus(text) {
    if (status) {
      status.textContent = text;
    }
  }

  function updateCounter() {
    if (!counter || !pdfDocument) {
      return;
    }

    const spreadEnd = Math.min(spreadStart + 1, pdfDocument.numPages);
    counter.textContent = `${spreadStart}-${spreadEnd} / ${pdfDocument.numPages}`;
  }

  function clearCanvas(canvas) {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function renderPage(pageNumber, canvas) {
    if (!pdfDocument || pageNumber > pdfDocument.numPages) {
      clearCanvas(canvas);
      canvas.removeAttribute("aria-label");
      canvas.removeAttribute("data-page");
      canvas.removeAttribute("tabindex");
      canvas.removeAttribute("role");
      return;
    }

    const page = await pdfDocument.getPage(pageNumber);
    const containerWidth = Math.max(canvas.parentElement.clientWidth, 280);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2.5);
    const context = canvas.getContext("2d");

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    canvas.setAttribute("aria-label", `page ${pageNumber}`);
    canvas.dataset.page = String(pageNumber);
    canvas.setAttribute("tabindex", "0");
    canvas.setAttribute("role", "button");

    await page.render({
      canvasContext: context,
      viewport,
      transform:
        outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : null,
    }).promise;
  }

  async function renderExpandedPage(pageNumber) {
    if (!pdfDocument || !bookLightboxCanvas || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      return;
    }

    expandedPage = pageNumber;
    const page = await pdfDocument.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxWidth = Math.min(window.innerWidth * 0.9, 1180);
    const maxHeight = window.innerHeight * 0.78;
    const scale = Math.min(maxWidth / baseViewport.width, maxHeight / baseViewport.height);
    const viewport = page.getViewport({ scale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2.5);
    const context = bookLightboxCanvas.getContext("2d");

    bookLightboxCanvas.width = Math.floor(viewport.width * outputScale);
    bookLightboxCanvas.height = Math.floor(viewport.height * outputScale);
    bookLightboxCanvas.style.width = `${Math.floor(viewport.width)}px`;
    bookLightboxCanvas.style.height = `${Math.floor(viewport.height)}px`;
    context.clearRect(0, 0, bookLightboxCanvas.width, bookLightboxCanvas.height);

    if (bookLightboxCaption) {
      bookLightboxCaption.textContent = `page ${pageNumber} / ${pdfDocument.numPages}`;
    }

    await page.render({
      canvasContext: context,
      viewport,
      transform:
        outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : null,
    }).promise;
  }

  function openExpandedPage(pageNumber) {
    if (!bookLightbox || !pdfDocument) {
      return;
    }

    bookLightbox.classList.add("is-open");
    bookLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderExpandedPage(pageNumber);
    bookLightboxClose?.focus();
  }

  function closeExpandedPage() {
    if (!bookLightbox) {
      return;
    }

    bookLightbox.classList.remove("is-open");
    bookLightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    clearCanvas(bookLightboxCanvas);
  }

  function moveExpandedPage(direction) {
    if (!pdfDocument) {
      return;
    }

    const nextPage = Math.min(Math.max(expandedPage + direction, 1), pdfDocument.numPages);
    renderExpandedPage(nextPage);
  }

  async function renderSpread() {
    if (!pdfDocument || isRendering) {
      return;
    }

    isRendering = true;
    setStatus("loading spread");
    updateCounter();

    try {
      await Promise.all([
        renderPage(spreadStart, leftCanvas),
        renderPage(spreadStart + 1, rightCanvas),
      ]);
      setStatus("double page view");
    } catch (error) {
      setStatus("pdf preview unavailable");
    } finally {
      isRendering = false;
    }
  }

  previousButton?.addEventListener("click", () => {
    if (spreadStart <= 1 || isRendering) {
      return;
    }

    spreadStart = Math.max(1, spreadStart - 2);
    renderSpread();
  });

  nextButton?.addEventListener("click", () => {
    if (!pdfDocument || spreadStart + 2 > pdfDocument.numPages || isRendering) {
      return;
    }

    spreadStart += 2;
    renderSpread();
  });

  [leftCanvas, rightCanvas].forEach((canvas) => {
    canvas.addEventListener("click", () => {
      const pageNumber = Number(canvas.dataset.page);

      if (!Number.isNaN(pageNumber)) {
        openExpandedPage(pageNumber);
      }
    });

    canvas.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      const pageNumber = Number(canvas.dataset.page);

      if (!Number.isNaN(pageNumber)) {
        openExpandedPage(pageNumber);
      }
    });
  });

  bookLightboxClose?.addEventListener("click", closeExpandedPage);
  bookLightboxPrev?.addEventListener("click", () => moveExpandedPage(-1));
  bookLightboxNext?.addEventListener("click", () => moveExpandedPage(1));
  bookLightbox?.addEventListener("click", (event) => {
    if (event.target === bookLightbox) {
      closeExpandedPage();
    }
  });

  window.addEventListener("resize", () => {
    if (pdfDocument) {
      renderSpread();

      if (bookLightbox?.classList.contains("is-open")) {
        renderExpandedPage(expandedPage);
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!bookLightbox?.classList.contains("is-open")) {
      return;
    }

    if (event.key === "Escape") {
      closeExpandedPage();
    }

    if (event.key === "ArrowLeft") {
      moveExpandedPage(-1);
    }

    if (event.key === "ArrowRight") {
      moveExpandedPage(1);
    }
  });

  window.pdfjsLib
    .getDocument(pdfUrl)
    .promise.then((loadedPdf) => {
      pdfDocument = loadedPdf;
      renderSpread();
    })
    .catch(() => {
      setStatus("pdf preview unavailable");
    });
});
