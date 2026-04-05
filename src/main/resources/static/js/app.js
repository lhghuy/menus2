// Global variables
let currentCustomer = null;
let currentOrder = null;
let orderBeingViewed = null;  // Store order being viewed for payment
let currentOrderDetailId = null;  // Store order ID for payment from detail modal
let cart = [];
let currentDishDetail = null;
let selectedSize = { name: 'S', price: 169000 };
let selectedToppings = [];
let selectedOptions = [];
let trackingRefreshInterval = null;  // Track refreshing interval for order tracking
const API_URL = 'http://localhost:8080/api';

// Register Customer
async function registerCustomer() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const tableNumber = document.getElementById('tableNumber').value;

    if (!name || !phone) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/customers/register?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&tableNumber=${encodeURIComponent(tableNumber)}`, {
            method: 'POST'
        });

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    currentCustomer = JSON.parse(text);
                    createOrder();
                    showSection('menuSection');
                    loadDishes();
                } catch (e) {
                    console.error('Parse error:', e);
                    alert('Lỗi xử lý dữ liệu');
                }
            } else {
                alert('Lỗi: Không nhận được phản hồi từ server');
            }
        } else {
            alert('Đăng ký thất bại');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối');
    }
}

// Create new order
async function createOrder() {
    try {
        const response = await fetch(`${API_URL}/orders?customerId=${currentCustomer.id}`, {
            method: 'POST'
        });

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    currentOrder = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse create order response:', e);
                    currentOrder = { id: Math.random(), items: [] };
                }
            }
            cart = [];
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load dishes
async function loadDishes() {
    try {
        const response = await fetch(`${API_URL}/dishes/available`);
        if (response.ok) {
            const text = await response.text();
            let dishes = [];
            if (text) {
                try {
                    dishes = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse dishes:', e);
                }
            }
            displayDishes(dishes);
        }
    } catch (error) {
        console.error('Error:', error);
        displayDishes([]);
    }
}

// Display dishes
function displayDishes(dishes) {
    const container = document.getElementById('dishesContainer');
    container.innerHTML = '';

    if (dishes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Không có món ăn nào</p>';
        return;
    }

    dishes.forEach(dish => {
        if (!dish || !dish.id || !dish.name || !dish.price) {
            console.warn('Skipping invalid dish:', dish);
            return;
        }

        const card = document.createElement('div');
        card.className = 'dish-card';
        card.style.cursor = 'pointer';
        card.onclick = (e) => {
            try {
                console.log('Card clicked, opening dish detail for:', dish.name);
                // Prevent event from bubbling if it's from a child element
                if (e.target.closest('.quantity-input, .add-to-cart-btn')) {
                    console.log('Click is from input/button, stopping propagation');
                    return;
                }
                openDishDetail(dish);
            } catch (err) {
                console.error('Error opening dish detail:', err);
                alert('Lỗi: ' + err.message);
            }
        };
        
        // Generate image HTML - use actual image if available, fallback to emoji
        let imageHTML = '<div class="dish-image">🍕</div>';
        if (dish.imageUrl && dish.imageUrl.trim()) {
            imageHTML = `<div class="dish-image"><img src="${dish.imageUrl}" alt="${dish.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML='🍕';"></div>`;
        }
        
        card.innerHTML = `
            ${imageHTML}
            <div class="dish-info">
                <div class="dish-name">${dish.name}</div>
                <div class="dish-description">${dish.description || 'Món ăn ngon lạc miệng'}</div>
                <div class="dish-price">${dish.price.toLocaleString('vi-VN')}đ</div>
                <div class="dish-actions">
                    <input type="number" class="quantity-input" id="qty-${dish.id}" value="1" min="1" max="10" onclick="event.stopPropagation();">
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${dish.id}, '${dish.name}', ${dish.price})">+</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Add to cart
async function addToCart(dishId, dishName, dishPrice) {
    const quantity = parseInt(document.getElementById(`qty-${dishId}`).value) || 1;

    try {
        const response = await fetch(
            `${API_URL}/orders/${currentOrder.id}/items?dishId=${dishId}&quantity=${quantity}`,
            {method: 'POST'}
        );

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    currentOrder = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse add to cart response:', e);
                }
            }
            updateCartCount();
            alert(`Đã thêm ${dishName} vào giỏ hàng`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi thêm vào giỏ hàng');
    }
}

