/*
  script.js - Simple JavaScript for Smart Library Management System
  Easy to understand beginner code.
*/

document.addEventListener("DOMContentLoaded", function () {
  console.log("Smart Library Management System Loaded Successfully.");

  // 1. Auto-hide alerts after 5 seconds
  const alerts = document.querySelectorAll(".alert");
  if (alerts.length > 0) {
    setTimeout(function () {
      alerts.forEach(function (alert) {
        alert.style.transition = "opacity 0.5s ease";
        alert.style.opacity = "0";
        setTimeout(function () {
          alert.remove();
        }, 500);
      });
    }, 5000);
  }
});

// 2. Simple confirmation prompt before deleting a book
function confirmDelete(bookTitle) {
  return confirm("Are you sure you want to delete the book: '" + bookTitle + "'?");
}

// 3. Simple confirmation prompt before returning a book
function confirmReturn(bookTitle) {
  return confirm("Confirm return for: '" + bookTitle + "'?");
}
