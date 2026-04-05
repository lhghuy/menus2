package emenu.e_menu.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import emenu.e_menu.entity.Admin;
import emenu.e_menu.repository.AdminRepository;

@Service
public class AdminService {
    @Autowired
    private AdminRepository adminRepository;

    public void initializeDefaultAdmin() {
        Admin existingAdmin = adminRepository.findByUsername("admin");
        if (existingAdmin == null) {
            Admin admin = new Admin();
            admin.setUsername("admin");
            admin.setPassword("admin123"); // In production, use hashed password
            admin.setEmail("admin@emenu.com");
            admin.setFullname("Administrator");
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            adminRepository.save(admin);
        }
    }

    public Admin loginAdmin(String username, String password) {
        Admin admin = adminRepository.findByUsername(username);
        if (admin != null && admin.getPassword().equals(password) && admin.getActive()) {
            return admin;
        }
        return null;
    }

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }
}
