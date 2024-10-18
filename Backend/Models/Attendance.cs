
using System;
using System.Collections.Generic;

namespace FaceReconigtion.Models;

public partial class Attendance
{
    public int Id { get; set; }

    public int Userid { get; set; }

    public int Eventid { get; set; }

    public DateTime? Createdat { get; set; }

    public virtual Event Event { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
