package emenu.e_menu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

import emenu.e_menu.service.AdminService;

@SpringBootApplication
public class EMenuApplication {

	public static void main(String[] args) {
		ApplicationContext context = SpringApplication.run(EMenuApplication.class, args);
		
		// Initialize default admin
		AdminService adminService = context.getBean(AdminService.class);
		adminService.initializeDefaultAdmin();
	}

}
