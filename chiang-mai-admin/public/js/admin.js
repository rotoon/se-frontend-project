// JavaScript สำหรับหน้า admin
console.log("Admin JS loaded");

// Login Page Functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on the login page
  if (document.querySelector(".login-page")) {
    initLoginPage();
  }
});

function initLoginPage() {
  const loginForm = document.getElementById("login-form");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const errorMessage = document.getElementById("error-message");
  const attemptsWarning = document.getElementById("attempts-warning");

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      const icon = this.querySelector("i");
      if (type === "text") {
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  }

  // Form validation and submission
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Clear previous error messages
      hideErrorMessage();
      hideAttemptsWarning();

      // Validate form
      if (!this.checkValidity()) {
        this.classList.add("was-validated");
        return;
      }

      // Show loading state
      showLoadingState(true);

      // Get form data
      const formData = new FormData(this);
      const loginData = {
        username: formData.get("username"),
        password: formData.get("password"),
        remember: formData.get("remember") === "on",
      };

      // Submit login request
      fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })
        .then((response) => response.json())
        .then((data) => {
          showLoadingState(false);

          if (data.success) {
            // Redirect to dashboard
            window.location.href = data.redirect || "/dashboard";
          } else {
            // Show error message
            showErrorMessage(data.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");

            // Show attempts warning if applicable
            if (data.attemptsLeft !== undefined) {
              showAttemptsWarning(data.attemptsLeft, data.lockTime);
            }
          }
        })
        .catch((error) => {
          console.error("Login error:", error);
          showLoadingState(false);
          showErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
        });
    });
  }

  // Check for URL parameters (error messages)
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  const attempts = urlParams.get("attempts");
  const lockTime = urlParams.get("lockTime");

  if (error) {
    showErrorMessage(decodeURIComponent(error));
  }

  if (attempts !== null) {
    showAttemptsWarning(parseInt(attempts), lockTime);
  }
}

function showLoadingState(loading) {
  const loginBtn = document.getElementById("login-btn");
  const btnText = loginBtn.querySelector(".btn-text");
  const spinner = loginBtn.querySelector(".spinner-border");

  if (loading) {
    loginBtn.disabled = true;
    btnText.textContent = "กำลังเข้าสู่ระบบ...";
    spinner.classList.remove("d-none");
  } else {
    loginBtn.disabled = false;
    btnText.textContent = "เข้าสู่ระบบ";
    spinner.classList.add("d-none");
  }
}

function showErrorMessage(message) {
  const errorMessage = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");

  if (errorMessage && errorText) {
    errorText.textContent = message;
    errorMessage.classList.remove("d-none");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideErrorMessage();
    }, 5000);
  }
}

function hideErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.classList.add("d-none");
  }
}

function showAttemptsWarning(attemptsLeft, lockTime) {
  const attemptsWarning = document.getElementById("attempts-warning");
  const attemptsText = document.getElementById("attempts-text");

  if (attemptsWarning && attemptsText) {
    let message;

    if (attemptsLeft === 0) {
      message = `บัญชีถูกล็อคชั่วคราว กรุณารอ ${lockTime} นาที`;
    } else {
      message = `เหลือโอกาสในการเข้าสู่ระบบอีก ${attemptsLeft} ครั้ง`;
    }

    attemptsText.textContent = message;
    attemptsWarning.classList.remove("d-none");
  }
}

function hideAttemptsWarning() {
  const attemptsWarning = document.getElementById("attempts-warning");
  if (attemptsWarning) {
    attemptsWarning.classList.add("d-none");
  }
}

// Utility function to clear URL parameters
function clearUrlParams() {
  const url = new URL(window.location);
  url.search = "";
  window.history.replaceState({}, document.title, url);
}

// Logout function
function logout() {
  if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
    fetch("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          window.location.href = "/login";
        } else {
          alert("เกิดข้อผิดพลาดในการออกจากระบบ");
        }
      })
      .catch((error) => {
        console.error("Logout error:", error);
        // Force redirect to login page even if request fails
        window.location.href = "/login";
      });
  }
}

