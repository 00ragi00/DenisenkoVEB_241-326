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
        <p class="menu-price">${dish.price}₽</p>
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

        orderHTML += `
            <div class="order-category">
                <p class="category-title">${categoryNames[category]}</p>
        `;

        if (dish) {
            orderHTML += `
                <p class="order-item">${dish.name} ${dish.price}₽</p>
            `;
            totalPrice += dish.price;
        } else {
            orderHTML += `
                <p class="order-item-empty">Блюдо не выбрано</p>
            `;
        }

        orderHTML += '</div>';
    }

    orderHTML += `
        <div class="order-total">
            <p><strong>Стоимость заказа</strong></p>
            <p class="total-amount">${totalPrice}₽</p>
        </div>
    `;

    orderDisplay.innerHTML = orderHTML;
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const kind = this.getAttribute('data-kind');
            const section = this.closest('.menu-section');
            const categoryContainer = section.querySelector('.menu-grid');
            const category = categoryContainer.getAttribute('data-category');

            const allItems = categoryContainer.querySelectorAll('.menu-item');

            const wasActive = this.classList.contains('active');

            const filtersInSection = section.querySelectorAll('.filter-btn');
            filtersInSection.forEach(btn => btn.classList.remove('active'));

            if (wasActive) {
                allItems.forEach(item => {
                    item.style.display = 'flex';
                });
            } else {
                this.classList.add('active');

                allItems.forEach(item => {
                    const itemKind = item.getAttribute('data-kind');
                    if (itemKind === kind) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }
        });
    });
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


document.addEventListener('DOMContentLoaded', function() {
    displayDishes();
    setupFilters();

    const form = document.getElementById('order-form');
    const resetBtn = form.querySelector('button[type="reset"]');
    

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetOrder();
        });
    }
    

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const hasSoup = selectedDishes.soup !== null;
            const hasMain = selectedDishes.main !== null;
            const hasSalad = selectedDishes.salad_starter !== null;
            const hasDrink = selectedDishes.drink !== null;
            const hasDessert = selectedDishes.dessert !== null;
            

            if (!hasSoup && !hasMain && !hasSalad && !hasDrink && !hasDessert) {
                showNotification('Ничего не выбрано. Выберите блюда для заказа');
                return;
            }
            
  
            const validCombos = [
                { soup: true, main: true, salad: true, drink: true },    
                { soup: true, main: true, drink: true },                  
                { soup: true, salad: true, drink: true },                 
                { main: true, salad: true, drink: true },                
                { main: true, drink: true }                                
            ];
            
            let isValidCombo = false;
            
            for (let combo of validCombos) {
                const matchesSoup = combo.soup ? hasSoup : !hasSoup;
                const matchesMain = combo.main ? hasMain : !hasMain;
                const matchesSalad = combo.salad ? hasSalad : !hasSalad;
                const matchesDrink = combo.drink ? hasDrink : !hasDrink;
                
                if (matchesSoup && matchesMain && matchesSalad && matchesDrink) {
                    isValidCombo = true;
                    break;
                }
            }
            
            if (!isValidCombo) {

                if (!hasDrink && (hasSoup || hasMain || hasSalad)) {
                    showNotification('Выберите напиток');
                } else if (hasSoup && !hasMain && !hasSalad) {
                    showNotification('Выберите главное блюдо/салат/стартер');
                } else if (!hasSoup && !hasMain && hasSalad) {
                    showNotification('Выберите суп или главное блюдо');
                } else if ((hasDrink || hasDessert) && !hasMain && !hasSoup) {
                    showNotification('Выберите главное блюдо');
                } else {
                    showNotification('Выбранная комбинация не соответствует ни одному комбо');
                }
                return;
            }
            
            alert('Заказ успешно оформлен!');
            form.submit(); 
        });
    }
});

function showNotification(message) {

    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    

    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    modal.innerHTML = `
        <h3>${message}</h3>
        <button onclick="closeNotification()">Окей 👌</button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    

    overlay.addEventListener('click', closeNotification);
}


function closeNotification() {
    const overlay = document.querySelector('.notification-overlay');
    const modal = document.querySelector('.notification-modal');
    
    if (overlay) overlay.remove();
    if (modal) modal.remove();
}
