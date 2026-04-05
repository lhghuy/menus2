package emenu.e_menu.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import emenu.e_menu.entity.Dish;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByCategory(String category);
    List<Dish> findByAvailableTrue();
    List<Dish> findByNameContainingIgnoreCase(String name);
}
