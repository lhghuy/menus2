// Admin JavaScript
const API_URL = 'http://localhost:8080/api';
let currentAdmin = null;
let currentDishFilter = null;
let ordersRefreshInterval = null;
let lastNotifiedPaidOrders = [];  // Track paid orders we've already notified about
let paymentCheckInterval = null;  // Track payment check interval

// Admin Login
async function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (!username || !password) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            currentAdmin = await response.json();
            showLoginSection(false);
            loadDishes();
        } else {
            alert('Sai tên đăng nhập hoặc mật khẩu');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối');
    }
}

// Admin Logout
function adminLogout() {
    currentAdmin = null;
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    showLoginSection(true);
}

// Show/Hide login section
function showLoginSection(show) {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (show) {
        loginSection.classList.add('active');
        dashboardSection.classList.remove('active');
    } else {
        loginSection.classList.remove('active');
        dashboardSection.classList.add('active');
    }
}

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Clear previous auto-refresh if any
    if (ordersRefreshInterval) {
        clearInterval(ordersRefreshInterval);
        ordersRefreshInterval = null;
    }
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }

    if (tab === 'menu') {
        document.getElementById('menuTab').classList.add('active');
        document.querySelectorAll('.nav-link')[0].classList.add('active');
        loadDishes();
    } else if (tab === 'orders') {
        document.getElementById('ordersTab').classList.add('active');
        document.querySelectorAll('.nav-link')[1].classList.add('active');
        filterOrders('CONFIRMED');
        
        // Auto-refresh orders every 5 seconds
        ordersRefreshInterval = setInterval(() => {
            filterOrders(currentDishFilter);
        }, 5000);
        
        // Check for payment updates every 3 seconds
        paymentCheckInterval = setInterval(() => {
            checkPaymentStatus();
        }, 3000);
    } else if (tab === 'tracking') {
        document.getElementById('trackingTab').classList.add('active');
        document.querySelectorAll('.nav-link')[2].classList.add('active');
        loadAllTrackingOrders();
    } else if (tab === 'stats') {
        document.getElementById('statsTab').classList.add('active');
        document.querySelectorAll('.nav-link')[3].classList.add('active');
    }
}

// Load dishes
async function loadDishes() {
    try {
        const response = await fetch(`${API_URL}/dishes`);
        if (response.ok) {
            const text = await response.text();
            let dishes = [];
            if (text) {
                try {
                    dishes = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse dishes JSON:', e);
                }
            }
            displayDishes(dishes);
        }
    } catch (error) {
        console.error('Error:', error);
        displayDishes([]);
    }
}

