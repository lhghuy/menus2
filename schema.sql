-- ============================================================
-- DATABASE: EMENU - E-MENU MANAGEMENT SYSTEM
-- ============================================================
-- SQL Server Database Script
-- Khởi tạo database phù hợp với Entity classes hiện tại
-- ============================================================

USE master;
GO

-- Xóa database cũ nếu tồn tại
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'emenu_db')
BEGIN
    ALTER DATABASE emenu_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE emenu_db;
END
GO

-- Tạo database mới
CREATE DATABASE emenu_db;
GO

USE emenu_db;
GO

-- ========================
-- TABLE: CUSTOMER
-- ========================
CREATE TABLE customer (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255),
    phone VARCHAR(20),
    table_number NVARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================
-- TABLE: DISH
-- ========================
CREATE TABLE dish (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(19,2) NOT NULL,
    image_url NVARCHAR(500),
    category NVARCHAR(100) NOT NULL,
    available BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ========================
-- TABLE: ORDERS
-- ========================
CREATE TABLE orders (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    status NVARCHAR(50) DEFAULT 'PENDING',
    total_price DECIMAL(19,2),
    payment_method NVARCHAR(50),
    paid_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);

-- ========================
-- TABLE: ORDER_ITEM
-- ========================
CREATE TABLE order_item (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    dish_id BIGINT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(19,2) NOT NULL,
    special_request NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dish(id)
);

-- ========================
-- TABLE: ADMIN
-- ========================
CREATE TABLE admin (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    fullname NVARCHAR(255),
    active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- ========================
-- CREATE INDEXES
-- ========================
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_dish ON order_item(dish_id);
CREATE INDEX idx_dish_category ON dish(category);
CREATE INDEX idx_admin_username ON admin(username);

GO

-- ========================
-- SEED DATA
-- ========================

-- Insert Demo Admin User
INSERT INTO admin (username, password, email, fullname, active, created_at)
VALUES 
    ('admin', '123456', 'admin@emenu.com', 'Administrator', 1, GETDATE()),
    ('staff', 'staff123', 'staff@emenu.com', 'Staff Member', 1, GETDATE());

-- Insert Demo Dishes
INSERT INTO dish (name, description, price, image_url, category, available, created_at, updated_at)
VALUES 
    (N'Pizza Margarita', N'Pizza truyền thống với sauce cà chua tươi và mozzarella', 150000, '/images/dishes/8338f9cc-18e1-4eb6-a645-e0db31a6dba5.jpg', N'PIZZA', 1, GETDATE(), GETDATE()),
    (N'Pizza Pepperoni', N'Pizza với lớp pepperoni giòn', 160000, '/images/dishes/a50303f3-63fd-4a37-99cd-173ce94f419f.jpg', N'PIZZA', 1, GETDATE(), GETDATE()),
    (N'Salad Tươi', N'Salad rau quả tươi mát với nước sốt đặc biệt', 85000, '/images/dishes/affbdf96-46c2-409e-910f-79b0e3640b57.jpg', N'SALAD', 1, GETDATE(), GETDATE()),
    (N'Mì Ý', N'Pasta Italy với nước sốt bolognese truyền thống', 120000, '/images/dishes/b0cae360-f366-4c6d-81b9-3df285a3bd90.jpg', N'MỲ', 1, GETDATE(), GETDATE()),
    (N'Nước Cam Tươi', N'Nước cam tươi ép ngay', 25000, '/images/dishes/8338f9cc-18e1-4eb6-a645-e0db31a6dba5.jpg', N'NƯỚC UỐNG', 1, GETDATE(), GETDATE());

-- Insert Demo Customer
INSERT INTO customer (name, phone, table_number, created_at)
VALUES 
    (N'Nguyễn Văn A', '0901234567', 'Bàn 1', GETDATE()),
    (N'Trần Thị B', '0912345678', 'Bàn 2', GETDATE());

-- Insert Demo Orders
INSERT INTO orders (customer_id, status, total_price, payment_method, created_at, updated_at)
VALUES 
    (1, 'PENDING', 140000, 'CASH', GETDATE(), GETDATE());

-- Insert Demo Order Items
INSERT INTO order_item (order_id, dish_id, quantity, price, special_request, created_at)
VALUES 
    (1, 1, 2, 70000, N'Không cay', GETDATE()),
    (1, 4, 2, 5000, N'Nhiều đá', GETDATE());

GO

-- ========================
-- VERIFICATION
-- ========================
PRINT '✅ DATABASE EMENU CREATED SUCCESSFULLY!';
PRINT '📊 Tables Created:';
PRINT '   - customer';
PRINT '   - dish';
PRINT '   - orders';
PRINT '   - order_item';
PRINT '   - admin';
PRINT '';
PRINT '📌 Demo Data Inserted:';
PRINT '   - 2 Admin users';
PRINT '   - 5 Dishes';
PRINT '   - 2 Customers';
PRINT '   - 1 Order with 2 items';
PRINT '';
PRINT '✨ Database is ready for E-Menu application!';
GO
