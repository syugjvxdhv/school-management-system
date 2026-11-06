import os
import django
import random

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_backend.settings')
django.setup()

from core.models import User, StudentProfile, Class, Subject

def seed_data():
    print("🚀 Starting Dummy Data Generation...")

    # 1. Classroom check karein ya banayein
    if not Class.objects.exists():
        Class.objects.create(name="ONE", section="A")
        Class.objects.create(name="TWO", section="B")
    
    classes = list(Class.objects.all())

    # 2. Kuch Teachers banayein (Role 2)
    for i in range(2):
        username = f'Teacher_{random.randint(100, 999)}'
        if not User.objects.filter(username=username).exists():
            t_user = User.objects.create_user(
                username=username,
                password='password123',
                role=2
            )
            print(f"✅ Teacher Created: {t_user.username}")

    # 3. 15 Students banayein (Role 3)
    count = 0
    while count < 15:
        # Random username aur unique roll number generate karein
        username = f'Student_{random.randint(1000, 9999)}'
        random_roll = random.randint(1000, 9999) # Bara number use karein taaki purane se match na ho
        
        # Check karein ke username ya roll number pehle se toh nahi hai
        user_exists = User.objects.filter(username=username).exists()
        roll_exists = StudentProfile.objects.filter(roll_number=random_roll).exists()

        if not user_exists and not roll_exists:
            s_user = User.objects.create_user(
                username=username,
                password='password123',
                role=3
            )
            
            StudentProfile.objects.create(
                user=s_user,
                classroom=random.choice(classes),
                roll_number=random_roll
            )
            print(f"✅ Student Created: {s_user.username} (Roll: {random_roll})")
            count += 1

    print("\n✨ Done! Roll number conflict fixed. Check your React Dashboard.")

if __name__ == '__main__':
    seed_data()