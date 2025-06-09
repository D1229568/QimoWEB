document.addEventListener('DOMContentLoaded', function() {
    const ownerOption = document.getElementById('owner-option');
    const guestOption = document.getElementById('guest-option');
    const ownerSection = document.getElementById('owner-login-section');
    const guestSection = document.getElementById('guest-login-section');
    const ownerLoginBtn = document.getElementById('owner-login-btn');
    const guestLoginBtn = document.getElementById('guest-login-btn');

    // Initially show owner login
    ownerOption.classList.add('active');
    ownerSection.classList.add('active-section');

    // Toggle between login options
    ownerOption.addEventListener('click', function() {
        ownerOption.classList.add('active');
        guestOption.classList.remove('active');
        ownerSection.classList.add('active-section');
        guestSection.classList.remove('active-section');
    });

    guestOption.addEventListener('click', function() {
        guestOption.classList.add('active');
        ownerOption.classList.remove('active');
        guestSection.classList.add('active-section');
        ownerSection.classList.remove('active-section');
    });

    // Owner login handler
    ownerLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }

        // Call the authentication API
        console.log('Sending owner login request for:', username);

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, type: 'owner' }),
            credentials: 'same-origin' // Include credentials in the request
        })
            .then(response => {
                console.log('Login response status:', response.status);
                if (!response.ok) {
                    return response.json().then(errorData => {
                        console.error('Server error:', errorData);
                        throw new Error(errorData.message || 'Server error');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Login response data:', data);
                if (data.success) {
                    // Store user info in localStorage
                    localStorage.setItem('username', username);
                    localStorage.setItem('userType', 'owner');
                    localStorage.setItem('isOnline', 'on');

                    console.log('Login successful, redirecting...');
                    window.location.href = 'index.html'; // Redirect to index.html
                } else {
                    alert('Invalid username or password');
                }
            })
            .catch(error => {
                console.error('Error during login:', error);
                alert('Login failed. Please try again.');
            });
    });

    // Guest login handler
    guestLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const guestName = document.getElementById('guest-name').value || 'Guest';

        console.log('Sending guest login request for:', guestName);

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: guestName,
                password: 'guest', // Guest password is fixed as 'guest'
                type: 'guest'
            }),
            credentials: 'same-origin'
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Server error');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Store guest info
                    localStorage.setItem('username', guestName);
                    localStorage.setItem('userType', 'guest');

                    console.log('Guest login successful, redirecting...');
                    window.location.href = 'index.html';
                } else {
                    alert('Guest login failed');
                }
            })
            .catch(error => {
                console.error('Error during guest login:', error);
                alert('Guest login failed. Please try again.');
            });
    });
});