// Debounce utility function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Delete confirmation dialog functionality
function showDeleteConfirmation(options) {
  return new Promise((resolve) => {
    // Create modal HTML
    const modalId = "deleteConfirmModal";
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title" id="${modalId}Label">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                ยืนยันการลบ
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3">
                                <i class="fas fa-trash-alt fa-3x text-danger mb-3"></i>
                                <h6 class="fw-bold">${
                                  options.title ||
                                  "คุณต้องการลบรายการนี้หรือไม่?"
                                }</h6>
                            </div>
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>คำเตือน:</strong> ${
                                  options.message ||
                                  "การดำเนินการนี้ไม่สามารถยกเลิกได้"
                                }
                            </div>
                            ${
                              options.details
                                ? `<div class="text-muted small">${options.details}</div>`
                                : ""
                            }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                ยกเลิก
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                                <i class="fas fa-trash me-2"></i>
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Add modal to page
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(document.getElementById(modalId));
    const confirmBtn = document.getElementById("confirmDeleteBtn");

    // Handle confirm button click
    confirmBtn.addEventListener("click", () => {
      modal.hide();
      resolve(true);
    });

    // Handle modal close/cancel
    document.getElementById(modalId).addEventListener("hidden.bs.modal", () => {
      document.getElementById(modalId).remove();
      resolve(false);
    });

    // Show modal
    modal.show();
  });
}

// Delete place with confirmation
window.deletePlace = async function deletePlace(placeId, placeName) {
  const confirmed = await showDeleteConfirmation({
    title: `ลบสถานที่ "${placeName}"`,
    message: "สถานที่นี้จะถูกลบออกจากระบบอย่างถาวร",
    details: "รูปภาพและข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบด้วย",
  });

  if (!confirmed) {
    return;
  }

  try {
    // Show loading state
    const deleteBtn = document.querySelector(
      `button[onclick*="deletePlace('${placeId}'"]`
    );
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    const response = await fetch(`/api/places/${placeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      // Show success message
      showAlert("success", data.message || "ลบสถานที่เรียบร้อยแล้ว");

      // Reload places list if we're on the places page
      if (typeof loadPlaces === "function") {
        loadPlaces();
      } else {
        // Refresh page if loadPlaces function is not available
        window.location.reload();
      }
    } else {
      showAlert("error", data.message || "เกิดข้อผิดพลาดในการลบสถานที่");
    }
  } catch (error) {
    console.error("Error deleting place:", error);
    showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
  } finally {
    // Reset button state
    const deleteBtn = document.querySelector(
      `button[onclick*="deletePlace('${placeId}'"]`
    );
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    }
  }
};

// Delete category with confirmation
window.deleteCategory = async function deleteCategory(
  categoryId,
  categoryName
) {
  const confirmed = await showDeleteConfirmation({
    title: `ลบหมวดหมู่ "${categoryName}"`,
    message: "หมวดหมู่นี้จะถูกลบออกจากระบบอย่างถาวร",
    details: 'สถานที่ที่อยู่ในหมวดหมู่นี้จะถูกย้ายไปยังหมวดหมู่ "ไม่ระบุ"',
  });

  if (!confirmed) {
    return;
  }

  try {
    // Show loading state
    const deleteBtn = document.querySelector(
      `button[onclick*="deleteCategory('${categoryId}'"]`
    );
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    const response = await fetch(`/api/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      // Show success message
      showAlert("success", data.message || "ลบหมวดหมู่เรียบร้อยแล้ว");

      // Reload categories list if we're on the categories page
      if (typeof loadCategories === "function") {
        loadCategories();
      } else {
        // Refresh page if loadCategories function is not available
        window.location.reload();
      }
    } else {
      showAlert("error", data.message || "เกิดข้อผิดพลาดในการลบหมวดหมู่");
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
  } finally {
    // Reset button state
    const deleteBtn = document.querySelector(
      `button[onclick*="deleteCategory('${categoryId}'"]`
    );
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    }
  }
};

// Bulk delete with confirmation
window.bulkDeletePlaces = async function bulkDeletePlaces(
  placeIds,
  placeNames
) {
  const confirmed = await showDeleteConfirmation({
    title: `ลบสถานที่ ${placeIds.length} รายการ`,
    message: "สถานที่ทั้งหมดจะถูกลบออกจากระบบอย่างถาวร",
    details: `รายการที่จะลบ: ${placeNames.slice(0, 3).join(", ")}${
      placeNames.length > 3 ? ` และอีก ${placeNames.length - 3} รายการ` : ""
    }`,
  });

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch("/api/places/bulk/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ placeIds }),
    });

    const data = await response.json();

    if (data.success) {
      showAlert(
        "success",
        data.message || `ลบสถานที่ ${placeIds.length} รายการเรียบร้อยแล้ว`
      );

      // Reload places list
      if (typeof loadPlaces === "function") {
        loadPlaces();
      } else {
        window.location.reload();
      }
    } else {
      showAlert("error", data.message || "เกิดข้อผิดพลาดในการลบสถานที่");
    }
  } catch (error) {
    console.error("Error bulk deleting places:", error);
    showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
  }
};

