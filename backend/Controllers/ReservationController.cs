using Microsoft.AspNetCore.Mvc;
using Restaurant.Models;

namespace Restaurant.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAll()
        {
            // TODO: return reservations from DB via service
            return Ok(new[] { new Reservation { Id = System.Guid.NewGuid(), UserId = System.Guid.Empty, Date = System.DateTime.UtcNow, GuestCount = 4, Status = "Pending" } });
        }

        [HttpPost]
        public IActionResult Create([FromBody] Reservation req)
        {
            // TODO: validation and creation
            req.Id = System.Guid.NewGuid();
            return CreatedAtAction(nameof(GetAll), new { id = req.Id }, req);
        }
    }
}
