using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace Restaurant.Models
{
    public class Recipe
    {
        [Key]
        public Guid Id { get; set; }
        public Guid MenuItemId { get; set; }
        // A real implementation would use a join table RecipeIngredient
        public string Notes { get; set; }
    }
}