// Update cart count
function updateCartCount() {
    const count = currentOrder?.items?.length || 0;
    document.getElementById('cartCount').textContent = count;
}

// Open cart
function openCart() {
    updateCartCount();
    displayCartItems();
    document.getElementById('cartModal').classList.add('active');
}

// Close cart
function closeCart() {
    document.getElementById('cartModal').classList.remove('active');
}

// Display cart items
function displayCartItems() {
    const container = document.getElementById('cartItems');
    container.innerHTML = '';

    if (!currentOrder?.items || currentOrder.items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Giỏ hàng trống</p>';
        return;
    }

    currentOrder.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.dishName}</div>
                <div class="cart-item-price">Số lượng: ${item.quantity}</div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Xóa</button>
            </div>
        `;
        container.appendChild(cartItem);
    });

    // Update total price
    const total = currentOrder.totalPrice || 0;
    document.getElementById('totalPrice').textContent = total.toLocaleString('vi-VN') + ' đ';
}

// Remove from cart
async function removeFromCart(itemId) {
    if (!itemId || !currentOrder?.id) {
        console.error('Invalid parameters:', { itemId, orderId: currentOrder?.id });
        alert('Lỗi: Không thể xóa. Vui lòng thử lại');
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/orders/${currentOrder.id}/items/${itemId}`,
            {method: 'DELETE'}
        );

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    const updatedOrder = JSON.parse(text);
                    if (updatedOrder && updatedOrder.id) {
                        currentOrder = updatedOrder;
                    } else {
                        console.warn('Invalid order response after delete:', updatedOrder);
                    }
                } catch (e) {
                    console.warn('Could not parse remove from cart response:', e);
                    // Reload order to get latest state
                    if (currentOrder?.id) {
                        const reloadResponse = await fetch(`${API_URL}/orders/${currentOrder.id}`);
                        if (reloadResponse.ok) {
                            const reloadText = await reloadResponse.text();
                            if (reloadText) {
                                try {
                                    currentOrder = JSON.parse(reloadText);
                                } catch (e) {
                                    console.warn('Could not reload order:', e);
                                }
                            }
                        }
                    }
                }
            }
            displayCartItems();
            updateCartCount();
            alert('Đã xóa khỏi giỏ hàng');
        } else {
            console.error('Delete failed with status:', response.status);
            alert('Lỗi: Không thể xóa món. Vui lòng thử lại');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        alert('Lỗi khi xóa: ' + error.message);
    }
}

