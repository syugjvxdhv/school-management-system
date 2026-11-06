from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.timezone import now
from .models import StudentProfile, Class, Subject, TimeTable, Attendance, Exam, FeeRecord
from .serializers import (
    UserSerializer, StudentProfileSerializer, ClassSerializer, 
    SubjectSerializer, TimeTableSerializer, AttendanceSerializer, 
    ExamSerializer, FeeRecordSerializer
)

User = get_user_model()

# --- CUSTOM PERMISSIONS ---

class IsAdminUser(permissions.BasePermission):
    """Allows access only to Admin users (Role 1)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 1 or request.user.is_staff))

class IsTeacherUser(permissions.BasePermission):
    """Allows access only to Teacher users (Role 2)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 2)

class IsAdminOrTeacher(permissions.BasePermission):
    """Allows Write access to Admins/Teachers, and Read access to Authenticated users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in [1, 2] or request.user.is_staff)
        )

# --- FUNCTIONAL VIEWS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Endpoint for React to get logged-in user details."""
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "role": request.user.role, 
        "is_staff": request.user.is_staff,
        "email": request.user.email
    })

# --- VIEWSETS ---

class UserViewset(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser] # Only Admins can manage users

class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        if user.role == 3:  # Student
            return StudentProfile.objects.filter(user=user)
        return StudentProfile.objects.all()

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def perform_create(self, serializer):
        
        serializer.save(created_by=self.request.user)

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

class TimeTableViewSet(viewsets.ModelViewSet):
    serializer_class = TimeTableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 1 or user.is_staff:
            return TimeTable.objects.all()
        
        elif user.role == 3:
            
            student_profile = getattr(user, 'student_profile', None)
            if student_profile:
                return TimeTable.objects.filter(classroom=student_profile.classroom).order_by('day', 'period')
            return TimeTable.objects.none()
        
        return TimeTable.objects.filter(subject__teacher=user)

class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        if user.role in [1, 2] or user.is_staff:
            return Exam.objects.all()
        return Exam.objects.filter(student__user=user)

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        
        if user.role in [1, 2] or user.is_staff:
            queryset = Attendance.objects.all()
        else:
            queryset = Attendance.objects.filter(student__user=user)

        
        classroom = self.request.query_params.get('classroom')
        subject = self.request.query_params.get('subject')
        date = self.request.query_params.get('date')

        if classroom:
            queryset = queryset.filter(student__classroom_id=classroom)
        if subject:
            queryset = queryset.filter(subject_id=subject)
        if date:
            queryset = queryset.filter(date=date)
            
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrTeacher])
    def bulk_mark(self, request):
        class_id = request.data.get('class_id')
        subject_id = request.data.get('subject_id')
        attendance_date = request.data.get('date')
        
        
        students_attendance_data = request.data.get('students_data', []) 

        if not all([class_id, subject_id, attendance_date]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        students = StudentProfile.objects.filter(classroom_id=class_id)
        if not students.exists():
            return Response({"error": "No students found in this class"}, status=status.HTTP_404_NOT_FOUND)

        
        status_dict = {item['student_id']: item['status'] for item in students_attendance_data}

        try:
            with transaction.atomic():
                
                Attendance.objects.filter(
                    date=attendance_date, 
                    subject_id=subject_id, 
                    student__in=students
                ).delete()
                
                
                attendance_list = [
                    Attendance(
                        student=sp,
                        date=attendance_date,
                        # Agar frontend se kisi student ka data nahi mila to default 'Present' save hoga
                        status=status_dict.get(sp.id, 'Present'), 
                        subject_id=subject_id,
                        marked_by=request.user
                    ) for sp in students
                ]
                
                Attendance.objects.bulk_create(attendance_list)
                
            return Response({"message": "Attendance processed successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
class FeeViewSet(viewsets.ModelViewSet):
    queryset = FeeRecord.objects.all()
    serializer_class = FeeRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
       
        if user.role == 3:
            return FeeRecord.objects.filter(student__user=user)
        
        
        student_id = self.request.query_params.get('student_id')
        if student_id:
            return FeeRecord.objects.filter(student_id=student_id)
        return FeeRecord.objects.all()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_paid(self, request, pk=None):
        """Mark a fee record as paid. Restricted to Admins."""
        fee = self.get_object()
        if fee.is_paid:
            return Response({'error': 'Fee is already paid'}, status=status.HTTP_400_BAD_REQUEST)
        
        fee.is_paid = True
        fee.payment_date = now().date()
        fee.save()
        return Response({
            'status': 'Fee marked as paid', 
            'payment_date': fee.payment_date
        }, status=status.HTTP_200_OK)