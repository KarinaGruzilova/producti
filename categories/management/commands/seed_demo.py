# categories/management/commands/seed_demo.py
#
# Установка: положить файл в categories/management/commands/seed_demo.py
# (создать пустые __init__.py в management/ и management/commands/ если их нет)
#
# Запуск: python manage.py seed_demo
#
# Создаёт трёх демо-пользователей с категориями, задачами (план + выполненные
# через фокус-сессии) и целями, по сценарию недели 15-21 июня 2026
# (сегодня в сценарии — 18 июня).

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, time as dtime
from django.db import transaction

from users.models import User
from categories.models import Category, Task
from categories.models import Goal


class Command(BaseCommand):
    help = 'Создаёт демо-данных для трёх пользователей (Анна, Алексей, Мария)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Удалить демо-пользователей перед созданием (anna_demo, alex_demo, maria_demo)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            User.objects.filter(
                username__in=['anna_demo', 'alex_demo', 'maria_demo']
            ).delete()
            self.stdout.write(self.style.WARNING('Старые демо-пользователи удалены'))

        with transaction.atomic():
            self.create_anna()
            self.create_alex()
            self.create_maria()

        self.stdout.write(self.style.SUCCESS('✅ Демо-данные успешно созданы!'))
        self.stdout.write('Логины: anna_demo / alex_demo / maria_demo')
        self.stdout.write('Пароль для всех: demo12345')

    # ──────────────────────────────────────────────
    # ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    # ──────────────────────────────────────────────

    def get_or_create_user(self, username, first_name, email):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'first_name': first_name, 'email': email}
        )
        if created:
            user.set_password('demo12345')
            user.save()
        return user

    def make_category(self, user, name, emoji, color):
        cat, _ = Category.objects.get_or_create(
            user=user, name=name,
            defaults={'emoji': emoji, 'color': color}
        )
        return cat

    def day_date(self, weekday_offset):
        """
        weekday_offset: 0=Пн, 1=Вт, ... 6=Вс недели 15-21 июня 2026.
        Возвращает date.
        """
        monday = datetime(2026, 6, 15).date()
        return monday + timedelta(days=weekday_offset)

    def make_planned_task(self, user, category, title, weekday_offset, completed=False):
        Task.objects.create(
            user=user,
            category=category,
            title=title[:100],
            description='',
            duration_seconds=0,
            completed=completed,
            due_date=self.day_date(weekday_offset),
            source='planned',
        )

    def make_focus_task(self, user, category, title, weekday_offset, duration_seconds, start_hour, start_minute=0):
        """Создаёт выполненную задачу через фокус-сессию с конкретным временем создания."""
        task = Task.objects.create(
            user=user,
            category=category,
            title=title[:100],
            description='',
            duration_seconds=duration_seconds,
            completed=True,
            source='focus',
        )
        # Подменяем created_at на нужный день/время (18 июня 2026 — "сегодня" сценария)
        naive_dt = datetime(2026, 6, 18, start_hour, start_minute)
        aware_dt = timezone.make_aware(naive_dt)
        Task.objects.filter(pk=task.pk).update(created_at=aware_dt, updated_at=aware_dt)

    def make_overdue_task(self, user, category, title, days_ago, completed=False):
        due = datetime(2026, 6, 18).date() - timedelta(days=days_ago)
        Task.objects.create(
            user=user, category=category, title=title[:100],
            description='', duration_seconds=0, completed=completed,
            due_date=due, source='planned',
        )

    def make_goal(self, user, category, title, goal_type, target_value, period='week'):
        Goal.objects.create(
            user=user, category=category, title=title[:100],
            goal_type=goal_type, target_value=target_value, period=period,
        )

    # ──────────────────────────────────────────────
    # ПОЛЬЗОВАТЕЛЬ 1 — АННА (студентка-химик)
    # ──────────────────────────────────────────────

    def create_anna(self):
        user = self.get_or_create_user('anna_demo', 'Анна', 'anna_demo@example.com')

        chem  = self.make_category(user, 'Органическая химия', '🧪', '#B5EAD7')
        thesis= self.make_category(user, 'Дипломная работа', '📝', '#C7CEEA')
        math  = self.make_category(user, 'Высшая математика', '🧮', '#FFDAC1')
        eng   = self.make_category(user, 'Английский язык', '🇬🇧', '#FFB6C1')
        rest  = self.make_category(user, 'Сон и отдых', '🧘‍♀️', '#E2F0CB')

        # Цели на неделю
        self.make_goal(user, chem,   '20 часов органической химии',   'time',  20)
        self.make_goal(user, thesis, '15 часов на дипломную работу',  'time',  15)
        self.make_goal(user, math,   '12 задач по высшей математике', 'tasks', 12)
        self.make_goal(user, eng,    '7 часов английского',           'time',  7)

        # Запланированные задачи на неделю
        self.make_planned_task(user, thesis, 'Написать введение к диплому', 0, completed=True)
        self.make_planned_task(user, chem,   'Решить 5 задач по ароматике', 0, completed=True)
        self.make_planned_task(user, chem,   'Сдать коллоквиум по химии', 1, completed=True)
        self.make_planned_task(user, math,   '10 задач по интегралам', 1, completed=True)
        self.make_planned_task(user, thesis, 'Глава 2 диплома (3 страницы)', 2, completed=True)
        self.make_planned_task(user, chem,   'Повторить реакции замещения', 2, completed=True)
        self.make_planned_task(user, thesis, 'Диплом — список литературы', 3)
        self.make_planned_task(user, eng,    'Duolingo (2 юнита)', 3)
        self.make_planned_task(user, chem,   'Экспресс-повторение химии', 4)
        self.make_planned_task(user, thesis, 'Написать заключение диплома', 4)
        self.make_planned_task(user, eng,    'Фильм на английском (1,5 ч)', 5)
        self.make_planned_task(user, math,   'Повторение дифуров (5 задач)', 5)

        # Просроченные
        self.make_overdue_task(user, chem,   'Сдать отчет по лабораторной №4', 3)
        self.make_overdue_task(user, thesis, 'Написать отзыв на научную статью', 6)

        # Фокус-сессии за "сегодня" (18 июня)
        self.make_focus_task(user, chem,   'Повторить реакции замещения (15 реакций)', 0, 9000,  9, 0)
        self.make_focus_task(user, thesis, 'Глава 2 — 3 страницы',                     0, 7200,  12, 0)
        self.make_focus_task(user, math,   '7 задач по интегралам',                    0, 5400,  15, 0)
        self.make_focus_task(user, eng,    'Duolingo (1 юнит)',                        0, 1800,  17, 0)

        self.stdout.write('  ✅ Анна создана')

    # ──────────────────────────────────────────────
    # ПОЛЬЗОВАТЕЛЬ 2 — АЛЕКСЕЙ (фрилансер-разработчик)
    # ──────────────────────────────────────────────

    def create_alex(self):
        user = self.get_or_create_user('alex_demo', 'Алексей', 'alex_demo@example.com')

        projects = self.make_category(user, 'Клиентские проекты', '💻', '#C7CEEA')
        search   = self.make_category(user, 'Поиск заказов', '📋', '#FFDAC1')
        courses  = self.make_category(user, 'Курсы React', '🎓', '#B5EAD7')
        report   = self.make_category(user, 'Отчётность', '💼', '#FFB6C1')
        sport    = self.make_category(user, 'Спорт', '🏋️', '#E2F0CB')

        self.make_goal(user, projects, '35 часов клиентских проектов', 'time', 35)
        self.make_goal(user, search,   '15 откликов на заказы',        'tasks', 15)
        self.make_goal(user, courses,  '6 часов курса React',          'time', 6)
        self.make_goal(user, report,   '4 часа на отчётность',         'time', 4)
        self.make_goal(user, sport,    '5 часов спорта',                'time', 5)

        self.make_planned_task(user, projects, 'Лендинг кофейни — шапка + hero', 0, completed=True)
        self.make_planned_task(user, search,   '5 откликов на фриланс-бирже', 0, completed=True)
        self.make_planned_task(user, projects, 'Лендинг — слайдер + меню', 1, completed=True)
        self.make_planned_task(user, projects, 'CRM — исправить баги', 1, completed=True)
        self.make_planned_task(user, projects, 'Магазин цветов — каталог', 2, completed=True)
        self.make_planned_task(user, projects, 'Созвоны с клиентами (2 шт)', 2, completed=True)
        self.make_planned_task(user, projects, 'Адаптив стоматологии', 3, completed=True)
        self.make_planned_task(user, report,   'Выставить счета клиентам', 3)
        self.make_planned_task(user, projects, 'Сдача лендинга кофейни', 4, completed=True)
        self.make_planned_task(user, search,   '5 откликов на новые заказы', 4)
        self.make_planned_task(user, courses,  'React — модуль 5 (хуки)', 5)
        self.make_planned_task(user, sport,    'Тренировка в зале', 5)
        self.make_planned_task(user, report,   'План на следующую неделю', 6)

        self.make_overdue_task(user, report, 'Написать договор для клиента', 4)
        self.make_overdue_task(user, search, 'Просмотреть 10 новых проектов', 8)

        self.make_focus_task(user, projects, 'Адаптив стоматологии — сдал',          0, 9000, 8, 30)
        self.make_focus_task(user, projects, 'Лендинг кофейни — правки, готов к сдаче', 0, 7200, 11, 30)
        self.make_focus_task(user, search,   '5 откликов на бирже',                   0, 5400, 14, 30)
        self.make_focus_task(user, courses,  'React — повторение хуков',              0, 3600, 17, 0)

        self.stdout.write('  ✅ Алексей создан')

    # ──────────────────────────────────────────────
    # ПОЛЬЗОВАТЕЛЬ 3 — МАРИЯ (студентка-полиглот + блогер)
    # ──────────────────────────────────────────────

    def create_maria(self):
        user = self.get_or_create_user('maria_demo', 'Мария', 'maria_demo@example.com')

        fr   = self.make_category(user, 'Французский язык', '🇫🇷', '#C7CEEA')
        de   = self.make_category(user, 'Немецкий язык', '🇩🇪', '#FFDAC1')
        blog = self.make_category(user, 'Блог', '📸', '#FFB6C1')
        en   = self.make_category(user, 'Английский (универ)', '🎓', '#B5EAD7')
        rest = self.make_category(user, 'Отдых и сон', '🧘‍♀️', '#E2F0CB')

        self.make_goal(user, fr,   '12 часов французского',   'time', 12)
        self.make_goal(user, de,   '10 часов немецкого',       'time', 10)
        self.make_goal(user, blog, '8 часов на блог',          'time', 8)
        self.make_goal(user, en,   '6 часов английского',      'time', 6)

        self.make_planned_task(user, fr,   'Учить 30 слов по-французски', 0, completed=True)
        self.make_planned_task(user, blog, 'Написать пост про Барселону', 0, completed=True)
        self.make_planned_task(user, fr,   'Грамматика французского (времена)', 1, completed=True)
        self.make_planned_task(user, de,   '20 слов по-немецки', 1, completed=True)
        self.make_planned_task(user, blog, 'Монтаж Reels для Instagram', 2, completed=True)
        self.make_planned_task(user, fr,   'Чтение книги на французском (30 стр)', 2, completed=True)
        self.make_planned_task(user, de,   'Тест по немецкому (тренировочный)', 3, completed=True)
        self.make_planned_task(user, en,   'Домашка по английскому', 3, completed=True)
        self.make_planned_task(user, blog, 'Съёмка фото для блога (город)', 4)
        self.make_planned_task(user, fr,   'Повторение французской грамматики', 4)
        self.make_planned_task(user, de,   'Немецкий — подготовка к устной части', 5)
        self.make_planned_task(user, blog, 'Обработка фото (5 шт)', 5)
        self.make_planned_task(user, rest, 'Отдых (без ноутбука)', 6)

        self.make_overdue_task(user, blog, 'Сделать обложку для YouTube', 6)
        self.make_overdue_task(user, fr,   'Сдать эссе по французскому', 4)
        self.make_overdue_task(user, blog, 'Ответить на комментарии в IG', 8)

        self.make_focus_task(user, de,   'Тренировочный тест — 5 ошибок из 30', 0, 7200, 9, 0)
        self.make_focus_task(user, fr,   '40 слов + грамматика',                0, 5400, 11, 30)
        self.make_focus_task(user, blog, 'Обработка Reels — готово к выкладке', 0, 7200, 14, 0)
        self.make_focus_task(user, en,   'Грамматика (домашка отправлена)',     0, 3600, 16, 30)

        self.stdout.write('  ✅ Мария создана')