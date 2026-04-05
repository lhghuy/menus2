package emenu.e_menu.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import emenu.e_menu.dto.DishDTO;
import emenu.e_menu.entity.Dish;
import emenu.e_menu.repository.DishRepository;

@Service
public class DishService {
    @Autowired
    private DishRepository dishRepository;

    public DishDTO addDish(DishDTO dishDTO) {
        Dish dish = new Dish();
        dish.setName(dishDTO.getName());
        dish.setDescription(dishDTO.getDescription());
        dish.setPrice(dishDTO.getPrice());
        dish.setImageUrl(dishDTO.getImageUrl());
        dish.setCategory(dishDTO.getCategory());
        dish.setAvailable(true);
        dish.setCreatedAt(LocalDateTime.now());
        dish.setUpdatedAt(LocalDateTime.now());

        Dish savedDish = dishRepository.save(dish);
        return convertToDTO(savedDish);
    }

    public DishDTO updateDish(Long id, DishDTO dishDTO) {
        Dish dish = dishRepository.findById(id).orElse(null);
        if (dish != null) {
            dish.setName(dishDTO.getName());
            dish.setDescription(dishDTO.getDescription());
            dish.setPrice(dishDTO.getPrice());
            dish.setImageUrl(dishDTO.getImageUrl());
            dish.setCategory(dishDTO.getCategory());
            dish.setAvailable(dishDTO.getAvailable());
            dish.setUpdatedAt(LocalDateTime.now());
            Dish updatedDish = dishRepository.save(dish);
            return convertToDTO(updatedDish);
        }
        return null;
    }

    public void deleteDish(Long id) {
        dishRepository.deleteById(id);
    }

    public DishDTO getDishById(Long id) {
        Dish dish = dishRepository.findById(id).orElse(null);
        return dish != null ? convertToDTO(dish) : null;
    }

    public List<DishDTO> getAllDishes() {
        return dishRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DishDTO> getDishesByCategory(String category) {
        return dishRepository.findByCategory(category).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DishDTO> getAvailableDishes() {
        return dishRepository.findByAvailableTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DishDTO> searchDishes(String keyword) {
        return dishRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private DishDTO convertToDTO(Dish dish) {
        return new DishDTO(
            dish.getId(),
            dish.getName(),
            dish.getDescription(),
            dish.getPrice(),
            dish.getImageUrl(),
            dish.getCategory(),
            dish.getAvailable()
        );
    }
}
