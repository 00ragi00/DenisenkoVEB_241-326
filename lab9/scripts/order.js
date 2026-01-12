// API URL и ключ (замените на свой ключ!)
const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
const API_KEY = '56c7b530-8c3b-4659-a1ad-ff51387307b3';

let dishes = [];
let selectedDishes = {
    soup: null,
    main: null,
    salad_starter: null,
    drink: null,
    dessert: null
};

const categoryNames = {
    soup: 'Суп',
    main: 'Главное блюдо',
    salad_starter: 'Салат/стартер',
    drink: 'Напиток',
    dessert: 'Десерт'
};

// Загрузка блюд из API
async function loadDishes() {
    try {
        const response = await fetch(`${API_URL}/dishes`);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        const data = await response.json();
        
        dishes = data.map(dish => ({
            id: dish.id,
            keyword: dish.keyword,
            name: dish.name,
            price: dish.price,
            category: dish.category === 'main-course' ? 'main' : dish.category === 'salad' ? 'salad_starter' : dish.category,
            count: dish.count,
            image: dish.image,
            kind: dish.kind
        }));
        
        console.log('Блюда успешно загружены:', dishes.length);
    } catch (error) {
        console.error('Ошибка при загрузке блюд:', error);
        alert('Не удалось загрузить данные о блюдах');
    }
}

