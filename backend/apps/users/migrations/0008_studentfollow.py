from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_user_city'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentFollow',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата подписки')),
                ('employer', models.ForeignKey(
                    limit_choices_to={'role': 'EMPLOYER'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='following',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Работодатель',
                )),
                ('student', models.ForeignKey(
                    limit_choices_to={'role': 'STUDENT'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='followers',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Студент',
                )),
            ],
            options={
                'verbose_name': 'Отслеживание студента',
                'verbose_name_plural': 'Отслеживания студентов',
                'unique_together': {('employer', 'student')},
            },
        ),
    ]
