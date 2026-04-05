package emenu.e_menu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = new File(System.getProperty("user.dir"), 
            "src/main/resources/static/images/dishes").getAbsolutePath();
        
        registry.addResourceHandler("/images/dishes/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }
}