// Display dishes in grid
function displayDishes(dishes) {
    const container = document.getElementById('dishesContainer');
    container.innerHTML = '';

    if (dishes.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">Không có món ăn nào</p>';
        return;
    }

    dishes.forEach(dish => {
        const card = document.createElement('div');
        card.className = 'dish-card';
        
        // Hiển thị hình ảnh nếu có, không thì dùng emoji
        let imageHtml = '';
        if (dish.imageUrl) {
            imageHtml = `<div class="dish-image"><img src="${dish.imageUrl}" alt="${dish.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;"></div>`;
        } else {
            imageHtml = `<div class="dish-image">🍕</div>`;
        }
        
        card.innerHTML = `
            ${imageHtml}
            <div class="dish-info">
                <div class="dish-name">${dish.name}</div>
                <div class="dish-description">${dish.description || 'Mô tả món ăn'}</div>
                <div class="dish-price">${dish.price.toLocaleString('vi-VN')}đ</div>
                <div class="dish-actions">
                    <button class="edit-btn" onclick="editDish(${dish.id})">Sửa</button>
                    <button class="delete-btn" onclick="deleteDish(${dish.id})">Xóa</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Filter by category
async function filterByCategory(category) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mark the clicked category as active
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (category === 'Tất cả') {
        loadDishes();
    } else {
        try {
            const response = await fetch(`${API_URL}/dishes/category/${encodeURIComponent(category)}`);
            if (response.ok) {
                const dishes = await response.json();
                displayDishes(dishes);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Search dishes
function searchDishes() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const dishes = document.querySelectorAll('.dish-card');
    
    dishes.forEach(card => {
        const dishName = card.querySelector('.dish-name').textContent.toLowerCase();
        if (dishName.includes(searchInput)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Handle image upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('Tệp quá lớn. Kích thước tối đa là 10MB');
        return;
    }

    // Show loading state
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '<span style="color: #999;">Đang tải lên...</span>';

    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log('Uploading file:', file.name, 'Size:', file.size);

        const response = await fetch(`${API_URL}/dishes/upload-image`, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
        }

        if (response.ok && result.imageUrl) {
            // Store image URL
            document.getElementById('dishImageUrl').value = result.imageUrl;
            
            // Show preview
            const img = document.createElement('img');
            img.src = result.imageUrl;
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);

            console.log('Image uploaded successfully:', result.imageUrl);
        } else {
            const errorMsg = result.error || 'Upload thất bại';
            imagePreview.innerHTML = '<span style="color: #f44;">Lỗi: ' + errorMsg + '</span>';
            alert('Lỗi upload ảnh: ' + errorMsg);
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        imagePreview.innerHTML = '<span style="color: #f44;">Lỗi: ' + error.message + '</span>';
        alert('Lỗi: ' + error.message);
    }
}

// Open add dish form
function openAddDishForm() {
    document.getElementById('dishId').value = '';
    document.getElementById('dishForm').reset();
    document.getElementById('dishImageUrl').value = '';
    document.getElementById('imagePreview').innerHTML = '<span style="color: #999;">Chưa có ảnh</span>';
    document.getElementById('formTitle').textContent = 'Thêm món ăn';
    document.getElementById('addDishModal').classList.add('active');
}

// Close add dish form
function closeAddDishForm() {
    document.getElementById('addDishModal').classList.remove('active');
    
    // Reset form
    document.getElementById('dishForm').reset();
    document.getElementById('dishId').value = '';
    document.getElementById('dishImageUrl').value = '';
    document.getElementById('imagePreview').innerHTML = '<span style="color: #999;">Chưa có ảnh</span>';
}

// Save dish
async function saveDish() {
    const id = document.getElementById('dishId').value;
    const dishData = {
        name: document.getElementById('dishName').value,
        description: document.getElementById('dishDescription').value,
        price: parseFloat(document.getElementById('dishPrice').value),
        imageUrl: document.getElementById('dishImageUrl').value,
        category: document.getElementById('dishCategory').value,
        available: document.getElementById('dishAvailable').checked
    };

    if (!dishData.name || !dishData.price || !dishData.category) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    try {
        const url = id ? `${API_URL}/dishes/${id}` : `${API_URL}/dishes`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dishData)
        });

        if (response.ok) {
            alert(id ? 'Cập nhật thành công' : 'Thêm thành công');
            closeAddDishForm();
            loadDishes();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi lưu');
    }
}

// Edit dish
async function editDish(id) {
    try {
        const response = await fetch(`${API_URL}/dishes/${id}`);
        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    const dish = JSON.parse(text);
                    document.getElementById('dishId').value = dish.id;
                    document.getElementById('dishName').value = dish.name;
                    document.getElementById('dishDescription').value = dish.description;
                    document.getElementById('dishPrice').value = dish.price;
                    document.getElementById('dishImageUrl').value = dish.imageUrl;
                    document.getElementById('dishCategory').value = dish.category;
                    document.getElementById('dishAvailable').checked = dish.available;
                    document.getElementById('formTitle').textContent = 'Chỉnh sửa món ăn';
                    
                    // Load image preview if exists
                    if (dish.imageUrl) {
                        const imagePreview = document.getElementById('imagePreview');
                        imagePreview.innerHTML = '';
                        const img = document.createElement('img');
                        img.src = dish.imageUrl;
                        imagePreview.appendChild(img);
                    }
                    
                    document.getElementById('addDishModal').classList.add('active');
                } catch (e) {
                    console.warn('Could not parse edit dish JSON:', e);
                    alert('Lỗi khi tải thông tin món ăn');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi tải thông tin món ăn');
    }
}

// Delete dish
async function deleteDish(id) {
    if (!confirm('Bạn chắc chắn muốn xóa?')) return;

    try {
        const response = await fetch(`${API_URL}/dishes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Xóa thành công');
            loadDishes();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Filter orders
async function filterOrders(status) {
    currentDishFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    try {
        const response = await fetch(`${API_URL}/orders/status/${status}`);
        if (response.ok) {
            const text = await response.text();
            let orders = [];
            if (text) {
                try {
                    orders = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse filter orders JSON:', e);
                }
            }
            displayOrders(orders);
        }
    } catch (error) {
        console.error('Error:', error);
        displayOrders([]);
    }
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; width: 100%; color: #999;">Không có đơn hàng</p>';
        return;
    }

    orders.forEach((order, index) => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        // Highlight new orders
        if (order.status === 'CONFIRMED') {
            card.style.animation = 'pulse 1s infinite';
            card.style.borderColor = '#ff6b6b';
        }

        const itemsList = order.items.map(item => `
            <div class="order-item">${item.dishName} x${item.quantity}</div>
        `).join('');

        const statusColor = {
            'PENDING': '#FFA500',
            'CONFIRMED': '#ff6b6b',
            'PREPARING': '#2196F3',
            'READY': '#FF6B35',
            'PAID': '#4CAF50',
            'COMPLETED': '#8B7355'
        };

        let actionButtons = '';
        if (order.status === 'CONFIRMED') {
            actionButtons = `
                <div style="margin-bottom: 10px; padding: 10px; background: #ffe0e0; border-radius: 5px; font-weight: 600; color: #ff6b6b; text-align: center;">
                    🔔 ĐƠN HÀNG MỚI
                </div>
                <button class="status-btn" onclick="updateOrderStatus(${order.id}, 'PREPARING'); changeTabAfterOrder();">👨‍🍳 Bắt đầu chế biến</button>
            `;
        } else if (order.status === 'PREPARING') {
            actionButtons = `<button class="status-btn" onclick="updateOrderStatus(${order.id}, 'READY')">🚀 Đã xong - Sẵn sàng phục vụ</button>`;
        } else if (order.status === 'READY') {
            actionButtons = `<button class="status-btn" onclick="updateOrderStatus(${order.id}, 'COMPLETED')">✅ Khách đã lấy</button>`;
        }

        card.innerHTML = `
            <div class="order-header">Đơn hàng #${order.id}</div>
            <div class="order-customer">Khách: ${order.customerName}</div>
            <div class="order-customer">SĐT: ${order.customerPhone}</div>
            <div class="order-customer">Bàn: ${order.tableNumber || 'N/A'}</div>
            <div class="order-items">${itemsList}</div>
            <div class="order-total">Tổng: ${order.totalPrice?.toLocaleString('vi-VN') || 0}đ</div>
            <div class="order-status" style="background: ${statusColor[order.status] || '#999'};">
                ${getStatusText(order.status)}
            </div>
            <div class="order-actions">
                ${actionButtons}
            </div>
        `;
        container.appendChild(card);
    });
    
    // Update badge notification
    checkNewOrders();
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng phục vụ',
        'PAID': 'Đã thanh toán',
        'COMPLETED': 'Hoàn thành'
    };
    return statusMap[status] || status;
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(
            `${API_URL}/orders/${orderId}/status?status=${newStatus}`,
            { method: 'PUT' }
        );

        if (response.ok) {
            alert('Cập nhật trạng thái thành công');
            filterOrders(currentDishFilter);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi cập nhật');
    }
}

