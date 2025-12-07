using System.ComponentModel.DataAnnotations;

namespace Restaurant.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string UserName { get; set; }
        [Required]
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string PasswordHash { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
