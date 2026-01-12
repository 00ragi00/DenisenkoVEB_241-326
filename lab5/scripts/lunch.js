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
    salad_starter: 'Салат или стартер',
    drink: 'Напиток',
    dessert: 'Десерт'
};

function sortDishesByCategory() {
    const categories = {
        soup: [],
        main: [],
        salad_starter: [],
        drink: [],
        dessert: []
    };

    dishes.forEach(dish => {
        if (categories[dish.category]) {
            categories[dish.category].push(dish);
        }
    });

    for (let category in categories) {
        categories[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return categories;
}

function displayDishes() {
    const sortedDishes = sortDishesByCategory();

    for (let category in sortedDishes) {
        const container = document.querySelector(`[data-category="${category}"]`);
        if (!container) continue;

        container.innerHTML = '';

        sortedDishes[category].forEach(dish => {
            const dishCard = createDishCard(dish);
            container.appendChild(dishCard);
        });
    }
}

function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.setAttribute('data-dish', dish.keyword);
    card.setAttribute('data-kind', dish.kind);

    card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <p class="menu-price">${dish.price} ₽</p>
        <p class="menu-name">${dish.name}</p>
        <p class="menu-weight">${dish.count}</p>
        <button>Добавить</button>
    `;

    const button = card.querySelector('button');
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDish(dish);
    });

    return card;
}

function selectDish(dish) {
    selectedDishes[dish.category] = dish;
    updateOrderDisplay();
}

function updateOrderDisplay() {
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

        orderHTML += '<div class="order-category">';
        orderHTML += `<p class="category-title">${categoryNames[category]}</p>`;

        if (dish) {
            orderHTML += `<p class="order-item order-item-selected">${dish.name} ${dish.price}₽</p>`;
            totalPrice += dish.price;
        } else {
            orderHTML += `<p class="order-item-empty">Блюдо не выбрано</p>`;
        }

        orderHTML += '</div>';
    }

    if (totalPrice > 0) {
        orderHTML += `
            <div class="order-total">
                <p><strong>Стоимость заказа</strong></p>
                <p class="total-amount">${totalPrice}₽</p>
            </div>
        `;
    }

    orderDisplay.innerHTML = orderHTML;
}

function resetOrder() {
    selectedDishes = {
        soup: null,
        main: null,
        salad_starter: null,
        drink: null,
        dessert: null
    };
    updateOrderDisplay();
}

function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = 'https://httpbin.org/post';
    hiddenForm.target = '_blank'; 

    const addHiddenField = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        hiddenForm.appendChild(input);
    };

    addHiddenField('soup', selectedDishes.soup?.name || 'Не выбрано');
    addHiddenField('soup_price', selectedDishes.soup?.price || 0);
    addHiddenField('main_course', selectedDishes.main?.name || 'Не выбрано');
    addHiddenField('main_course_price', selectedDishes.main?.price || 0);
    addHiddenField('salad_starter', selectedDishes.salad_starter?.name || 'Не выбрано');
    addHiddenField('salad_starter_price', selectedDishes.salad_starter?.price || 0);
    addHiddenField('drink', selectedDishes.drink?.name || 'Не выбрано');
    addHiddenField('drink_price', selectedDishes.drink?.price || 0);
    addHiddenField('dessert', selectedDishes.dessert?.name || 'Не выбрано');
    addHiddenField('dessert_price', selectedDishes.dessert?.price || 0);

    addHiddenField('comment', formData.get('comment') || '');

    addHiddenField('name', formData.get('name'));
    addHiddenField('email', formData.get('email'));
    addHiddenField('phone', formData.get('phone'));
    addHiddenField('address', formData.get('address'));

    addHiddenField('delivery_time', formData.get('delivery-time'));
    addHiddenField('delivery_time_value', formData.get('delivery-time-value') || '');

    addHiddenField('subscribe', formData.get('subscribe') === 'on' ? 'Да' : 'Нет');

    const totalPrice = (selectedDishes.soup?.price || 0) + 
                       (selectedDishes.main?.price || 0) + 
                       (selectedDishes.salad_starter?.price || 0) + 
                       (selectedDishes.drink?.price || 0) + 
                       (selectedDishes.dessert?.price || 0);
    addHiddenField('total_price', totalPrice + '₽');

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();

    document.body.removeChild(hiddenForm);
}

function handleFormReset(e) {
    e.preventDefault();

    resetOrder();

    const form = document.getElementById('order-form');
    if (form) {
        form.reset();
    }

    const commentField = document.getElementById('comment');
    if (commentField) {
        commentField.value = '';
    }
}

function filterDishes(grid, kind) {
    if (kind === 'cheap') {
        // Для фильтра "дешевые" показываем только яблочный сок и черный чай
        grid.querySelectorAll('.menu-item').forEach(item => {
            const dishKeyword = item.dataset.dish;
            item.style.display = (dishKeyword === 'applejuice' || dishKeyword === 'tea') ? 'flex' : 'none';
        });
    } else {
        grid.querySelectorAll('.menu-item').forEach(item => {
            item.style.display = (item.dataset.kind === kind) ? 'flex' : 'none';
        });
    }
}

function showAllDishes(grid) {
    grid.querySelectorAll('.menu-item').forEach(item => {
        item.style.display = 'flex';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displayDishes();
    updateOrderDisplay();

    const form = document.getElementById('order-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    const resetButton = document.querySelector('.btn-reset');
    if (resetButton) {
        resetButton.addEventListener('click', handleFormReset);
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.menu-section');
            const grid = section.querySelector('.menu-grid');
            const kind = btn.dataset.kind;

            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                showAllDishes(grid);
            } else {
                section.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterDishes(grid, kind);
            }
        });
    });
});
