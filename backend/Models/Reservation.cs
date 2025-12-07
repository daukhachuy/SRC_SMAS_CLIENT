using System.ComponentModel.DataAnnotations;

namespace Restaurant.Models
{
    public class Reservation
    {
        [Key]
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTime Date { get; set; }
        public int GuestCount { get; set; }
        public string Status { get; set; } // Pending, Confirmed, Cancelled
    }
}