// Confirm order
async function confirmOrder() {
    if (!currentOrder?.items || currentOrder.items.length === 0) {
        alert('Giỏ hàng trống');
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/orders/${currentOrder.id}/confirm`,
            {method: 'POST'}
        );

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    currentOrder = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse JSON response:', e);
                }
            }
            closeCart();
            
            // Show success message
            alert('✅ Đơn hàng đã được xác nhận! Bạn có thể theo dõi đơn hàng tại mục "THEO DÕI ĐƠN"');
            
            // Create a new order for the customer's next purchase
            await createOrder();
            
            // Navigate to order tracking
            loadOrderTracking();
            showSection('orderTrackingSection');
        } else {
            alert('Lỗi: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('Lỗi khi xác nhận đơn hàng');
    }
}

// Load confirmed orders
async function loadConfirmedOrders() {
    try {
        const response = await fetch(`${API_URL}/orders/customer/${currentCustomer.id}`);
        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    const orders = JSON.parse(text);
                    displayConfirmedOrders(orders);
                } catch (e) {
                    console.warn('Could not parse JSON:', e);
                    displayConfirmedOrders([]);
                }
            } else {
                displayConfirmedOrders([]);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        displayConfirmedOrders([]);
    }
}

// Display confirmed orders
function displayConfirmedOrders(orders) {
    const container = document.getElementById('confirmedOrders');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Không có đơn hàng nào</p>';
        return;
    }

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        const itemsList = order.items.map(item => `
            <div class="order-item">${item.dishName} x${item.quantity}</div>
        `).join('');

        const statusColor = {
            'PENDING': '#FFA500',
            'CONFIRMED': '#4CAF50',
            'PREPARING': '#2196F3',
            'READY': '#FF6B35',
            'PAID': '#4CAF50',
            'COMPLETED': '#8B7355'
        };

        orderCard.innerHTML = `
            <div class="order-header">Đơn hàng #${order.id}</div>
            <div class="order-items">${itemsList}</div>
            <div class="order-total">Tổng: ${order.totalPrice?.toLocaleString('vi-VN') || 0}đ</div>
            <div class="order-status" style="background: ${statusColor[order.status] || '#999'};">
                ${getStatusText(order.status)}
            </div>
            ${order.status === 'READY' ? `<button class="view-bill-btn" onclick="viewBill(${order.id})">Xem hóa đơn</button>` : ''}
        `;
        container.appendChild(orderCard);
    });
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng',
        'PAID': 'Đã thanh toán',
        'COMPLETED': 'Hoàn thành'
    };
    return statusMap[status] || status;
}

// View bill
async function viewBill(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    const order = JSON.parse(text);
                    orderBeingViewed = order;  // Store the order being viewed
                    displayBill(order);
                    showSection('paymentSection');
                } catch (e) {
                    console.warn('Could not parse bill JSON:', e);
                    alert('Lỗi khi tải hóa đơn');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi tải hóa đơn');
    }
}

// Display bill in receipt format (Figma design)
function displayBill(order) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toLocaleTimeString('vi-VN');

    // Populate bill header info
    document.getElementById('billDate').textContent = dateStr;
    document.getElementById('billTime').textContent = timeStr;
    document.getElementById('billOrderId').textContent = `AB${order.id}`;
    
    // Populate customer information
    document.getElementById('billCustomerName').textContent = order.customerName || '--';
    document.getElementById('billCustomerPhone').textContent = order.customerPhone || '--';
    document.getElementById('billTableNumber').textContent = currentCustomer?.tableNumber || '--';

    // Populate bill items
    const billItemsList = document.getElementById('billItemsList');
    billItemsList.innerHTML = '';

    let subtotal = 0;
    order.items?.forEach(item => {
        if (item && item.dishName && item.quantity) {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const itemRow = document.createElement('div');
            itemRow.className = 'bill-item-row';
            itemRow.innerHTML = `
                <div class="bill-item-name">${item.dishName}</div>
                <div class="bill-item-price">${item.price?.toLocaleString('vi-VN') || 0}</div>
                <div class="bill-item-qty">${item.quantity}</div>
                <div class="bill-item-total">${itemTotal.toLocaleString('vi-VN')}</div>
            `;
            billItemsList.appendChild(itemRow);
        }
    });

    // Populate totals
    document.getElementById('billSubtotal').textContent = subtotal.toLocaleString('vi-VN') + ' VND';
    document.getElementById('billTotal').textContent = (order.totalPrice || subtotal).toLocaleString('vi-VN') + ' VND';
}

// Process payment
async function processPayment(method) {
    // Use the order being viewed for payment, not the current cart
    const orderToPayFor = orderBeingViewed || currentOrder;
    
    if (!orderToPayFor || !orderToPayFor.id) {
        alert('Lỗi: Không tìm thấy đơn hàng');
        return;
    }

    try {
        // Update order status to PAID
        const response = await fetch(
            `${API_URL}/orders/${orderToPayFor.id}/status?status=PAID`,
            {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'}
            }
        );

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    orderBeingViewed = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse payment response:', e);
                }
            }
            
            // Show detailed success message
            const orderDetails = `
Đơn hàng: #${orderToPayFor.id}
Khách hàng: ${orderToPayFor.customerName || currentCustomer.name}
SĐT: ${orderToPayFor.customerPhone || currentCustomer.phone}
Tổng tiền: ${(orderToPayFor.totalPrice || 0).toLocaleString('vi-VN')}đ
Phương thức: ${method}
            
✅ Thanh toán thành công!
Vui lòng chờ phục vụ.
            `;
            alert(orderDetails);
            
            // Go back to tracking page
            loadOrderTracking();
            showSection('orderTrackingSection');
        } else {
            alert('Lỗi: ' + (response.statusText || 'Thanh toán thất bại'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi thanh toán: ' + error.message);
    }
}

// Search dishes
async function searchDishes() {
    const keyword = document.getElementById('searchInput').value;
    if (!keyword) {
        loadDishes();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/dishes/search?keyword=${encodeURIComponent(keyword)}`);
        if (response.ok) {
            const text = await response.text();
            let dishes = [];
            if (text) {
                try {
                    dishes = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse search dishes JSON:', e);
                }
            }
            displayDishes(dishes);
        }
    } catch (error) {
        console.error('Error:', error);
        displayDishes([]);
    }
}

