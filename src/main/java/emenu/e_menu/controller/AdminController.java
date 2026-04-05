package emenu.e_menu.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import emenu.e_menu.dto.AdminLoginDTO;
import emenu.e_menu.entity.Admin;
import emenu.e_menu.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    @Autowired
    private AdminService adminService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginDTO loginDTO) {
        Admin admin = adminService.loginAdmin(loginDTO.getUsername(), loginDTO.getPassword());
        if (admin != null) {
            return ResponseEntity.ok(admin);
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/init")
    public ResponseEntity<String> initializeDefaultAdmin() {
        adminService.initializeDefaultAdmin();
        return ResponseEntity.ok("Default admin initialized");
    }
}
