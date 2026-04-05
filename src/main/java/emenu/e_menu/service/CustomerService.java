package emenu.e_menu.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import emenu.e_menu.dto.CustomerDTO;
import emenu.e_menu.entity.Customer;
import emenu.e_menu.repository.CustomerRepository;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;

    public CustomerDTO createOrGetCustomer(String name, String phone, String tableNumber) {
        Customer existingCustomer = customerRepository.findByPhone(phone);
        
        if (existingCustomer != null) {
            existingCustomer.setTableNumber(tableNumber);
            existingCustomer = customerRepository.save(existingCustomer);
        } else {
            Customer newCustomer = new Customer();
            newCustomer.setName(name);
            newCustomer.setPhone(phone);
            newCustomer.setTableNumber(tableNumber);
            newCustomer.setCreatedAt(LocalDateTime.now());
            existingCustomer = customerRepository.save(newCustomer);
        }
        
        return convertToDTO(existingCustomer);
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id).orElse(null);
        return customer != null ? convertToDTO(customer) : null;
    }

    public CustomerDTO getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone);
        return customer != null ? convertToDTO(customer) : null;
    }

    private CustomerDTO convertToDTO(Customer customer) {
        return new CustomerDTO(
            customer.getId(),
            customer.getName(),
            customer.getPhone(),
            customer.getTableNumber()
        );
    }
}
