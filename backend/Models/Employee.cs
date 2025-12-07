using System.ComponentModel.DataAnnotations;

namespace Restaurant.Models
{
    public class Employee
    {
        [Key]
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; } // e.g., Manager, Chef, Waiter
        public string Email { get; set; }
        public string Phone { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
