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
  {
    web: "./assets/photos/banihtse2-web.jpg",
    full: "./assets/photos/banihtse2.jpg",
    caption: "Sofia, Bulgaria, 2019",
    label: "03 /  Sofia, Bulgaria, 2019",
    alt: "Black and white street photograph showing pedestrians and reflections on a rainy street in Sofia",
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
  const pagesPath = viewer.dataset.pages;
  const totalPages = Number(viewer.dataset.pageCount);
  const status = viewer.querySelector("[data-book-status]");
  const counter = viewer.querySelector("[data-book-counter]");
  const leftPage = viewer.querySelector("[data-book-page-left]");
  const rightPage = viewer.querySelector("[data-book-page-right]");
  const previousButton = viewer.querySelector("[data-book-prev]");
  const nextButton = viewer.querySelector("[data-book-next]");
  const bookLightbox = document.getElementById("bookLightbox");
  const bookLightboxImage = bookLightbox?.querySelector("[data-book-lightbox-image]");
  const bookLightboxCaption = bookLightbox?.querySelector("[data-book-lightbox-caption]");
  const bookLightboxClose = bookLightbox?.querySelector("[data-book-lightbox-close]");
  const bookLightboxPrev = bookLightbox?.querySelector("[data-book-lightbox-prev]");
  const bookLightboxNext = bookLightbox?.querySelector("[data-book-lightbox-next]");

  if (!pagesPath || !totalPages || !leftPage || !rightPage) {
    if (status) {
      status.textContent = "book preview unavailable";
    }

    return;
  }

  let spreadStart = 1;
  let isRendering = false;
  let expandedPage = 1;

  function pageSource(pageNumber) {
    return `${pagesPath}/page-${String(pageNumber).padStart(2, "0")}.jpg`;
  }

  function setStatus(text) {
    if (status) {
      status.textContent = text;
    }
  }

  function updateCounter() {
    if (!counter) {
      return;
    }

    const spreadEnd = Math.min(spreadStart + 1, totalPages);
    counter.textContent = `${spreadStart}-${spreadEnd} / ${totalPages}`;
  }

  function clearPage(image) {
    if (!image) {
      return;
    }

    image.removeAttribute("src");
    image.removeAttribute("aria-label");
    image.removeAttribute("data-page");
    image.removeAttribute("tabindex");
    image.removeAttribute("role");
    image.hidden = true;
  }

  function renderPage(pageNumber, image) {
    if (pageNumber > totalPages) {
      clearPage(image);
      return Promise.resolve();
    }

    image.hidden = false;
    image.alt = `Street Roving photobook, page ${pageNumber}`;
    image.setAttribute("aria-label", `page ${pageNumber}`);
    image.dataset.page = String(pageNumber);
    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");

    return new Promise((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Unable to load page ${pageNumber}`));
      image.src = pageSource(pageNumber);

      if (image.complete && image.naturalWidth > 0) {
        resolve();
      }
    });
  }

  function renderExpandedPage(pageNumber) {
    if (!bookLightboxImage || pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    expandedPage = pageNumber;
    bookLightboxImage.alt = `Street Roving photobook, page ${pageNumber}`;
    bookLightboxImage.src = pageSource(pageNumber);

    if (bookLightboxCaption) {
      bookLightboxCaption.textContent = `page ${pageNumber} / ${totalPages}`;
    }
  }

  function openExpandedPage(pageNumber) {
    if (!bookLightbox) {
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
    bookLightboxImage?.removeAttribute("src");
  }

  function moveExpandedPage(direction) {
    const nextPage = Math.min(Math.max(expandedPage + direction, 1), totalPages);
    renderExpandedPage(nextPage);
  }

  async function renderSpread() {
    if (isRendering) {
      return;
    }

    isRendering = true;
    setStatus("loading spread");
    updateCounter();

    try {
      await Promise.all([
        renderPage(spreadStart, leftPage),
        renderPage(spreadStart + 1, rightPage),
      ]);
      setStatus("double page view");
    } catch (error) {
      setStatus("book preview unavailable");
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
    if (spreadStart + 2 > totalPages || isRendering) {
      return;
    }

    spreadStart += 2;
    renderSpread();
  });

  [leftPage, rightPage].forEach((image) => {
    image.addEventListener("click", () => {
      const pageNumber = Number(image.dataset.page);

      if (!Number.isNaN(pageNumber)) {
        openExpandedPage(pageNumber);
      }
    });

    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      const pageNumber = Number(image.dataset.page);

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

  renderSpread();
});