// Generic alert function for showing messages
function showAlert(type, message) {
  // Try to find existing alert container
  let alertContainer = document.getElementById("alert-container");

  // If no alert container exists, create one
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "alert-container";
    alertContainer.className = "position-fixed top-0 end-0 p-3";
    alertContainer.style.zIndex = "9999";
    document.body.appendChild(alertContainer);
  }

  const alertClass = type === "success" ? "alert-success" : "alert-danger";
  const iconClass =
    type === "success" ? "fa-check-circle" : "fa-exclamation-triangle";
  const alertId = "alert-" + Date.now();

  const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert" id="${alertId}">
            <i class="fas ${iconClass} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

  alertContainer.insertAdjacentHTML("beforeend", alertHtml);

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 5000);
}

// ===== FORM MANAGEMENT FUNCTIONS =====

// Initialize form management when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeFormManagement();
  initializeLanguageSwitching();
  initializeImageManagement();
});

// Form Management System
function initializeFormManagement() {
  // Auto-save form data to localStorage
  const forms = document.querySelectorAll('form[data-autosave="true"]');
  forms.forEach((form) => {
    const formId = form.id || "default-form";

    // Load saved data
    loadFormData(form, formId);

    // Save data on input change
    form.addEventListener(
      "input",
      debounce(() => {
        saveFormData(form, formId);
      }, 1000)
    );

    // Clear saved data on successful submit
    form.addEventListener("submit", () => {
      clearFormData(formId);
    });
  });

  // Enhanced form validation
  initializeFormValidation();

  // Form field dependencies
  initializeFieldDependencies();
}

