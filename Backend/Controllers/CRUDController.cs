using FaceReconigtion.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace FaceReconigtion.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class CRUDController : ControllerBase
    {
        private EventDatabaseContext _context;
        public CRUDController(EventDatabaseContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAllUser()
        {
            return await _context.Users.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUserByID(int id)
        {

            var user = await _context.Users.FindAsync(id);

            if (user == null) return NotFound();
            return user;
        }

        [HttpPost]
        public async Task<ActionResult<User>> AddUser(IFormFile file
            , string FirstName, string LastName
            ) {

            var user = new User();

            user.Firstname = FirstName;
            user.Lastname = LastName;

            if(file == null) return BadRequest("No File Founded");

            var fileName = file.FileName;
            var path = Path.Combine("./Upload", fileName);

            if(Path.GetDirectoryName(path) == string.Empty)
                Directory.CreateDirectory(Path.GetDirectoryName(path));

            using (var stream = new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            user.ImageName = path;
            return Ok(user);


            //_context.Users.Add(user);

            
        }


    }
}
