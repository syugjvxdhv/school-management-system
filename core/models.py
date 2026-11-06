from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        (1, 'Admin'),
        (2, 'Teacher'),
        (3, 'Student'),
    )
    role = models.IntegerField(choices=ROLE_CHOICES, default=1)
    phone = models.CharField(max_length=15, blank=True)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='school_user_groups',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='school_user_permissions',
        blank=True
    )
    
    @property
    def is_admin(self):
        return self.role == 1

    @property
    def is_teacher(self):
        return self.role == 2

    @property
    def is_student(self):
        return self.role == 3

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Class(models.Model):
    name = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    # Naya Feature: Har class ki monthly fee fix karne ke liye
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Classes"

    def __str__(self):
        return f"{self.name}-{self.section}"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    classroom = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='subjects')
    teacher = models.ForeignKey(User, limit_choices_to={'role': 2}, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.classroom})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 3})
    classroom = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='students')
    roll_number = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.user.username} - Roll: {self.roll_number}"


class TimeTable(models.Model):
    DAY_CHOICES = (
        (1, 'Monday'), (2, 'Tuesday'), (3, 'Wednesday'),
        (4, 'Thursday'), (5, 'Friday'), (6, 'Saturday'),
    )
    day = models.IntegerField(choices=DAY_CHOICES)
    period = models.IntegerField(choices=[(i, f'Period {i}') for i in range(1, 8)])
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    classroom = models.ForeignKey(Class, on_delete=models.CASCADE)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.get_day_display()} - {self.subject.name} (Period {self.period})"
    

class Attendance(models.Model):
    
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Leave', 'Leave'),
    )
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Present')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    marked_by = models.ForeignKey(User, related_name='marked_attendance', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('student', 'date', 'subject')


class Exam(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    exam_type = models.CharField(max_length=100)
    marks_obtained = models.PositiveIntegerField()
    total_marks = models.PositiveIntegerField()
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.subject.name} ({self.exam_type})"


class FeeRecord(models.Model):
    MONTH_CHOICES = [
        (1, 'January'), (2, 'February'), (3, 'March'), (4, 'April'),
        (5, 'May'), (6, 'June'), (7, 'July'), (8, 'August'),
        (9, 'September'), (10, 'October'), (11, 'November'), (12, 'December')
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='fees')
    month = models.IntegerField(choices=MONTH_CHOICES)
    monthly_fee = models.IntegerField(default=0)
    year = models.IntegerField(default=2026)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateField(null=True, blank=True)