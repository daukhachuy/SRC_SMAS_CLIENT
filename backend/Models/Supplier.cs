using System.ComponentModel.DataAnnotations;

namespace Restaurant.Models
{
    public class Supplier
    {
        [Key]
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string ContactInfo { get; set; }
    }
}
