document.addEventListener("DOMContentLoaded", function () {

  const sections = document.querySelectorAll(".section");

  sections.forEach(function (section) {
    section.classList.add("reveal");
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(function (section) {
    observer.observe(section);
  });

});