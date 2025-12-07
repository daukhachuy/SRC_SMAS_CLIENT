using System.ComponentModel.DataAnnotations;

namespace Restaurant.Models
{
    public class InventoryItem
    {
        [Key]
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Unit { get; set; }
        public decimal QuantityOnHand { get; set; }
        public decimal ReorderLevel { get; set; }
    }
}
