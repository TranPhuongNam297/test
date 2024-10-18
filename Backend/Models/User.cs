using System.Collections.Generic;

namespace FaceReconigtion.Models;

public partial class User
{
    public int Id { get; set; }

    public string? Lastname { get; set; }

    public string? Firstname { get; set; }

    public string? ImageName { get; set; }

    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
}
