# Generated by Django 4.2.6 on 2025-01-27 16:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0013_taskdescription_enabled'),
    ]

    operations = [
        migrations.AddField(
            model_name='intro',
            name='enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='quiz',
            name='enabled',
            field=models.BooleanField(default=True),
        ),
    ]
