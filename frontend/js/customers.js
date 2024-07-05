document.addEventListener('DOMContentLoaded', () => {
    const SERVER = 'http://localhost:7000';
    const token = localStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    const role = user ? JSON.parse(user).role : null;

    // Check if the token exists, if not redirect to sign-in
    if (!token && role !== 'admin') {
        window.location.href = '../signin_register/signin.html';
        return;
    }

    const searchCriteria = document.getElementById('searchCriteria');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const activeFilter = document.getElementById('activeFilter');
    const customersTable = document.getElementById('customersTable');
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

    window.showEditModal = (customer) => {
        currentUserId = customer.id;
        currentUserActiveStatus = customer.is_active;
        document.getElementById('editUserId').value = customer.id;
        document.getElementById('editFirstName').value = customer.first_name;
        document.getElementById('editLastName').value = customer.last_name;
        document.getElementById('editPhone').value = customer.phone;
        document.getElementById('toggleActiveButton').innerText =
            customer.is_active ? 'Deactivate' : 'Activate';
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
                fetchCustomers();
            } else {
                console.error('Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    window.toggleUserActive = toggleUserActive;

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
                fetchCustomers();
            } else {
                console.error('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    window.updateUser = updateUser;

    searchInput.addEventListener('input', fetchCustomers);
    searchCriteria.addEventListener('change', fetchCustomers);
    roleFilter.addEventListener('change', fetchCustomers);
    activeFilter.addEventListener('change', fetchCustomers);

    fetchCustomers();
});
