package emenu.e_menu.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import emenu.e_menu.dto.OrderDTO;
import emenu.e_menu.dto.OrderItemDTO;
import emenu.e_menu.entity.Customer;
import emenu.e_menu.entity.Dish;
import emenu.e_menu.entity.Order;
import emenu.e_menu.entity.OrderItem;
import emenu.e_menu.repository.CustomerRepository;
import emenu.e_menu.repository.DishRepository;
import emenu.e_menu.repository.OrderItemRepository;
import emenu.e_menu.repository.OrderRepository;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private CustomerRepository customerRepository;

    public OrderDTO createOrder(Long customerId) {
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return null;
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setStatus("PENDING");
        order.setTotalPrice(BigDecimal.ZERO);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    public OrderDTO addItemToOrder(Long orderId, Long dishId, Integer quantity, String specialRequest) {
        Order order = orderRepository.findById(orderId).orElse(null);
        Dish dish = dishRepository.findById(dishId).orElse(null);

        if (order == null || dish == null) {
            return null;
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setDish(dish);
        orderItem.setQuantity(quantity);
        orderItem.setPrice(dish.getPrice());
        orderItem.setSpecialRequest(specialRequest);
        orderItem.setCreatedAt(LocalDateTime.now());

        orderItemRepository.save(orderItem);

        // Update total price
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        BigDecimal totalPrice = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalPrice(totalPrice);
        order.setUpdatedAt(LocalDateTime.now());
        Order updatedOrder = orderRepository.save(order);

        return convertToDTO(updatedOrder);
    }

    public OrderDTO confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus("CONFIRMED");
            order.setUpdatedAt(LocalDateTime.now());
            Order updatedOrder = orderRepository.save(order);
            return convertToDTO(updatedOrder);
        }
        return null;
    }

    public OrderDTO updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus(status);
            order.setUpdatedAt(LocalDateTime.now());
            if ("PAID".equals(status)) {
                order.setPaidAt(LocalDateTime.now());
            }
            Order updatedOrder = orderRepository.save(order);
            return convertToDTO(updatedOrder);
        }
        return null;
    }

    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        return order != null ? convertToDTO(order) : null;
    }

    public List<OrderDTO> getOrdersByCustomerId(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void removeItemFromOrder(Long orderId, Long orderItemId) {
        orderItemRepository.deleteById(orderItemId);
        
        // Recalculate total
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            BigDecimal totalPrice = items.stream()
                    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            order.setTotalPrice(totalPrice);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }
    }

    private OrderDTO convertToDTO(Order order) {
        List<OrderItemDTO> itemDTOs = orderItemRepository.findByOrderId(order.getId()).stream()
                .map(item -> new OrderItemDTO(
                    item.getId(),
                    item.getDish().getId(),
                    item.getDish().getName(),
                    item.getQuantity(),
                    item.getSpecialRequest()
                ))
                .collect(Collectors.toList());

        return new OrderDTO(
            order.getId(),
            order.getCustomer().getId(),
            order.getCustomer().getName(),
            order.getCustomer().getPhone(),
            order.getStatus(),
            order.getTotalPrice(),
            itemDTOs,
            order.getPaymentMethod(),
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }
}
