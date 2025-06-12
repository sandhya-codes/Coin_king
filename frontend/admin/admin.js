// Admin login logic
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (email === 'admin@gmail.com' && password === 'admin123') {
      window.location.href = 'admin-dashboard.html';
    } else {
      document.getElementById('message').textContent = 'Invalid admin credentials.';
    }
  });
}

// Admin dashboard fetch users logic
document.getElementById('fetchUsersBtn').addEventListener('click', () => {
  fetch('/admin/users')
    .then(response => response.json())
    .then(users => {
      const userListDiv = document.getElementById('userList');
      const table = document.createElement('table');
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.user_id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
        `;
        table.appendChild(row);
      });
      userListDiv.innerHTML = ''; // Clear before inserting
      userListDiv.appendChild(table);
    })
    .catch(error => {
      console.error('Error fetching users:', error);
      document.getElementById('userList').innerHTML = '<p>Error loading users.</p>';
    });
});