// Change tab after processing order
function changeTabAfterOrder() {
    // Automatically switch to tracking tab to see all orders
    switchTab('tracking');
}

// ============ TRACKING FUNCTIONS ============

// Check for new orders
async function checkNewOrders() {
    try {
        const response = await fetch(`${API_URL}/orders/status/CONFIRMED`);
        if (response.ok) {
            const text = await response.text();
            let orders = [];
            if (text) {
                try {
                    orders = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse new orders JSON:', e);
                }
            }
            const badge = document.getElementById('newOrderBadge');
            if (orders.length > 0) {
                badge.style.display = 'inline-block';
                badge.textContent = orders.length > 9 ? '9+' : orders.length;
                // Play sound notification
                playNotificationSound();
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking new orders:', error);
    }
}

// Play notification sound
function playNotificationSound() {
    // Using a simple beep sound (you can replace with actual sound file)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Check for payment status updates
async function checkPaymentStatus() {
    try {
        const response = await fetch(`${API_URL}/orders/status/PAID`);
        if (response.ok) {
            const text = await response.text();
            let paidOrders = [];
            if (text) {
                try {
                    paidOrders = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse paid orders JSON:', e);
                }
            }
            
            // Find new paid orders (ones we haven't notified about yet)
            const newPaidOrders = paidOrders.filter(order => 
                !lastNotifiedPaidOrders.includes(order.id)
            );
            
            if (newPaidOrders.length > 0) {
                // Play different notification sound for payment
                playPaymentNotificationSound();
                
                // Show alert with payment details
                let paymentMsg = `💳 ĐẦN HÀNG ĐÃ THANH TOÁN:\n\n`;
                newPaidOrders.forEach(order => {
                    paymentMsg += `Đơn #${order.id}\n${order.customerName} (${order.customerPhone})\n${order.totalPrice?.toLocaleString('vi-VN') || 0}đ\n\n`;
                });
                
                console.log('Payment notification:', paymentMsg);
                
                // Update the list of notified orders
                lastNotifiedPaidOrders = [
                    ...lastNotifiedPaidOrders,
                    ...newPaidOrders.map(o => o.id)
                ];
                
                // Auto-refresh tracking tab if visible
                const trackingTab = document.getElementById('trackingTab');
                if (trackingTab && trackingTab.classList.contains('active')) {
                    loadAllTrackingOrders();
                }
            }
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
    }
}

// Play payment notification sound (different from order notification)
function playPaymentNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Double beep for payment
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Second beep
        const osc2 = audioContext.createOscillator();
        osc2.connect(gainNode);
        osc2.frequency.value = 1200;
        osc2.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
        osc2.start(audioContext.currentTime + 0.4);
        osc2.stop(audioContext.currentTime + 0.7);
    } catch (e) {
        console.warn('Could not play payment sound:', e);
    }
}

// Load all tracking orders
async function loadAllTrackingOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        if (response.ok) {
            const text = await response.text();
            if (text) {
                try {
                    const orders = JSON.parse(text);
                    displayTrackingOrders(orders);
                } catch (e) {
                    console.warn('Could not parse tracking orders JSON:', e);
                    displayTrackingOrders([]);
                }
            } else {
                displayTrackingOrders([]);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        displayTrackingOrders([]);
    }
}

// Search tracking orders
async function searchTrackingOrders() {
    const searchTerm = document.getElementById('trackingOrderId').value.trim();
    
    if (!searchTerm) {
        loadAllTrackingOrders();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders`);
        if (response.ok) {
            const text = await response.text();
            let orders = [];
            if (text) {
                try {
                    orders = JSON.parse(text);
                } catch (e) {
                    console.warn('Could not parse search tracking orders JSON:', e);
                }
            }
            // Filter by order ID or customer phone
            const filtered = orders.filter(order => 
                order.id.toString().includes(searchTerm) || 
                (order.customerPhone && order.customerPhone.includes(searchTerm))
            );
            displayTrackingOrders(filtered);
        }
    } catch (error) {
        console.error('Error:', error);
        displayTrackingOrders([]);
    }
}

// Display tracking orders
function displayTrackingOrders(orders) {
    const container = document.getElementById('trackingContainer');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; width: 100%; color: #999;">Không có đơn hàng nào</p>';
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'tracking-card';

        const itemsList = order.items.map(item => `
            <div class="tracking-item">• ${item.dishName} x${item.quantity}</div>
        `).join('');

        const statusColor = {
            'PENDING': '#FFA500',
            'CONFIRMED': '#4CAF50',
            'PREPARING': '#2196F3',
            'READY': '#FF6B35',
            'PAID': '#8B4513',
            'COMPLETED': '#8B7355'
        };

        const statusIcon = {
            'PENDING': '⏳',
            'CONFIRMED': '✅',
            'PREPARING': '👨‍🍳',
            'READY': '🚀',
            'PAID': '💳',
            'COMPLETED': '✨'
        };

        card.innerHTML = `
            <div class="tracking-order-header">
                <div class="tracking-order-id">🔖 Đơn #${order.id}</div>
                <div class="tracking-order-time">${new Date(order.createdAt).toLocaleString('vi-VN')}</div>
            </div>
            <div class="tracking-customer-info">
                <p><strong>Khách:</strong> ${order.customerName}</p>
                <p><strong>SĐT:</strong> ${order.customerPhone}</p>
                <p><strong>Bàn:</strong> ${order.tableNumber || 'N/A'}</p>
            </div>
            <div class="tracking-items">
                <strong>Món ăn:</strong>
                ${itemsList}
            </div>
            <div class="tracking-total">
                <strong>Tổng tiền:</strong> ${order.totalPrice?.toLocaleString('vi-VN') || 0}đ
            </div>
            <div class="tracking-status" style="background: ${statusColor[order.status] || '#999'};">
                <span class="status-icon">${statusIcon[order.status] || '❓'}</span>
                <span class="status-text">${getStatusText(order.status)}</span>
                <span class="status-time">${getStatusTime(order.status)}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Get status time estimate
function getStatusTime(status) {
    const timeMap = {
        'PENDING': '(Chờ xác nhận...)',
        'CONFIRMED': '(Xác nhận rồi)',
        'PREPARING': '(Đang nấu...)',
        'READY': '(Sẵn sàng lấy)',
        'PAID': '(Đã thanh toán)',
        'COMPLETED': '(Hoàn thành)'
    };
    return timeMap[status] || '';
}

// Initialize
window.onload = function() {
    // Initialize default admin on page load
    fetch(`${API_URL}/admin/init`, { method: 'POST' })
        .catch(error => console.error('Error:', error));
    
    // Check for new orders every 3 seconds
    setInterval(() => {
        checkNewOrders();
    }, 3000);
};
