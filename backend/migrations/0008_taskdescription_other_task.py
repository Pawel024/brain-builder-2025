# Generated by Django 4.2.6 on 2024-07-15 08:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0007_alter_basicsdescription_max_order_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskdescription',
            name='other_task',
            field=models.TextField(blank=True, max_length=50, null=True),
        ),
    ]