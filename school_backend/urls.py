from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Explicitly import the views to avoid 'name not defined' errors
from core.views import (
    UserViewset,
    ClassViewSet,
    SubjectViewSet,
    TimeTableViewSet,
    AttendanceViewSet,
    ExamViewSet,
    StudentProfileViewSet,
    FeeViewSet,
    get_current_user
)

# 1. Initialize the Router
router = DefaultRouter()

# 2. Register all ViewSets
router.register(r'users', UserViewset, basename='user-manage')
router.register(r'classes', ClassViewSet, basename='class-manage')
router.register(r'subjects', SubjectViewSet, basename='subject-manage')
router.register(r'timetable', TimeTableViewSet, basename='timetable-manage')
router.register(r'attendance', AttendanceViewSet, basename='attendance-manage')
router.register(r'exams', ExamViewSet, basename='exam-manage')
router.register(r'student-profile', StudentProfileViewSet, basename='student-profile-manage')
router.register(r'fees', FeeViewSet, basename='fee-manage')

# 3. URL Patterns
urlpatterns = [
    # Django Admin Interface
    path('admin/', admin.site.urls),
    
    # JWT Authentication Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Identity Helper Endpoint
    path('api/users/me/', get_current_user, name='current_user_info'),
    
    # All Automated Router URLs
    path('api/', include(router.urls)),
]