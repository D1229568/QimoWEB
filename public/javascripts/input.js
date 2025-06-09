// Function to check login status and show/hide logout & input links
function checkLoginStatus() {
    const username = localStorage.getItem('username');
    const isOnline = localStorage.getItem('isOnline');

    if (username === 'kenji1' && isOnline === 'on') {
        document.getElementById('logoutLink').style.display = 'inline-block';
        document.getElementById('inputLink').style.display = 'inline-block';
        document.getElementById('loginLink').style.display = 'none';
        document.getElementById('inputForm').style.display = 'block';
        document.getElementById('accessDenied').style.display = 'none';
    } else {
        document.getElementById('logoutLink').style.display = 'none';
        document.getElementById('inputLink').style.display = 'none';
        document.getElementById('loginLink').style.display = 'inline-block';
        document.getElementById('inputForm').style.display = 'none';
        document.getElementById('accessDenied').style.display = 'block';
    }
}

// Format date as YYYY/MM/DD
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// Handle logout
document.getElementById('logoutLink').addEventListener('click', function(e) {
    e.preventDefault();
    handleLogout();
});

async function handleLogout() {
    try {
        const username = localStorage.getItem('username');
        console.log('Attempting to logout user:', username);

        if (!username) {
            console.error('No username found in localStorage');
            alert('No active user session found');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        console.log('Logout response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Logout response data:', data);

            localStorage.removeItem('username');
            localStorage.removeItem('isOnline');
            alert('Successfully logged out');
            window.location.href = 'login.html';
        } else {
            console.error('Logout failed with status:', response.status);
            // Even if the server request fails, we should clear the local session
            localStorage.removeItem('username');
            localStorage.removeItem('isOnline');
            alert('Logout processing encountered an issue, but your local session has been cleared');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Even if there's an error, clear the local session
        localStorage.removeItem('username');
        localStorage.removeItem('isOnline');
        alert('Error during logout, but your local session has been cleared');
        window.location.href = 'login.html';
    }
}

// Handle form submission
document.getElementById('cpiPriceForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const date = formatDate(document.getElementById('date').value);
    const product_name = document.getElementById('product_name').value;
    const price = parseFloat(document.getElementById('price').value);

    // Debug log to check the data being sent
    console.log('Submitting data:', { date, product_name, price });

    fetch('/api/cpi-prices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, product_name, price })
    })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const messageDiv = document.getElementById('message');
            messageDiv.classList.remove('hidden', 'success', 'error');

            if (data.success) {
                messageDiv.textContent = 'Record added successfully!';
                messageDiv.classList.add('success');
                document.getElementById('cpiPriceForm').reset();

                // Set today's date as default again after form reset
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                document.getElementById('date').value = `${year}-${month}-${day}`;

                // Success message will remain visible instead of redirecting
            } else {
                messageDiv.textContent = data.error || 'Failed to add record.';
                messageDiv.classList.add('error');
            }

            // Clear message after 3 seconds
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 3000);
        })
        .catch(error => {
            console.error('Error:', error);
            const messageDiv = document.getElementById('message');
            messageDiv.classList.remove('hidden', 'success', 'error');
            messageDiv.textContent = `An error occurred: ${error.message}. Please try again.`;
            messageDiv.classList.add('error');
        });
});

// Check login status when page loads
window.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();

    // Set today's date as default
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('date').value = `${year}-${month}-${day}`;
});