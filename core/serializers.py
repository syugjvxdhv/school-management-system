from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import FeeRecord, Class, Subject, TimeTable, Attendance, Exam, StudentProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'role', 'role_display', 'phone', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': False}
        }
    
    def create(self, validated_data):
        
        user = User.objects.create_user(**validated_data)
        return user

class ClassSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)

    class Meta:
        model = Class
       
        fields = [
            'id', 'name', 'section', 'monthly_fee', 
            'created_by', 'created_by_name', 'created_at', 'student_count'
        ]
        
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

class SubjectSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='classroom.name', read_only=True)
    class_section = serializers.CharField(source='classroom.section', read_only=True)
    teacher_name = serializers.ReadOnlyField(source='teacher.username')

    class Meta:
        model = Subject
        fields = ['id', 'name', 'classroom', 'class_name', 'class_section', 'teacher', 'teacher_name']

class StudentProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    class_name = serializers.CharField(source='classroom.name', read_only=True)
    class_section = serializers.CharField(source='classroom.section', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    
    assigned_subjects = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'user_details', 'full_name', 'classroom', 
            'class_name', 'class_section', 'roll_number', 'assigned_subjects'
        ]

    def get_assigned_subjects(self, obj):
        
        if obj.classroom:
            subjects = obj.classroom.subjects.all()
            return [subject.name for subject in subjects]
        return []

class TimeTableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='classroom.name', read_only=True)
    class_section = serializers.CharField(source='classroom.section', read_only=True)
    day_display = serializers.CharField(source='get_day_display', read_only=True)
    period_display = serializers.CharField(source='get_period_display', read_only=True)
    teacher_name = serializers.CharField(source='subject.teacher.username', read_only=True)

    class Meta:
        model = TimeTable
        fields = [
            'id', 'day', 'day_display', 'period', 'period_display', 
            'subject', 'subject_name', 'classroom', 'class_name', 
            'class_section', 'teacher_name', 'start_time', 'end_time'
        ]
        extra_kwargs = {
            'subject': {'write_only': False},
            'classroom': {'write_only': False}
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['day_name'] = instance.get_day_display()
        try:
            data['period_label'] = instance.get_period_display()
        except AttributeError:
            data['period_label'] = str(instance.period)
        
        
        if instance.start_time:
            data['time_slot'] = f"{instance.start_time.strftime('%H:%M')} - {instance.end_time.strftime('%H:%M')}"
        else:
            data['time_slot'] = "No Time Set"
            
        return data

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.username', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'date', 'status', 
            'subject', 'subject_name', 'marked_by', 'marked_by_name'
        ]
        read_only_fields = ['marked_by']

class ExamSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='subject.classroom.name', read_only=True)
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = '__all__'

    def get_percentage(self, obj):
        if obj.total_marks > 0:
            return round((obj.marks_obtained / obj.total_marks) * 100, 2)
        return 0

class FeeRecordSerializer(serializers.ModelSerializer):
    
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    class_name = serializers.CharField(source='student.classroom.name', read_only=True)
    
    class_section = serializers.CharField(source='student.classroom.section', read_only=True)
    month_display = serializers.CharField(source='get_month_display', read_only=True)

    class Meta:
        model = FeeRecord
        fields = [
            'id', 'student', 'student_name', 'class_name', 'class_section', 'month', 
            'month_display', 'year', 'amount', 'is_paid', 'payment_date'
        ]
        read_only_fields = ['payment_date']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        if not data.get('student_name'):
            data['student_name'] = f"Student ID: {instance.student.id}"
        return data