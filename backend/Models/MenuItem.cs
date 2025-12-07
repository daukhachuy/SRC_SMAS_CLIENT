using System.ComponentModel.DataAnnotations;

namespace Restaurant.Models
{
    public class MenuItem
    {
        [Key]
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; } = true;
    }
}
