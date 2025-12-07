using Microsoft.AspNetCore.Mvc;
using Restaurant.DTOs;

namespace Restaurant.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            // TODO: implement real auth -> validate, issue JWT
            if (req.Email == "admin@restaurant.local" && req.Password == "password")
            {
                return Ok(new { token = "fake-jwt-token-for-dev" });
            }
            return Unauthorized();
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest req)
        {
            // TODO: create user via UserService
            return Created("/api/users/123", new { message = "User created (stub)" });
        }
    }
}
