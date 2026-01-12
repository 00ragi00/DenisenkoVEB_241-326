const API_URL = 'https://edu.std-900.ist.mospolytech.ru';   // или http://lab8-api.std-900.ist.mospolytech.ru
const API_KEY = '56c7b530-8c3b-4659-a1ad-ff51387307b3';                              // вставьте свой ключ

let allDishes = [];
let currentOrderId = null;

// ================== ЗАГРУЗКА БЛЮД ==================
async function loadDishes() {
    try {
        const response = await fetch(`${API_URL}/labs/api/dishes`);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки блюд: ${response.status}`);
        }
        allDishes = await response.json();
    } catch (error) {
        console.error(error);
        showNotification('Не удалось загрузить список блюд', 'error');
    }
}

// ================== ЗАГРУЗКА ЗАКАЗОВ ==================
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/labs/api/orders?api_key=${API_KEY}`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Ошибка загрузки заказов: ${response.status}`);
        }

        const orders = await response.json();
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        displayOrders(orders);
    } catch (error) {
        showNotification('Ошибка загрузки заказов: ' + error.message, 'error');
        document.getElementById('orders-table-body').innerHTML =
            '<tr><td colspan="6" class="loading">Ошибка загрузки заказов</td></tr>';
    }
}

// ================== ОТОБРАЖЕНИЕ ЗАКАЗОВ ==================
function displayOrders(orders) {
    const tbody = document.getElementById('orders-table-body');

    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">У вас пока нет заказов</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map((order, index) => {
        const composition = getOrderComposition(order);
        const cost = calculateOrderCost(order);
        const deliveryTime = order.delivery_type === 'now'
            ? 'Как можно скорее (с 07:00 до 23:00)'
            : order.delivery_time;

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>${composition}</td>
                <td>${cost}₽</td>
                <td>${deliveryTime}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="Подробнее" onclick="viewOrder(${order.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="action-btn edit" title="Редактировать" onclick="editOrder(${order.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" title="Удалить" onclick="confirmDelete(${order.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================
function getOrderComposition(order) {
    const dishes = [];

    if (order.soup_id) {
        const dish = allDishes.find(d => d.id === order.soup_id);
        if (dish) dishes.push(dish.name);
    }
    if (order.main_course_id) {
        const dish = allDishes.find(d => d.id === order.main_course_id);
        if (dish) dishes.push(dish.name);
    }
    if (order.salad_id) {
        const dish = allDishes.find(d => d.id === order.salad_id);
        if (dish) dishes.push(dish.name);
    }
    if (order.drink_id) {
        const dish = allDishes.find(d => d.id === order.drink_id);
        if (dish) dishes.push(dish.name);
    }
    if (order.dessert_id) {
        const dish = allDishes.find(d => d.id === order.dessert_id);
        if (dish) dishes.push(dish.name);
    }

    return dishes.join(', ') || 'Нет блюд';
}

function calculateOrderCost(order) {
    let total = 0;

    [order.soup_id, order.main_course_id, order.salad_id, order.drink_id, order.dessert_id]
        .forEach(id => {
            if (id) {
                const dish = allDishes.find(d => d.id === id);
                if (dish) total += dish.price;
            }
        });

    return total;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// ================== ПРОСМОТР ЗАКАЗА ==================
async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/labs/api/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Ошибка ${response.status}`);
        }

        const order = await response.json();
        const composition = getDetailedComposition(order);
        const cost = calculateOrderCost(order);
        const deliveryTime = order.delivery_type === 'now'
            ? 'Как можно скорее (с 07:00 до 23:00)'
            : order.delivery_time;

        document.getElementById('view-modal-body').innerHTML = `
            <p><strong>Дата оформления:</strong> ${formatDate(order.created_at)}</p>
            <h4>Доставка</h4>
            <p><strong>Имя получателя:</strong> ${order.full_name}</p>
            <p><strong>Адрес доставки:</strong> ${order.delivery_address}</p>
            <p><strong>Время доставки:</strong> ${deliveryTime}</p>
            <p><strong>Телефон:</strong> ${order.phone}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            ${order.comment ? `<h4>Комментарий</h4><p>${order.comment}</p>` : ''}
            <h4>Состав заказа</h4>
            ${composition}
            <p><strong>Стоимость:</strong> ${cost}₽</p>
        `;

        openModal('viewModal');
    } catch (error) {
        showNotification('Ошибка загрузки заказа: ' + error.message, 'error');
    }
}

