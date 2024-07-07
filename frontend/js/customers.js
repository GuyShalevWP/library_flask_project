const SERVER = 'http://localhost:7000';
const token = localStorage.getItem('token');
const user = sessionStorage.getItem('user');
const role = user ? JSON.parse(user).role : null;

let currentUserId = null;
let currentUserActiveStatus = null;

const showMessage = (msg, type) => {
    const message = document.getElementById('message');
    if (message) {
        message.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    } else {
        console.error('Message element not found');
    }
};

const fetchCustomers = async () => {
    try {
        const response = await axios.get(`${SERVER}/users`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const customers = response.data;
        renderCustomers(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
    }
};

const renderCustomers = (customers) => {
    const searchInput = document
        .getElementById('searchInput')
        .value.toLowerCase();
    const searchCriteria = document.getElementById('searchCriteria').value;
    const roleFilter = document.getElementById('roleFilter').value;
    const activeFilter = document.getElementById('activeFilter').value;

    const filteredCustomers = customers.filter((customer) => {
        let matchesSearch = true;
        if (searchInput) {
            if (searchCriteria === 'all') {
                matchesSearch =
                    customer.id.toString().includes(searchInput) ||
                    customer.first_name.toLowerCase().includes(searchInput) ||
                    customer.last_name.toLowerCase().includes(searchInput) ||
                    customer.email.toLowerCase().includes(searchInput) ||
                    customer.phone.toLowerCase().includes(searchInput);
            } else {
                matchesSearch = customer[searchCriteria]
                    .toString()
                    .toLowerCase()
                    .includes(searchInput);
            }
        }

        if (roleFilter && customer.role !== roleFilter) {
            return false;
        }

        if (activeFilter) {
            const isActive = activeFilter === 'active';
            if (customer.is_active !== isActive) {
                return false;
            }
        }

        return matchesSearch;
    });

    customersTable.innerHTML = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredCustomers
                    .map(
                        (customer) => `
                    <tr ${
                        !customer.is_active
                            ? 'style="text-decoration: line-through; color:gray;"'
                            : ''
                    }>
                        <td>${customer.id}</td>
                        <td>${customer.email}</td>
                        <td>${customer.first_name}</td>
                        <td>${customer.last_name}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.role}</td>
                        <td>${customer.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick='showEditModal(${JSON.stringify(
                                customer
                            )})'>Edit</button>
                        </td>
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
    `;
};

const showEditModal = (customer) => {
    currentUserId = customer.id;
    currentUserActiveStatus = customer.is_active;
    document.getElementById('editUserId').value = customer.id;
    document.getElementById('editFirstName').value = customer.first_name;
    document.getElementById('editLastName').value = customer.last_name;
    document.getElementById('editPhone').value = customer.phone;
    document.getElementById('toggleActiveButton').innerText = customer.is_active
        ? 'Deactivate'
        : 'Activate';
    const editUserModal = new bootstrap.Modal(
        document.getElementById('editUserModal')
    );
    editUserModal.show();
};

const toggleUserActive = async () => {
    try {
        const response = await axios.put(
            `${SERVER}/user/${currentUserId}/set_active`,
            { is_active: !currentUserActiveStatus },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            const editUserModal = bootstrap.Modal.getInstance(
                document.getElementById('editUserModal')
            );
            editUserModal.hide();
            showMessage('User status updated successfully', 'success');
            fetchCustomers();
        } else {
            showMessage('Failed to update user status', 'danger');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showMessage('Error updating user status', 'danger');
    }
};

const updateUser = async () => {
    const id = document.getElementById('editUserId').value;
    const firstName = document.getElementById('editFirstName').value;
    const lastName = document.getElementById('editLastName').value;
    const phone = document.getElementById('editPhone').value;

    try {
        const response = await axios.put(
            `${SERVER}/user/${id}/details`,
            {
                first_name: firstName,
                last_name: lastName,
                phone: phone,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (response.status === 200) {
            const editUserModal = bootstrap.Modal.getInstance(
                document.getElementById('editUserModal')
            );
            editUserModal.hide();
            showMessage('User updated successfully', 'success');
            fetchCustomers();
        } else {
            showMessage('Failed to update user', 'danger');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showMessage('Error updating user', 'danger');
    }
};

const initializePage = () => {
    fetchCustomers();

    document
        .getElementById('searchInput')
        .addEventListener('input', fetchCustomers);
    document
        .getElementById('searchCriteria')
        .addEventListener('change', fetchCustomers);
    document
        .getElementById('roleFilter')
        .addEventListener('change', fetchCustomers);
    document
        .getElementById('activeFilter')
        .addEventListener('change', fetchCustomers);
};

document.addEventListener('DOMContentLoaded', () => {
    if (!token && role !== 'admin') {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    initializePage();
});
