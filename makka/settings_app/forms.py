from django import forms
from .models import Settings, KeyVal

class SettingsForm(forms.ModelForm):
    class Meta:
        model = Settings
        fields = ['key', 'value', 'description']
        widgets = {
            'key': forms.TextInput(attrs={
                'class': 'modern-input',
                'placeholder': 'أدخل مفتاح الإعداد'
            }),
            'value': forms.Textarea(attrs={
                'class': 'modern-textarea',
                'placeholder': 'أدخل قيمة الإعداد',
                'rows': 3
            }),
            'description': forms.Textarea(attrs={
                'class': 'modern-textarea',
                'placeholder': 'أدخل وصف الإعداد',
                'rows': 2
            }),
        }
        labels = {
            'key': 'المفتاح',
            'value': 'القيمة',
            'description': 'الوصف',
        }

class KeyValForm(forms.ModelForm):
    class Meta:
        model = KeyVal
        fields = ['key', 'value']
        widgets = {
            'key': forms.TextInput(attrs={
                'class': 'modern-input',
                'placeholder': 'أدخل المفتاح'
            }),
            'value': forms.Textarea(attrs={
                'class': 'modern-textarea',
                'placeholder': 'أدخل القيمة',
                'rows': 3
            }),
        }
        labels = {
            'key': 'المفتاح',
            'value': 'القيمة',
        }