// Filter by category
async function filterByCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (category === 'Tất cả') {
        loadDishes();
    } else {
        try {
            const response = await fetch(`${API_URL}/dishes/category/${encodeURIComponent(category)}`);
            if (response.ok) {
                const text = await response.text();
                let dishes = [];
                if (text) {
                    try {
                        dishes = JSON.parse(text);
                    } catch (e) {
                        console.warn('Could not parse filter by category JSON:', e);
                    }
                }
                displayDishes(dishes);
            }
        } catch (error) {
            console.error('Error:', error);
            displayDishes([]);
        }
    }
}

// Back to menu
function backToMenu() {
    showSection('menuSection');
}

// Show section
function showSection(sectionId) {
    // Clear previous tracking refresh if any
    if (trackingRefreshInterval) {
        clearInterval(trackingRefreshInterval);
        trackingRefreshInterval = null;
    }

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    } else {
        console.error('Section not found:', sectionId);
    }
    
    // Start auto-refresh for tracking section
    if (sectionId === 'orderTrackingSection') {
        console.log('Starting order tracking auto-refresh...');
        loadOrderTracking();  // Load immediately
        trackingRefreshInterval = setInterval(() => {
            console.log('Auto-refreshing order tracking...');
            loadOrderTracking();
        }, 3000);  // Auto-refresh every 3 seconds
    }
}

// ===== DISH DETAIL FUNCTIONS =====

// Open dish detail modal
function openDishDetail(dish) {
    if (!dish || !dish.id) {
        console.error('Invalid dish:', dish);
        alert('Lỗi: Không thể mở chi tiết món ăn');
        return;
    }
    
    currentDishDetail = dish;
    selectedSize = { name: 'S', price: dish.price };
    selectedToppings = [];
    selectedOptions = [];
    document.getElementById('detailQuantity').value = 1;
    
    // Set dish info
    document.getElementById('detailDishName').textContent = dish.name || 'N/A';
    document.getElementById('detailDishDescription').textContent = dish.description || 'Món ăn ngon lạc miệng';
    
    // Set dish image
    const imageContainer = document.getElementById('detailDishImage');
    if (dish.imageUrl && dish.imageUrl.trim()) {
        imageContainer.innerHTML = `<img src="${dish.imageUrl}" alt="${dish.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML='🍕';">`;
    } else {
        imageContainer.innerHTML = '🍕';
    }
    
    // Set sizes (example: S, M, L with different prices)
    const sizesHTML = `
        <div class="size-option active" onclick="selectSize('S', ${dish.price})">
            <span class="size-label">S</span>
            <span class="size-price">${dish.price.toLocaleString('vi-VN')}</span>
        </div>
        <div class="size-option" onclick="selectSize('M', ${(dish.price * 1.15).toFixed(0)})">
            <span class="size-label">M</span>
            <span class="size-price">${(dish.price * 1.15).toLocaleString('vi-VN')}</span>
        </div>
        <div class="size-option" onclick="selectSize('L', ${(dish.price * 1.3).toFixed(0)})">
            <span class="size-label">L</span>
            <span class="size-price">${(dish.price * 1.3).toLocaleString('vi-VN')}</span>
        </div>
    `;
    document.getElementById('detailSizes').innerHTML = sizesHTML;
    
    // Set toppings (common)
    const toppingsHTML = `
        <div class="topping-item">
            <input type="checkbox" id="topping-nam" value="Nấm">
            <label class="topping-label" for="topping-nam">Nấm</label>
        </div>
        <div class="topping-item">
            <input type="checkbox" id="topping-hanh-tay" value="Hành Tây">
            <label class="topping-label" for="topping-hanh-tay">Hành Tây</label>
        </div>
        <div class="topping-item">
            <input type="checkbox" id="topping-ot-chuong" value="Ớt Chuông">
            <label class="topping-label" for="topping-ot-chuong">Ớt Chuông</label>
        </div>
        <div class="topping-item">
            <input type="checkbox" id="topping-olive" value="Olive">
            <label class="topping-label" for="topping-olive">Olive</label>
        </div>
    `;
    document.getElementById('detailToppings').innerHTML = toppingsHTML;
    
    // Set options (special)
    const optionsHTML = `
        <div class="option-item">
            <input type="checkbox" id="option-pho-mai" value="Phô Mai Kéo Sợi">
            <label class="option-label" for="option-pho-mai">Phô Mai Kéo Sợi</label>
        </div>
        <div class="option-item">
            <input type="checkbox" id="option-xuc-ich-duc" value="Xúc Xích Đức">
            <label class="option-label" for="option-xuc-ich-duc">Xúc Xích Đức</label>
        </div>
        <div class="option-item">
            <input type="checkbox" id="option-de-day" value="Đế Dày">
            <label class="option-label" for="option-de-day">Đế Dày</label>
        </div>
        <div class="option-item">
            <input type="checkbox" id="option-de-mong" value="Đế Mỏng">
            <label class="option-label" for="option-de-mong">Đế Mỏng</label>
        </div>
    `;
    document.getElementById('detailOptions').innerHTML = optionsHTML;
    
    updateDetailPrice();
    document.getElementById('dishDetailModal').classList.add('active');
}