// Загрузка заказа из localStorage
function loadOrderFromLocalStorage() {
    const savedOrder = localStorage.getItem('selectedDishes');
    if (savedOrder) {
        try {
            const dishIds = JSON.parse(savedOrder);
            for (let category in dishIds) {
                if (dishIds[category]) {
                    const dish = dishes.find(d => d.id === dishIds[category]);
                    if (dish) {
                        selectedDishes[category] = dish;
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке заказа из localStorage:', error);
        }
    }
}

// Отображение блюд в разделе "Состав заказа"
function displayOrderDishes() {
    const container = document.getElementById('order-dishes-container');
    const hasSelection = Object.values(selectedDishes).some(dish => dish !== null);
    
    if (!hasSelection) {
        container.innerHTML = `
            <p class="empty-order">
                Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу 
                <a href="lunch.html" style="color: tomato; text-decoration: none;">Собрать ланч</a>.
            </p>
        `;
        return;
    }
    
    container.innerHTML = '';
    const dishesGrid = document.createElement('div');
    dishesGrid.className = 'menu-grid';
    dishesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    
    for (let category in selectedDishes) {
        const dish = selectedDishes[category];
        if (dish) {
            const dishCard = createDishCard(dish);
            dishesGrid.appendChild(dishCard);
        }
    }
    
    container.appendChild(dishesGrid);
}

// Создание карточки блюда с кнопкой "Удалить"
function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.style.border = '2px solid tomato';
    
    card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <div class="menu-price">${dish.price}₽</div>
        <div class="menu-name">${dish.name}</div>
        <div class="menu-weight">${dish.count}</div>
        <button class="remove-btn" data-category="${dish.category}">Удалить</button>
    `;
    
    const button = card.querySelector('.remove-btn');
    button.addEventListener('click', () => removeDish(dish.category));
    
    return card;
}

// Удаление блюда из заказа
function removeDish(category) {
    selectedDishes[category] = null;
    saveOrderToLocalStorage();
    displayOrderDishes();
    updateOrderSummary();
}

// Сохранение заказа в localStorage
function saveOrderToLocalStorage() {
    const dishIds = {};
    for (let category in selectedDishes) {
        dishIds[category] = selectedDishes[category] ? selectedDishes[category].id : null;
    }
    localStorage.setItem('selectedDishes', JSON.stringify(dishIds));
}

// Обновление сводки заказа в форме
function updateOrderSummary() {
    const orderDisplay = document.getElementById('order-display');
    const hasSelection = Object.values(selectedDishes).some(dish => dish !== null);
    
    if (!hasSelection) {
        orderDisplay.innerHTML = '<p class="empty-order">Ничего не выбрано</p>';
        return;
    }
    
    let orderHTML = '';
    let totalPrice = 0;
    
    for (let category in selectedDishes) {
        const dish = selectedDishes[category];
        orderHTML += `
            <div class="order-category">
                <div class="category-title">${categoryNames[category]}</div>
        `;
        
        if (dish) {
            orderHTML += `
                <div class="order-item">${dish.name} - ${dish.price}₽</div>
            `;
            totalPrice += dish.price;
        } else {
            const notSelectedText = category === 'main' ? 'Не выбрано' : 'Не выбран';
            orderHTML += `
                <div class="order-item-empty">${notSelectedText}</div>
            `;
        }
        
        orderHTML += '</div>';
    }
    
    orderHTML += `
        <div class="order-total">
            <p>Стоимость заказа</p>
            <p class="total-amount">${totalPrice}₽</p>
        </div>
    `;
    
    orderDisplay.innerHTML = orderHTML;
}

// Валидация комбо
function validateCombo() {
    const { soup, main, salad_starter, drink, dessert } = selectedDishes;
    
    const validCombos = [
        () => soup && main && salad_starter && drink,
        () => soup && main && drink,
        () => soup && salad_starter && drink,
        () => main && drink,
        () => main && salad_starter && drink
    ];
    
    return validCombos.some(combo => combo());
}

// Настройка формы
function setupForm() {
    const form = document.getElementById('order-form');
    const deliveryTypeInputs = document.querySelectorAll('input[name="delivery_type"]');
    const deliveryTimeGroup = document.getElementById('delivery-time-group');
    const deliveryTimeInput = document.getElementById('delivery_time');
    const resetButton = document.querySelector('.btn-reset');
    
    // Показ/скрытие поля времени доставки
    deliveryTypeInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.value === 'by_time') {
                deliveryTimeGroup.style.display = 'block';
                deliveryTimeInput.required = true;
            } else {
                deliveryTimeGroup.style.display = 'none';
                deliveryTimeInput.required = false;
            }
        });
    });
    
    // Сброс формы
    resetButton.addEventListener('click', () => {
        form.reset();
        deliveryTimeGroup.style.display = 'none';
        deliveryTimeInput.required = false;
    });
    
    // Отправка формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Проверка комбо
        if (!validateCombo()) {
            alert('Пожалуйста, выберите блюда согласно одному из доступных комбо.');
            return;
        }
        
        // Проверка наличия напитка (обязателен)
        if (!selectedDishes.drink) {
            alert('Напиток обязателен для заказа.');
            return;
        }
        
        // Проверка времени доставки
        const deliveryType = document.querySelector('input[name="delivery_type"]:checked').value;
        if (deliveryType === 'by_time') {
            const deliveryTime = deliveryTimeInput.value;
            if (!deliveryTime) {
                alert('Пожалуйста, укажите время доставки.');
                return;
            }
            
            // Проверка что время не раньше текущего
            const now = new Date();
            const selectedTime = new Date();
            const [hours, minutes] = deliveryTime.split(':');
            selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            if (selectedTime < now) {
                alert('Время доставки не может быть раньше текущего времени.');
                return;
            }
        }
        
        // Сборка данных заказа
        const formData = new FormData(form);
        const orderData = {
            full_name: formData.get('full_name'),
            email: formData.get('email'),
            subscribe: formData.get('subscribe') ? 1 : 0,
            phone: formData.get('phone'),
            delivery_address: formData.get('delivery_address'),
            delivery_type: formData.get('delivery_type'),
            comment: formData.get('comment') || '',
            drink_id: selectedDishes.drink.id
        };
        
        // Добавляем время доставки если указано
        if (orderData.delivery_type === 'by_time') {
            orderData.delivery_time = formData.get('delivery_time');
        }
        
        // Добавляем необязательные блюда если выбраны
        if (selectedDishes.soup) orderData.soup_id = selectedDishes.soup.id;
        if (selectedDishes.main) orderData.main_course_id = selectedDishes.main.id;
        if (selectedDishes.salad_starter) orderData.salad_id = selectedDishes.salad_starter.id;
        if (selectedDishes.dessert) orderData.dessert_id = selectedDishes.dessert.id;
        
        // Отправка заказа
        try {
            const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Ошибка ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Заказ успешно создан:', result);
            
            localStorage.removeItem('selectedDishes');
            alert('Заказ успешно оформлен! Спасибо за заказ.');
            
            window.location.href = 'orders.html';
            
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);
            alert(`Ошибка при оформлении заказа: ${error.message}`);
        }
    });
}

async function init() {
    await loadDishes();
    loadOrderFromLocalStorage();
    displayOrderDishes();
    updateOrderSummary();
    setupForm();
}

document.addEventListener('DOMContentLoaded', init);
