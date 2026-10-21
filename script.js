document.addEventListener("DOMContentLoaded", function () {

  const sections = document.querySelectorAll(".section");

  sections.forEach(function (section) {
    section.classList.add("reveal");
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry){
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

// ===== CONTACT FORM VALIDATION =====
(function () {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const fields = Array.from(form.querySelectorAll("#name, #email, #message"));

  if (fields.length !== 3 || fields.some(function (field) {
    return !form.querySelector(`#${field.id}-error`);
  })) return;

  function errorFor(field) {
    const value = field.value.trim();

    if (!value) {
      const messages = {
        name: "Please enter your name.",
        email: "Please enter your email address.",
        message: "Please tell me what you need help with."
      };
      return messages[field.id];
    }

    if (field.id === "name" && value.length < 2) {
      return "Please enter at least 2 characters for your name.";
    }

    if (field.id === "email" && field.validity.typeMismatch) {
      return "Please enter a valid email address, for example name@example.com.";
    }

    if (field.id === "message" && value.length < 10) {
      return "Please add a little more detail (at least 10 characters).";
    }

    if (field.maxLength > 0 && value.length > field.maxLength) {
      return `Please use no more than ${field.maxLength} characters.`;
    }

    return "";
  }

  function validateField(field) {
    const error = errorFor(field);
    form.querySelector(`#${field.id}-error`).textContent = error;
    field.setAttribute("aria-invalid", String(Boolean(error)));
    return error === "";
  }

  fields.forEach(function (field) {
    field.addEventListener("blur", function () {
      validateField(field);
    });

    field.addEventListener("change", function () {
      validateField(field);
    });

    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", function (event) {
    const invalidFields = fields.filter(function (field) {
      return !validateField(field);
    });

    if (invalidFields.length > 0) {
      event.preventDefault();
      invalidFields[0].focus();
      return;
    }

    fields.forEach(function (field) {
      field.value = field.value.trim();
    });
  });

  form.noValidate = true;
})();