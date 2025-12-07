using Microsoft.EntityFrameworkCore;
using Restaurant.Models;

namespace Restaurant.Data
{
    public class RestaurantDbContext : DbContext
    {
        public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Restaurant.Models.Restaurant> Restaurants { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<InventoryItem> InventoryItems { get; set; }
        public DbSet<Recipe> Recipes { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<BlogPost> BlogPosts { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<AdminLog> AdminLogs { get; set; }
        public DbSet<Shift> Shifts { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
    }
}