// Close dish detail modal
function closeDishDetail() {
    document.getElementById('dishDetailModal').classList.remove('active');
    currentDishDetail = null;
}

// Select size
function selectSize(size, priceValue) {
    selectedSize = { name: size, price: priceValue };
    document.querySelectorAll('.size-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.target.closest('.size-option').classList.add('active');
    updateDetailPrice();
}

// Update detail price based on selections
function updateDetailPrice() {
    let basePrice = selectedSize.price;
    let toppingPrice = 0;
    let optionPrice = 0;
    
    // Count selected toppings
    const selectedToppingCheckboxes = document.querySelectorAll('#detailToppings input[type="checkbox"]:checked');
    toppingPrice = selectedToppingCheckboxes.length * 20000;
    
    // Count selected options
    const selectedOptionCheckboxes = document.querySelectorAll('#detailOptions input[type="checkbox"]:checked');
    optionPrice = selectedOptionCheckboxes.length * 40000;
    
    const totalPrice = basePrice + toppingPrice + optionPrice;
    document.getElementById('detailPrice').textContent = totalPrice.toLocaleString('vi-VN') + 'đ';
}

// Increase quantity
function increaseDetailQuantity() {
    const input = document.getElementById('detailQuantity');
    input.value = Math.min(parseInt(input.value) + 1, 10);
}

// Decrease quantity
function decreaseDetailQuantity() {
    const input = document.getElementById('detailQuantity');
    input.value = Math.max(parseInt(input.value) - 1, 1);
}

// Add to cart from detail view
async function addDetailToCart() {
    if (!currentDishDetail) {
        alert('Lỗi: Không tìm thấy thông tin món ăn');
        return;
    }
    
    // Store dish name before we close the modal (which sets currentDishDetail to null)
    const dishName = currentDishDetail.name;
    const dishId = currentDishDetail.id;
    
    const quantity = parseInt(document.getElementById('detailQuantity').value) || 1;
    
    const toppingCheckboxes = document.querySelectorAll('#detailToppings input[type="checkbox"]:checked');
    let toppingsList = Array.from(toppingCheckboxes).map(cb => cb.value).join(', ');
    
    const optionCheckboxes = document.querySelectorAll('#detailOptions input[type="checkbox"]:checked');
    let optionsList = Array.from(optionCheckboxes).map(cb => cb.value).join(', ');
    
    const notes = `Kích thước: ${selectedSize.name}${toppingsList ? ' | Topping: ' + toppingsList : ''}${optionsList ? ' | Tùy chọn: ' + optionsList : ''}`;
    
    try {
        const response = await fetch(
            `${API_URL}/orders/${currentOrder.id}/items?dishId=${dishId}&quantity=${quantity}`,
            { method: 'POST' }
        );

        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    currentOrder = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse cart response:', e);
                }
            }
            updateCartCount();
            closeDishDetail();
            alert(`Đã thêm ${dishName} vào giỏ hàng`);
        } else {
            // Show API error details
            const errorText = await response.text();
            console.error('API error response:', response.status, errorText);
            alert(`Lỗi thêm vào giỏ (${response.status}): ${errorText || 'Không rõ nguyên nhân'}`);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

// ============ TRACKING FUNCTIONS ============

// Open order tracking
function openOrderTracking() {
    if (!currentCustomer) {
        alert('Vui lòng đăng ký trước');
        return;
    }
    console.log('Opening order tracking for customer:', currentCustomer.id);
    loadOrderTracking();
    showSection('orderTrackingSection');
}

// Load order tracking
async function loadOrderTracking() {
    try {
        const url = `${API_URL}/orders/customer/${currentCustomer.id}`;
        console.log('Fetching orders from:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status, response.ok);
        
        if (response.ok) {
            const text = await response.text();
            console.log('Response text:', text);
            
            if (text) {
                try {
                    const orders = JSON.parse(text);
                    console.log('Parsed orders:', orders);
                    displayOrderTracking(orders);
                } catch (e) {
                    console.warn('Could not parse order tracking JSON:', e);
                    console.log('Raw text was:', text);
                    displayOrderTracking([]);
                }
            } else {
                console.warn('Empty response body');
                displayOrderTracking([]);
            }
        } else {
            console.error('API error. Status:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            displayOrderTracking([]);
        }
    } catch (error) {
        console.error('Error loading order tracking:', error);
        displayOrderTracking([]);
    }
}

// Global tracking filter
let currentTrackingFilter = 'ALL';
let allTrackingOrders = [];

// Display order tracking with grid layout (menu-like)
function displayOrderTracking(orders) {
    const selectedContainer = document.getElementById('trackingSelectedItems');
    const orderedContainer = document.getElementById('trackingOrderedItems');
    
    if (!selectedContainer || !orderedContainer) {
        console.error('ERROR: Tracking containers not found in DOM');
        alert('Lỗi: Không tìm thấy thành phần giao diện theo dõi đơn hàng');
        return;
    }
    
    // Store all orders for filtering
    allTrackingOrders = orders || [];
    
    // Update sidebar info
    if (currentOrder) {
        document.getElementById('orderIdDisplay').textContent = currentOrder.id || '-';
        
        const statusText = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'PREPARING': 'Đang chuẩn bị',
            'READY': 'Sẵn sàng lấy',
            'PAID': 'Đã thanh toán',
            'COMPLETED': 'Hoàn thành'
        };
        document.getElementById('orderStatusDisplay').textContent = statusText[currentOrder.status] || currentOrder.status || 'Chờ xác nhận';
        
        let total = 0;
        if (currentOrder.totalPrice && currentOrder.totalPrice > 0) {
            total = currentOrder.totalPrice;
        } else if (currentOrder.items && currentOrder.items.length > 0) {
            total = currentOrder.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
        }
        document.getElementById('orderTotalDisplay').textContent = (total || 0).toLocaleString('vi-VN') + 'đ';
    }
    
    console.log('Displaying', orders?.length || 0, 'orders in grid layout');
    selectedContainer.innerHTML = '';
    orderedContainer.innerHTML = '';

    // Grid 1: Display current cart items (selected - MÓN ĐÃ CHỌN)
    if (currentOrder?.items && currentOrder.items.length > 0) {
        currentOrder.items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'tracking-item-card';
            itemCard.innerHTML = `
                <div class="item-name">${item.dishName}</div>
                <div class="item-details">
                    <div class="item-detail-row">
                        <span class="item-detail-label">Số lượng:</span>
                        <span class="item-detail-value">${item.quantity}</span>
                    </div>
                    <div class="item-detail-row">
                        <span class="item-detail-label">Đơn giá:</span>
                        <span class="item-detail-value">${item.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
                <div class="item-price">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</div>
            `;
            selectedContainer.appendChild(itemCard);
        });
    } else {
        selectedContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 40px; grid-column: 1/-1;">Chưa có món nào được chọn</p>';
    }

    // Apply filter to orders
    let filteredOrders = orders || [];
    if (currentTrackingFilter !== 'ALL') {
        filteredOrders = filteredOrders.filter(order => order.status === currentTrackingFilter);
    }

    // Grid 2: Display confirmed/ordered items (MÓN ĐÃ GỌI)
    const statusText = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng lấy',
        'PAID': 'Đã thanh toán',
        'COMPLETED': 'Hoàn thành'
    };

    if (filteredOrders && filteredOrders.length > 0) {
        filteredOrders.forEach(order => {
            if (!order || !order.id) {
                console.warn('Skipping invalid order:', order);
                return;
            }

            const orderCard = document.createElement('div');
            orderCard.className = 'tracking-item-card';
            
            const itemsCount = order.items?.length || 0;
            const itemsList = order.items ? order.items.slice(0, 3).map(item => 
                `${item.dishName} (${item.quantity})`
            ).join(', ') : 'Không có thông tin';

            let priceDisplay = '0';
            if (order.totalPrice && order.totalPrice > 0) {
                priceDisplay = order.totalPrice.toLocaleString('vi-VN');
            } else if (order.items && order.items.length > 0) {
                const itemsTotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                priceDisplay = itemsTotal.toLocaleString('vi-VN');
            }
            
            orderCard.innerHTML = `
                <div class="item-name">Đơn #${order.id}</div>
                <div class="item-details">
                    <div class="item-detail-row">
                        <span class="item-detail-label">Số món:</span>
                        <span class="item-detail-value">${itemsCount}</span>
                    </div>
                    <div class="item-detail-row">
                        <span class="item-detail-label">Trạng thái:</span>
                        <span class="item-detail-value">${statusText[order.status] || order.status}</span>
                    </div>
                </div>
                <div class="item-price">${priceDisplay}đ</div>
            `;
            
            // Add click handler to open order detail
            orderCard.style.cursor = 'pointer';
            orderCard.onclick = () => openOrderDetail(order);
            
            orderedContainer.appendChild(orderCard);
        });
    } else {
        let emptyText = currentTrackingFilter === 'ALL' ? 'Chưa có đơn hàng nào' : `Chưa có đơn nào ở trạng thái "${statusText[currentTrackingFilter]}"`;
        orderedContainer.innerHTML = `<p style="color: #666; text-align: center; padding: 40px; grid-column: 1/-1;">${emptyText}</p>`;
    }
    
    console.log('Successfully displayed tracking in grid layout');
}

