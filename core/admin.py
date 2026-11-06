from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import *
# Register your models here.
User = get_user_model()
admin.site.register(User)
admin.site.register(Class)
admin.site.register(Subject)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'classroom', 'roll_number') # Table mein columns dikhane ke liye
    list_filter = ('classroom',) # Side mein filter lagane ke liye
    search_fields = ('roll_number', 'user__username') # Search bar add karne ke liye
admin.site.register(StudentProfile, StudentProfileAdmin)
admin.site.register(TimeTable)
admin.site.register(Attendance)
admin.site.register(Exam)
admin.site.register(FeeRecord)