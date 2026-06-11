from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from users.models import User

class UserLoginForm(AuthenticationForm):
    username = forms.CharField(
        label='Имя пользователя',
        widget = forms.TextInput(attrs={"autofocus": True,
                                        'class': 'auth-input',
                                        'placeholder': 'Введите имя пользователя'}))
    password = forms.CharField(
        label='Пароль',
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password",
                                        'class': 'auth-input',
                                        'placeholder': 'Введите пароль'}),
    )
    class Meta:
        model = User
        fields = ['username', 'password']

class UserRegistrationForm(UserCreationForm):
    class Meta:
        model = User
        fields = (
            "first_name",
            "username",
            "email",
            "password1",
            "password2",
        )

    first_name = forms.CharField()
    username = forms.CharField()
    email = forms.CharField()
    password1 = forms.CharField()
    password2 = forms.CharField()