// Filter tracking orders by status
function filterByTrackingStatus(status) {
    currentTrackingFilter = status;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(
            status === 'ALL' ? 'TẤT CẢ' :
            status === 'PENDING' ? 'CHỜ' :
            status === 'CONFIRMED' ? 'ĐÃ XÁC' :
            status === 'PREPARING' ? 'ĐANG' :
            status === 'READY' ? 'SẴN' :
            status === 'COMPLETED' ? 'HOÀN' : status
        ));
    });
    
    // Refresh display with filter
    displayOrderTracking(allTrackingOrders);
}

// Filter tracking orders by search
function filterTrackingOrders() {
    const searchTerm = document.getElementById('trackingSearchInput')?.value.toLowerCase() || '';
    
    let filtered = allTrackingOrders;
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.id.toString().includes(searchTerm) ||
            order.phoneNumber?.includes(searchTerm)
        );
    }
    
    displayOrderTracking(filtered);
}

// Open order detail modal
function openOrderDetail(order) {
    if (!order || !order.id) {
        console.error('Invalid order:', order);
        alert('Lỗi: Không thể mở chi tiết đơn hàng');
        return;
    }
    
    console.log('Opening order detail for order:', order.id);
    
    // Store order ID for payment
    currentOrderDetailId = order.id;
    
    // Set order info
    document.getElementById('orderDetailId').textContent = order.id || '-';
    
    const statusText = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng lấy',
        'PAID': 'Đã thanh toán',
        'COMPLETED': 'Hoàn thành'
    };
    document.getElementById('orderDetailStatus').textContent = statusText[order.status] || order.status || '-';
    document.getElementById('orderDetailPhone').textContent = order.phoneNumber || '-';
    
    // Display order items
    const itemsContainer = document.getElementById('orderDetailItems');
    itemsContainer.innerHTML = '';
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'order-item-detail';
            itemDiv.innerHTML = `
                <span class="order-item-name">${item.dishName || 'N/A'}</span>
                <span class="order-item-qty">x${item.quantity}</span>
                <span class="order-item-price">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
            `;
            itemsContainer.appendChild(itemDiv);
        });
    } else {
        itemsContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Không có thông tin về các món</p>';
    }
    
    // Set total price
    const total = order.totalPrice || (order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0);
    document.getElementById('orderDetailTotal').textContent = total.toLocaleString('vi-VN') + 'đ';
    
    // Show modal
    document.getElementById('orderDetailModal').classList.add('active');
}

// Close order detail modal
function closeOrderDetail() {
    document.getElementById('orderDetailModal').classList.remove('active');
    currentOrderDetailId = null;
}

// Pay from order detail modal
async function payFromOrderDetail() {
    if (!currentOrderDetailId) {
        alert('Lỗi: Không tìm thấy đơn hàng');
        return;
    }
    
    // Lưu ID tạm thời trước khi đóng modal
    const orderId = currentOrderDetailId;
    
    // Close the detail modal
    closeOrderDetail();
    
    // View bill and show payment section
    await viewBill(orderId);
}

