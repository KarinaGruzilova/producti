from django import forms
from .models import Category
from .models import Task

class CategoryCreateForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'color', 'emoji', 'description']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'mod2-tasks',
                'placeholder': 'Введите название категории',
                'id': 'category-name'
            }),
            'color': forms.Select(attrs={
                'class': 'color-select-dropdown',
                'id': 'colorSelect'
            }),
            'emoji': forms.HiddenInput(attrs={
                'id': 'emojiInput'
            }),
            'description': forms.HiddenInput(),
        }
    
    def clean_name(self):
        name = self.cleaned_data.get('name', '').strip()
        if not name:
            raise forms.ValidationError('Название категории обязательно')
        if len(name) < 2:
            raise forms.ValidationError('Название должно быть не короче 2 символов')
        return name
    
    def clean_color(self):
        color = self.cleaned_data.get('color', '')
        if not color:
            raise forms.ValidationError('Выберите цвет категории')
        return color
    

 

class TaskForm(forms.ModelForm):
    due_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
    )
    
    class Meta:
        model = Task
        fields = ['category', 'title', 'description', 'due_date', 'duration_seconds']