// Save form data to localStorage
function saveFormData(form, formId) {
  const formData = new FormData(form);
  const data = {};

  for (let [key, value] of formData.entries()) {
    if (data[key]) {
      // Handle multiple values (checkboxes, multiple selects)
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  localStorage.setItem(`form_${formId}`, JSON.stringify(data));

  // Show auto-save indicator
  showAutoSaveIndicator();
}

// Load form data from localStorage
function loadFormData(form, formId) {
  const savedData = localStorage.getItem(`form_${formId}`);
  if (!savedData) return;

  try {
    const data = JSON.parse(savedData);

    Object.keys(data).forEach((key) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (!field) return;

      if (field.type === "checkbox" || field.type === "radio") {
        if (Array.isArray(data[key])) {
          data[key].forEach((value) => {
            const specificField = form.querySelector(
              `[name="${key}"][value="${value}"]`
            );
            if (specificField) specificField.checked = true;
          });
        } else {
          const specificField = form.querySelector(
            `[name="${key}"][value="${data[key]}"]`
          );
          if (specificField) specificField.checked = true;
        }
      } else if (field.tagName === "SELECT" && field.multiple) {
        if (Array.isArray(data[key])) {
          Array.from(field.options).forEach((option) => {
            option.selected = data[key].includes(option.value);
          });
        }
      } else {
        field.value = data[key];
      }
    });

    // Trigger validation after loading data
    validateForm(form);
  } catch (error) {
    console.error("Error loading form data:", error);
  }
}

// Clear saved form data
function clearFormData(formId) {
  localStorage.removeItem(`form_${formId}`);
}

// Show auto-save indicator
function showAutoSaveIndicator() {
  let indicator = document.getElementById("autosave-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "autosave-indicator";
    indicator.className =
      "position-fixed bottom-0 end-0 m-3 alert alert-success alert-sm";
    indicator.style.zIndex = "9999";
    indicator.innerHTML = '<i class="fas fa-save me-2"></i>บันทึกอัตโนมัติแล้ว';
    document.body.appendChild(indicator);
  }

  indicator.classList.remove("d-none");
  setTimeout(() => {
    indicator.classList.add("d-none");
  }, 2000);
}

// Enhanced form validation
function initializeFormValidation() {
  // Custom validation rules
  const validationRules = {
    "thai-phone": /^(\+66|0)[0-9]{8,9}$/,
    url: /^https?:\/\/.+/,
    facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/,
    coordinates: /^-?([1-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/,
  };

  // Apply custom validation
  document.querySelectorAll("[data-validation]").forEach((field) => {
    const validationType = field.dataset.validation;
    const rule = validationRules[validationType];

    if (rule) {
      field.addEventListener("input", () => {
        validateField(field, rule);
      });

      field.addEventListener("blur", () => {
        validateField(field, rule);
      });
    }
  });

  // Real-time validation for all forms
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("input", () => {
      validateForm(form);
    });
  });
}

// Validate individual field
function validateField(field, rule) {
  const value = field.value.trim();
  const isValid = !value || rule.test(value);

  field.classList.toggle("is-valid", isValid && value);
  field.classList.toggle("is-invalid", !isValid && value);

  // Update feedback message
  updateFieldFeedback(field, isValid);

  return isValid;
}

// Update field feedback message
function updateFieldFeedback(field, isValid) {
  const feedbackElement = field.parentNode.querySelector(
    ".invalid-feedback, .valid-feedback"
  );
  if (!feedbackElement) return;

  if (isValid) {
    feedbackElement.className = "valid-feedback";
    feedbackElement.textContent = "ข้อมูลถูกต้อง";
  } else {
    feedbackElement.className = "invalid-feedback";

    // Custom error messages based on validation type
    const validationType = field.dataset.validation;
    const errorMessages = {
      "thai-phone": "กรุณากรอกหมายเลขโทรศัพท์ไทยที่ถูกต้อง",
      url: "กรุณากรอก URL ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)",
      facebook: "กรุณากรอกลิงก์ Facebook ที่ถูกต้อง",
      instagram: "กรุณากรอกลิงก์ Instagram ที่ถูกต้อง",
      coordinates: "กรุณากรอกพิกัดที่ถูกต้อง (-90 ถึง 90)",
    };

    feedbackElement.textContent =
      errorMessages[validationType] || "ข้อมูลไม่ถูกต้อง";
  }
}

// Validate entire form
function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll("[required]");

  requiredFields.forEach((field) => {
    const fieldValid = field.checkValidity();
    field.classList.toggle("is-valid", fieldValid && field.value.trim());
    field.classList.toggle("is-invalid", !fieldValid);

    if (!fieldValid) {
      isValid = false;
    }
  });

  // Update submit button state
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = !isValid;
  }

  return isValid;
}

// Initialize field dependencies
function initializeFieldDependencies() {
  // Show/hide fields based on other field values
  document.querySelectorAll("[data-depends-on]").forEach((field) => {
    const dependsOn = field.dataset.dependsOn;
    const dependsValue = field.dataset.dependsValue;
    const triggerField = document.querySelector(`[name="${dependsOn}"]`);

    if (triggerField) {
      const checkDependency = () => {
        const shouldShow = triggerField.value === dependsValue;
        field.closest(".form-group, .mb-3").style.display = shouldShow
          ? "block"
          : "none";

        // Clear field value if hidden
        if (!shouldShow) {
          field.value = "";
        }
      };

      triggerField.addEventListener("change", checkDependency);
      checkDependency(); // Initial check
    }
  });
}

// ===== LANGUAGE SWITCHING FUNCTIONS =====

let currentLanguage = "th"; // Default language
const supportedLanguages = ["th", "en", "zh", "ja"];

function initializeLanguageSwitching() {
  // Initialize language tabs
  const languageTabs = document.querySelectorAll(".language-tabs .nav-link");
  languageTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const language = tab.dataset.language;
      switchLanguage(language);
    });
  });

  // Set initial language
  switchLanguage(currentLanguage);

  // Update tab states based on content
  updateLanguageTabStates();
}

