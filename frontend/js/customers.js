document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');

    const searchCriteria = document.getElementById('searchCriteria');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const activeFilter = document.getElementById('activeFilter');
    const customersTable = document.getElementById('customersTable');
    const editUserForm = document.getElementById('editUserForm');
    let currentUserId = null;
    let currentUserActiveStatus = null;

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
        const filteredCustomers = customers.filter((customer) => {
            const searchValue = searchInput.value.toLowerCase();
            const criteria = searchCriteria.value;

            if (criteria !== 'all' && searchValue) {
                return customer[criteria]
                    .toString()
                    .toLowerCase()
                    .includes(searchValue);
            }

            if (roleFilter.value && customer.role !== roleFilter.value) {
                return false;
            }

            if (activeFilter.value) {
                const isActive = activeFilter.value === 'active';
                if (customer.is_active !== isActive) {
                    return false;
                }
            }

            return true;
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
                        <tr>
                            <td>${customer.id}</td>
                            <td>${customer.email}</td>
                            <td>${customer.first_name}</td>
                            <td>${customer.last_name}</td>
                            <td>${customer.phone}</td>
                            <td>${customer.role}</td>
                            <td>${
                                customer.is_active ? 'Active' : 'Inactive'
                            }</td>
                            <td>
                                <button class="btn btn-primary" onclick="showEditModal(${
                                    customer.id
                                }, '${customer.first_name}', '${
                                customer.last_name
                            }', '${customer.phone}', ${
                                customer.is_active
                            })">Edit</button>
                            </td>
                        </tr>
                    `
                        )
                        .join('')}
                </tbody>
            </table>
        `;
    };

    window.showEditModal = (id, firstName, lastName, phone, isActive) => {
        currentUserId = id;
        currentUserActiveStatus = isActive;
        document.getElementById('editUserId').value = id;
        document.getElementById('editFirstName').value = firstName;
        document.getElementById('editLastName').value = lastName;
        document.getElementById('editPhone').value = phone;
        document.getElementById('toggleActiveButton').innerText = isActive
            ? 'Deactivate'
            : 'Activate';
        $('#editUserModal').modal('show');
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
                $('#editUserModal').modal('hide');
                fetchCustomers();
            } else {
                console.error('Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    window.toggleUserActive = toggleUserActive;

    editUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
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
                $('#editUserModal').modal('hide');
                fetchCustomers();
            } else {
                console.error('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    });

    searchInput.addEventListener('input', fetchCustomers);
    searchCriteria.addEventListener('change', fetchCustomers);
    roleFilter.addEventListener('change', fetchCustomers);
    activeFilter.addEventListener('change', fetchCustomers);

    fetchCustomers();
});
