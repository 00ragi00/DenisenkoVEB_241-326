// Переменная для хранения загруженных блюд
let dishes = [];

// Функция загрузки блюд из API
async function loadDishes() {
    try {
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        const data = await response.json();
        
        // Преобразование данных из API в формат приложения
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
        
        console.log('Блюда успешно загружены из API:', dishes.length);
    } catch (error) {
        console.error('Ошибка при загрузке блюд:', error);
        alert('Не удалось загрузить меню. Пожалуйста, обновите страницу.');
    }
}

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

// Загрузка заказа из localStorage
function loadOrderFromLocalStorage() {
    const savedOrder = localStorage.getItem('selectedDishes');
    if (savedOrder) {
        try {
            const dishIds = JSON.parse(savedOrder);
            // Восстанавливаем выбранные блюда по ID
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

// Сохранение заказа в localStorage
function saveOrderToLocalStorage() {
    const dishIds = {};
    for (let category in selectedDishes) {
        dishIds[category] = selectedDishes[category] ? selectedDishes[category].id : null;
    }
    localStorage.setItem('selectedDishes', JSON.stringify(dishIds));
}

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
    
    // Выделяем выбранные блюда
    highlightSelectedDishes();
}

function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.setAttribute('data-dish', dish.keyword);
    card.setAttribute('data-kind', dish.kind);
    
    card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <p class="menu-price">${dish.price}₽</p>
        <p class="menu-name">${dish.name}</p>
        <p class="menu-weight">${dish.count} г</p>
        <button>Добавить</button>
    `;
    
    const button = card.querySelector('button');
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDish(dish);
    });
    
    return card;
}

function highlightSelectedDishes() {
    document.querySelectorAll('.menu-item').forEach(card => {
        card.classList.remove('selected');
        const button = card.querySelector('button');
        button.textContent = 'Добавить';
    });
    
    for (let category in selectedDishes) {
        const dish = selectedDishes[category];
        if (dish) {
            const card = document.querySelector(`[data-dish="${dish.keyword}"]`);
            if (card) {
                card.classList.add('selected');
                const button = card.querySelector('button');
                button.textContent = 'Выбрано';
            }
        }
    }
}

function selectDish(dish) {
    if (selectedDishes[dish.category] && selectedDishes[dish.category].id === dish.id) {

        selectedDishes[dish.category] = null;
    } else {

        selectedDishes[dish.category] = dish;
    }
    
    saveOrderToLocalStorage();
    highlightSelectedDishes();
    updateCheckoutPanel();
}

function updateCheckoutPanel() {
    const panel = document.getElementById('checkout-panel');
    const totalElement = document.getElementById('checkout-total');
    const checkoutLink = document.getElementById('checkout-link');
    
    const hasSelection = Object.values(selectedDishes).some(dish => dish !== null);
    
    if (!hasSelection) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    
    let totalPrice = 0;
    for (let category in selectedDishes) {
        if (selectedDishes[category]) {
            totalPrice += selectedDishes[category].price;
        }
    }
    
    totalElement.textContent = `${totalPrice}₽`;
    
    // Проверка комбо
    const isValidCombo = validateCombo();
    
    if (isValidCombo) {
        checkoutLink.classList.remove('disabled');
        checkoutLink.style.pointerEvents = 'auto';
        checkoutLink.style.opacity = '1';
        checkoutLink.style.backgroundColor = 'tomato';
        checkoutLink.style.color = 'white';
        checkoutLink.style.borderColor = 'tomato';
        checkoutLink.title = '';
    } else {
        checkoutLink.classList.add('disabled');
        checkoutLink.style.pointerEvents = 'none';
        checkoutLink.style.opacity = '1';
        checkoutLink.style.backgroundColor = '#ccc';
        checkoutLink.style.color = '#666';
        checkoutLink.style.borderColor = '#ccc';
        
        // Подсказка пользователю
        if (!selectedDishes.drink) {
            checkoutLink.title = 'Добавьте напиток для оформления заказа';
        } else {
            checkoutLink.title = 'Выберите блюда согласно доступным комбо';
        }
    }
}

function validateCombo() {
    const { soup, main, salad_starter, drink, dessert } = selectedDishes;
    
    // Проверяем доступные комбо
    const validCombos = [
        // Суп + Главное + Салат + Напиток
        () => soup && main && salad_starter && drink,
        // Суп + Главное + Напиток
        () => soup && main && drink,
        // Суп + Салат + Напиток
        () => soup && salad_starter && drink,
        // Главное + Напиток
        () => main && drink,
        // Главное + Салат + Напиток
        () => main && salad_starter && drink,
    ];
    
    return validCombos.some(combo => combo());
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.closest('.menu-section').querySelector('.menu-grid').getAttribute('data-category');
            const kind = button.getAttribute('data-kind');
            
            // Убираем активный класс у всех кнопок в этой категории
            button.closest('.filters').querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Добавляем активный класс к нажатой кнопке
            button.classList.add('active');
            
            // Фильтруем блюда
            filterDishes(category, kind);
        });
    });
}

function filterDishes(category, kind) {
    const container = document.querySelector(`[data-category="${category}"]`);
    const items = container.querySelectorAll('.menu-item');
    
    items.forEach(item => {
        if (kind === 'all' || item.getAttribute('data-kind') === kind) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Инициализация при загрузке страницы
async function init() {
    await loadDishes();
    loadOrderFromLocalStorage();
    displayDishes();
    setupFilters();
    updateCheckoutPanel();
}

document.addEventListener('DOMContentLoaded', init);
