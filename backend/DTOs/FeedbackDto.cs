using System;

namespace Restaurant.DTOs
{
    public class FeedbackDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