function getDetailedComposition(order) {
    let html = '';

    const categories = [
        { id: order.soup_id, label: 'Суп' },
        { id: order.main_course_id, label: 'Основное блюдо' },
        { id: order.salad_id, label: 'Салат' },
        { id: order.drink_id, label: 'Напиток' },
        { id: order.dessert_id, label: 'Десерт' }
    ];

    categories.forEach(cat => {
        if (cat.id) {
            const dish = allDishes.find(d => d.id === cat.id);
            if (dish) {
                html += `<p><strong>${cat.label}:</strong> ${dish.name} (${dish.price}₽)</p>`;
            }
        }
    });

    return html || '<p>Нет блюд</p>';
}

// ================== РЕДАКТИРОВАНИЕ ЗАКАЗА ==================
async function editOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/labs/api/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Ошибка ${response.status}`);
        }

        const order = await response.json();
        currentOrderId = orderId;

        document.getElementById('edit-date').textContent = formatDate(order.created_at);
        document.getElementById('edit-full-name').value = order.full_name;
        document.getElementById('edit-address').value = order.delivery_address;
        document.getElementById('edit-time').value = order.delivery_type === 'by_time' ? order.delivery_time : '';
        document.getElementById('edit-phone').value = order.phone;
        document.getElementById('edit-email').value = order.email;
        document.getElementById('edit-comment').value = order.comment || '';

        document.getElementById('edit-composition').innerHTML = getDetailedComposition(order);
        document.getElementById('edit-cost').textContent = calculateOrderCost(order) + '₽';

        openModal('editModal');
    } catch (error) {
        showNotification('Ошибка загрузки заказа: ' + error.message, 'error');
    }
}

async function saveOrder() {
    const formData = {
        full_name: document.getElementById('edit-full-name').value,
        delivery_address: document.getElementById('edit-address').value,
        phone: document.getElementById('edit-phone').value,
        email: document.getElementById('edit-email').value,
        comment: document.getElementById('edit-comment').value
    };

    const timeValue = document.getElementById('edit-time').value;
    if (timeValue) {
        formData.delivery_type = 'by_time';
        formData.delivery_time = timeValue;
    } else {
        formData.delivery_type = 'now';
    }

    try {
        const response = await fetch(`${API_URL}/labs/api/orders/${currentOrderId}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Ошибка ${response.status}`);
        }

        showNotification('Заказ успешно изменён', 'success');
        closeModal('editModal');
        loadOrders();
    } catch (error) {
        showNotification('Ошибка при сохранении заказа: ' + error.message, 'error');
    }
}

// ================== УДАЛЕНИЕ ЗАКАЗА ==================
function confirmDelete(orderId) {
    currentOrderId = orderId;
    openModal('deleteModal');
}

async function deleteOrder() {
    try {
        const response = await fetch(`${API_URL}/labs/api/orders/${currentOrderId}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Ошибка ${response.status}`);
        }

        showNotification('Заказ успешно удалён', 'success');
        closeModal('deleteModal');
        loadOrders();
    } catch (error) {
        showNotification('Ошибка при удалении заказа: ' + error.message, 'error');
    }
}

// ================== МОДАЛКИ И УВЕДОМЛЕНИЯ ==================
function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function showNotification(message, type) {
    const block = document.getElementById('notification');
    block.textContent = message;
    block.className = `notification ${type}`;
    setTimeout(() => block.classList.add('hidden'), 5000);
}

// ================== ИНИЦИАЛИЗАЦИЯ ==================
document.addEventListener('DOMContentLoaded', async () => {
    await loadDishes();
    await loadOrders();

    const saveBtn = document.getElementById('save-edit');
    const delBtn = document.getElementById('confirm-delete');

    if (saveBtn) saveBtn.addEventListener('click', saveOrder);
    if (delBtn) delBtn.addEventListener('click', deleteOrder);

    document.querySelectorAll('.close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
});
