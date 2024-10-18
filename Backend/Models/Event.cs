using System;
using System.Collections.Generic;

namespace FaceReconigtion.Models;

public partial class Event
{
    public int Eventid { get; set; }

    public string? Eventname { get; set; }

    public DateTime? Dateofevent { get; set; }

    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
