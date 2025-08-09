document.addEventListener("DOMContentLoaded", function () {
    // ✅ Signup Form Submission
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent page reload

            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;

            try {
                const response = await fetch("http://localhost:3019/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (data.redirect) {
                    window.location.href = data.redirect; // Redirect to login page
                } else {
                    alert("Signup failed: " + (data.error || "Unknown error"));
                }
            } catch (error) {
                console.error("Error during signup:", error);
                alert("An error occurred during signup. Please try again.");
            }
        });
    }

    // ✅ Login Form Submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent page reload

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const response = await fetch("http://localhost:3019/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the token and username
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    
                    // Redirect to index page
                    window.location.href = '/index.html';
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Error during login");
            }
        });
    }
});
