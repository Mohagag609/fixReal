# Generated manually for Partner Daily System

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounting_app', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PartnerDailyTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='تاريخ الحذف')),
                ('transaction_type', models.CharField(choices=[('income', 'دخل'), ('expense', 'مصروف'), ('closing', 'إقفال يومي')], max_length=50, verbose_name='نوع المعاملة')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15, verbose_name='المبلغ')),
                ('description', models.TextField(verbose_name='البيان')),
                ('transaction_date', models.DateField(verbose_name='تاريخ المعاملة')),
                ('partner_share', models.DecimalField(decimal_places=2, default=0, max_digits=5, verbose_name='نسبة الشريك')),
                ('running_balance', models.DecimalField(decimal_places=2, default=0, max_digits=15, verbose_name='الرصيد المتراكم')),
                ('contract', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='partner_daily_transactions', to='accounting_app.contract', verbose_name='العقد')),
                ('partner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='daily_transactions', to='accounting_app.partner', verbose_name='الشريك')),
                ('unit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='partner_daily_transactions', to='accounting_app.unit', verbose_name='الوحدة')),
            ],
            options={
                'verbose_name': 'معاملة يومية للشريك',
                'verbose_name_plural': 'المعاملات اليومية للشركاء',
            },
        ),
        migrations.CreateModel(
            name='PartnerLedger',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='تاريخ الحذف')),
                ('date', models.DateField(verbose_name='التاريخ')),
                ('total_income', models.DecimalField(decimal_places=2, default=0, max_digits=15, verbose_name='إجمالي الدخل')),
                ('total_expense', models.DecimalField(decimal_places=2, default=0, max_digits=15, verbose_name='إجمالي المصروفات')),
                ('net_balance', models.DecimalField(decimal_places=2, default=0, max_digits=15, verbose_name='الرصيد الصافي')),
                ('transaction_count', models.PositiveIntegerField(default=0, verbose_name='عدد المعاملات')),
                ('partner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ledgers', to='accounting_app.partner', verbose_name='الشريك')),
            ],
            options={
                'verbose_name': 'كشف حساب الشريك',
                'verbose_name_plural': 'كشوف حسابات الشركاء',
            },
        ),
        migrations.AddIndex(
            model_name='partnerdailytransaction',
            index=models.Index(fields=['partner', 'transaction_date'], name='accounting__partner_2b8a8a_idx'),
        ),
        migrations.AddIndex(
            model_name='partnerdailytransaction',
            index=models.Index(fields=['transaction_type', 'deleted_at'], name='accounting__transac_8b8a8a_idx'),
        ),
        migrations.AddIndex(
            model_name='partnerdailytransaction',
            index=models.Index(fields=['transaction_date'], name='accounting__transac_8b8a8a_idx'),
        ),
        migrations.AddIndex(
            model_name='partnerledger',
            index=models.Index(fields=['partner', 'date'], name='accounting__partner_8b8a8a_idx'),
        ),
        migrations.AddIndex(
            model_name='partnerledger',
            index=models.Index(fields=['date'], name='accounting__date_8b8a8a_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='partnerledger',
            unique_together={('partner', 'date')},
        ),
    ]