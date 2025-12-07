using Microsoft.AspNetCore.Mvc;
using Restaurant.DTOs;
using System;
using System.Collections.Generic;

namespace Restaurant.Controllers
{
    [ApiController]
    [Route("api/public")]
    public class PublicController : ControllerBase
    {
        [HttpGet("info")]
        public ActionResult<RestaurantInfoDto> GetInfo()
        {
            var info = new RestaurantInfoDto
            {
                Name = "Nhà Hàng Mẫu",
                Tagline = "Ẩm thực ngon, không gian thân thiện",
                Address = "123 Đường Ẩm Thực, Quận 1",
                Phone = "+84 912 345 678",
                OpenHours = "09:00 - 22:00",
                Description = "Nhà hàng phục vụ các món ăn địa phương và quốc tế.",
                HeroImage = "/hero.jpg"
            };
            return Ok(info);
        }

        [HttpGet("featured-menu")]
        public ActionResult<IEnumerable<MenuItemDto>> GetFeaturedMenu()
        {
            var items = new List<MenuItemDto>
            {
                new MenuItemDto { Id = Guid.NewGuid(), Name = "Phở Bò", Description = "Phở truyền thống", Price = 99000, Image = "/images/pho.jpg" },
                new MenuItemDto { Id = Guid.NewGuid(), Name = "Cơm Tấm", Description = "Cơm tấm Sài Gòn", Price = 85000, Image = "/images/comtam.jpg" },
                new MenuItemDto { Id = Guid.NewGuid(), Name = "Gỏi Cuốn", Description = "Ăn nhẹ, tươi ngon", Price = 59000, Image = "/images/goicuon.jpg" }
            };
            return Ok(items);
        }

        [HttpPost("reservations")]
        public IActionResult CreateReservation([FromBody] ReservationRequestDto req)
        {
            // TODO: persist reservation, send confirmation
            return Created("/api/public/reservations/1", new { message = "Reservation created (stub)" });
        }

        [HttpGet("blogs")]
        public ActionResult<IEnumerable<BlogPostDto>> GetBlogs()
        {
            var posts = new List<BlogPostDto>
            {
                new BlogPostDto { Id = Guid.NewGuid(), Title = "Khuyến mãi cuối tuần", Excerpt = "Giảm 20% cho món chính", Thumbnail = "/images/promo1.jpg", PublishedAt = DateTime.UtcNow.AddDays(-3) },
                new BlogPostDto { Id = Guid.NewGuid(), Title = "Món mới: Bún chả", Excerpt = "Hương vị Hà Nội", Thumbnail = "/images/blog2.jpg", PublishedAt = DateTime.UtcNow.AddDays(-10) }
            };
            return Ok(posts);
        }

        [HttpGet("feedbacks")]
        public ActionResult<IEnumerable<FeedbackDto>> GetFeedbacks()
        {
            var f = new List<FeedbackDto>
            {
                new FeedbackDto { Id = Guid.NewGuid(), UserName = "Nguyen Van A", Rating = 5, Comment = "Dịch vụ tuyệt vời", CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new FeedbackDto { Id = Guid.NewGuid(), UserName = "Tran Thi B", Rating = 4, Comment = "Món ăn ngon, không gian đẹp", CreatedAt = DateTime.UtcNow.AddDays(-2) }
            };
            return Ok(f);
        }
    }
}
