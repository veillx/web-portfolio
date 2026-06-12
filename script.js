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
    web: "./assets/photos/banihtse-29-web.jpg",
    full: "./assets/photos/banihtse-29.jpg",
    caption: "Sofia, Bulgaria, 2019",
    label: "01 / Sofia, Bulgaria",
    alt: "Analogue black and white photograph of a reflected street scene in Sofia",
  },
  {
    web: "./assets/photos/untitled-11-web.jpg",
    full: "./assets/photos/untitled-11.jpg",
    caption: "Corfu, Greece, 2020",
    label: "02 / Corfu, Greece",
    alt: "Analogue black and white photograph of pigeons flying through a narrow street",
  },
];

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
    lightboxImage.src = slide.full;
    lightboxImage.alt = slide.alt;
    lightboxCaption.textContent = slide.caption;
  }

  function goToLightboxSlide(direction) {
    const nextIndex = (lightboxSlideIndex + direction + slides.length) % slides.length;
    showLightboxSlide(nextIndex);
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
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
