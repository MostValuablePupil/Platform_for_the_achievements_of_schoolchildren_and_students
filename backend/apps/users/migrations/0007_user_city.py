from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_user_organization_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='city',
            field=models.CharField(blank=True, default='', help_text='Город проживания', max_length=100, verbose_name='Город'),
        ),
    ]