function switchLanguage(language) {
  if (!supportedLanguages.includes(language)) {
    console.error("Unsupported language:", language);
    return;
  }

  currentLanguage = language;

  // Update active tab
  document.querySelectorAll(".language-tabs .nav-link").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.language === language);
  });

  // Show/hide language-specific content
  document.querySelectorAll(".language-content").forEach((content) => {
    const contentLanguage = content.dataset.language;
    content.style.display = contentLanguage === language ? "block" : "none";
  });

  // Update form field names for current language
  updateFormFieldNames(language);

  // Focus on first visible field
  const firstField = document.querySelector(
    `.language-content[data-language="${language}"] input, .language-content[data-language="${language}"] textarea`
  );
  if (firstField) {
    setTimeout(() => firstField.focus(), 100);
  }
}

function updateFormFieldNames(language) {
  // Update field names to include language suffix
  document
    .querySelectorAll(
      ".language-content input, .language-content textarea, .language-content select"
    )
    .forEach((field) => {
      const baseName =
        field.dataset.baseName || field.name.replace(/_[a-z]{2}$/, "");
      field.dataset.baseName = baseName;
      field.name = `${baseName}_${language}`;
    });
}

function updateLanguageTabStates() {
  // Check which languages have content and update tab appearance
  supportedLanguages.forEach((language) => {
    const tab = document.querySelector(
      `.language-tabs .nav-link[data-language="${language}"]`
    );
    if (!tab) return;

    const hasContent = checkLanguageContent(language);
    const isRequired = language === "th"; // Thai is required

    // Update tab classes
    tab.classList.remove("text-success", "text-danger", "text-warning");

    if (hasContent) {
      tab.classList.add("text-success");
    } else if (isRequired) {
      tab.classList.add("text-danger");
    } else {
      tab.classList.add("text-warning");
    }
  });
}

function checkLanguageContent(language) {
  const languageContent = document.querySelector(
    `.language-content[data-language="${language}"]`
  );
  if (!languageContent) return false;

  const fields = languageContent.querySelectorAll(
    "input[required], textarea[required]"
  );
  return Array.from(fields).every((field) => field.value.trim() !== "");
}

// Get form data for all languages
function getMultiLanguageFormData(form) {
  const data = {};

  supportedLanguages.forEach((language) => {
    data[language] = {};
    const languageContent = form.querySelector(
      `.language-content[data-language="${language}"]`
    );

    if (languageContent) {
      const fields = languageContent.querySelectorAll(
        "input, textarea, select"
      );
      fields.forEach((field) => {
        const baseName =
          field.dataset.baseName || field.name.replace(/_[a-z]{2}$/, "");
        data[language][baseName] = field.value;
      });
    }
  });

  return data;
}

// ===== IMAGE MANAGEMENT FUNCTIONS =====

let uploadedImages = [];
let featuredImageIndex = -1;

function initializeImageManagement() {
  // Initialize drag and drop
  initializeDragAndDrop();

  // Initialize file input
  initializeFileInput();

  // Initialize image sorting
  initializeImageSorting();

  // Load existing images if editing
  loadExistingImages();
}

function initializeDragAndDrop() {
  const uploadArea = document.querySelector(".image-upload-area");
  if (!uploadArea) return;

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(
      eventName,
      () => {
        uploadArea.classList.add("dragover");
      },
      false
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(
      eventName,
      () => {
        uploadArea.classList.remove("dragover");
      },
      false
    );
  });

  uploadArea.addEventListener("drop", handleDrop, false);
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function initializeFileInput() {
  const fileInput = document.querySelector(
    'input[type="file"][accept*="image"]'
  );
  if (!fileInput) return;

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
  });
}

function handleFiles(files) {
  Array.from(files).forEach((file) => {
    if (validateImageFile(file)) {
      uploadImage(file);
    }
  });
}

function validateImageFile(file) {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    showAlert(
      "error",
      `ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ (JPG, PNG, WebP)`
    );
    return false;
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    showAlert("error", `ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`);
    return false;
  }

  return true;
}

