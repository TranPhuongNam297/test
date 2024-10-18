using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace FaceReconigtion.Models;

public partial class EventDatabaseContext : DbContext
{
    public EventDatabaseContext()
    {
    }

    public EventDatabaseContext(DbContextOptions<EventDatabaseContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Attendance> Attendances { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=DESKTOP-2O897OT\\SQLEXPRESS;Initial Catalog=EventDatabase;Integrated Security=True;TrustServerCertificate=true;User Id=sa;Password=123; TrustServerCertificate=true");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.ToTable("ATTENDANCE");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("CREATEDAT");
            entity.Property(e => e.Eventid).HasColumnName("EVENTID");
            entity.Property(e => e.Userid).HasColumnName("USERID");

            entity.HasOne(d => d.Event).WithMany(p => p.Attendances)
                .HasForeignKey(d => d.Eventid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ATTENDANCE_EVENT");

            entity.HasOne(d => d.User).WithMany(p => p.Attendances)
                .HasForeignKey(d => d.Userid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ATTENDANCE_USER");
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.Eventid).HasName("PK_EVENTS");

            entity.Property(e => e.Eventid).HasColumnName("EVENTID");
            entity.Property(e => e.Dateofevent)
                .HasColumnType("datetime")
                .HasColumnName("DATEOFEVENT");
            entity.Property(e => e.Eventname)
                .HasMaxLength(100)
                .HasColumnName("EVENTNAME");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_USERS");

            entity.Property(e => e.Id).HasColumnName("ID");
            entity.Property(e => e.Firstname)
                .HasMaxLength(50)
                .HasColumnName("FIRSTNAME");
            entity.Property(e => e.ImageName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("IMAGE_NAME");
            entity.Property(e => e.Lastname)
                .HasMaxLength(50)
                .HasColumnName("LASTNAME");

            entity.HasMany(d => d.Events).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserEvent",
                    r => r.HasOne<Event>().WithMany()
                        .HasForeignKey("Eventid")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_USER_EVENT_EVENT"),
                    l => l.HasOne<User>().WithMany()
                        .HasForeignKey("Userid")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_USER_EVENT_USERS"),
                    j =>
                    {
                        j.HasKey("Userid", "Eventid").HasName("PK_USER_EVENT");
                        j.ToTable("User_Events");
                        j.IndexerProperty<int>("Userid").HasColumnName("USERID");
                        j.IndexerProperty<int>("Eventid").HasColumnName("EVENTID");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
