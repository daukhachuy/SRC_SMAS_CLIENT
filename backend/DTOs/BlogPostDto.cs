using System;

namespace Restaurant.DTOs
{
    public class BlogPostDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Excerpt { get; set; }
        public string Thumbnail { get; set; }
        public DateTime PublishedAt { get; set; }
    }
}
