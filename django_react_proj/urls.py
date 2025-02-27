"""django_react_proj URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from backend.databases import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index),
    path('readme', views.serve_readme),
    #path('links', views.serve_links),
    #re_path('api/notebooks/(?P<notebook_path>.+)/?$', views.get_notebook),
    re_path(r'^api/backend$', views.query_list),
    re_path(r'^api/backend/$', views.query_list),
    re_path(r'^api/backend/(?P<pk>[0-9]+)$', views.query_detail),
    re_path(r'^api/all_tasks$', views.all_tasks),
    re_path(r'^api/all_tasks/$', views.all_tasks),
    re_path(r'^api/tasks$', views.task_description_detail),
    re_path(r'^api/tasks/$', views.task_description_detail),
    re_path(r'^api/all_quizzes$', views.all_quizzes),
    re_path(r'^api/all_quizzes/$', views.all_quizzes),
    re_path(r'^api/quizzes$', views.quiz_description_detail),
    re_path(r'^api/quizzes/$', views.quiz_description_detail),
    re_path(r'^api/all_intros$', views.all_intros),
    re_path(r'^api/all_intros/$', views.all_intros),
    re_path(r'^api/intros$', views.intro_description_detail),
    re_path(r'^api/intros/$', views.intro_description_detail),
    re_path(r'^api/feedback$', views.feedback),

    # analytics
    re_path(r'^api/pageview$', views.analytics_view),
    re_path(r'^api/pageview/$', views.analytics_view),

    # get client IP
    re_path(r'^api/client-ip$', views.get_client_ip),
    re_path(r'^api/client-ip/$', views.get_client_ip),

    # serve .lottie files directly
    re_path(r'^(?P<filename>.+\.lottie)$', views.serve_lottie_file),

    # catch-all pattern
    re_path(r'^.*$', views.index),
]