function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  // Show upload progress
  const progressContainer = showUploadProgress();

  fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      hideUploadProgress(progressContainer);

      if (data.success) {
        addImageToPreview(data.image);
        showAlert("success", "อัปโหลดรูปภาพสำเร็จ");
      } else {
        showAlert("error", data.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    })
    .catch((error) => {
      console.error("Upload error:", error);
      hideUploadProgress(progressContainer);
      showAlert("error", "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    });
}

function showUploadProgress() {
  const progressHtml = `
    <div class="upload-progress">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="text-muted">กำลังอัปโหลด...</span>
        <span class="text-muted">0%</span>
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
      </div>
    </div>
  `;

  const uploadArea = document.querySelector(".image-upload-area");
  uploadArea.insertAdjacentHTML("beforeend", progressHtml);

  return uploadArea.querySelector(".upload-progress");
}

function hideUploadProgress(progressContainer) {
  if (progressContainer) {
    progressContainer.remove();
  }
}

function addImageToPreview(imageData) {
  uploadedImages.push(imageData);
  renderImagePreviews();
}

function renderImagePreviews() {
  const container = document.querySelector(".image-preview-container");
  if (!container) return;

  container.innerHTML = "";

  uploadedImages.forEach((image, index) => {
    const imageHtml = `
      <div class="image-preview-item ${
        index === featuredImageIndex ? "featured" : ""
      }" data-index="${index}">
        <img src="${image.url}" alt="${image.alt || ""}" />
        ${
          index === featuredImageIndex
            ? '<div class="featured-badge">รูปเด่น</div>'
            : ""
        }
        <div class="image-preview-overlay">
          <div class="image-preview-controls">
            <button type="button" class="btn btn-sm btn-warning" onclick="setFeaturedImage(${index})" title="ตั้งเป็นรูปเด่น">
              <i class="fas fa-star"></i>
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeImage(${index})" title="ลบรูปภาพ">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", imageHtml);
  });

  // Update hidden input with image data
  updateImageInput();
}

function setFeaturedImage(index) {
  featuredImageIndex = index;
  renderImagePreviews();
  showAlert("success", "ตั้งรูปเด่นเรียบร้อยแล้ว");
}

function removeImage(index) {
  const image = uploadedImages[index];

  // Remove from server if it's already uploaded
  if (image.id) {
    fetch(`/api/images/${image.id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showAlert("success", "ลบรูปภาพเรียบร้อยแล้ว");
        }
      })
      .catch((error) => {
        console.error("Error deleting image:", error);
      });
  }

  // Remove from array
  uploadedImages.splice(index, 1);

  // Adjust featured image index
  if (featuredImageIndex === index) {
    featuredImageIndex = -1;
  } else if (featuredImageIndex > index) {
    featuredImageIndex--;
  }

  renderImagePreviews();
}

function initializeImageSorting() {
  const container = document.querySelector(".image-preview-container");
  if (!container) return;

  // Initialize sortable if jQuery UI is available
  if (typeof $ !== "undefined" && $.fn.sortable) {
    $(container).sortable({
      items: ".image-preview-item",
      cursor: "move",
      opacity: 0.8,
      update: function (event, ui) {
        updateImageOrder();
      },
    });
  }
}

function updateImageOrder() {
  const items = document.querySelectorAll(".image-preview-item");
  const newOrder = [];

  items.forEach((item) => {
    const index = parseInt(item.dataset.index);
    newOrder.push(uploadedImages[index]);
  });

  uploadedImages = newOrder;

  // Re-render with new order
  renderImagePreviews();

  showAlert("success", "เรียงลำดับรูปภาพเรียบร้อยแล้ว");
}

function updateImageInput() {
  const imageInput = document.querySelector('input[name="images"]');
  if (imageInput) {
    imageInput.value = JSON.stringify({
      images: uploadedImages,
      featured: featuredImageIndex,
    });
  }
}

function loadExistingImages() {
  const imageInput = document.querySelector('input[name="images"]');
  if (!imageInput || !imageInput.value) return;

  try {
    const imageData = JSON.parse(imageInput.value);
    uploadedImages = imageData.images || [];
    featuredImageIndex = imageData.featured || -1;
    renderImagePreviews();
  } catch (error) {
    console.error("Error loading existing images:", error);
  }
}

// ===== UTILITY FUNCTIONS =====

// Copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showAlert("success", "คัดลอกไปยังคลิปบอร์ดแล้ว");
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showAlert("success", "คัดลอกไปยังคลิปบอร์ดแล้ว");
  }
}

// Format number with Thai locale
function formatNumber(number) {
  return new Intl.NumberFormat("th-TH").format(number);
}

// Format date with Thai locale
function formatDate(date) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Truncate text with ellipsis
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Export functions for global access
window.AdminJS = {
  switchLanguage,
  getMultiLanguageFormData,
  setFeaturedImage,
  removeImage,
  copyToClipboard,
  formatNumber,
  formatDate,
  truncateText,
  showAlert,
  validateForm,
};
