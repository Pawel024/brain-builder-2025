from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from backend.databases.models import Row, TaskDescription, Quiz, Intro
from backend.databases.serializers import *
from django_react_proj.process_http_request import process
from django.http import JsonResponse, HttpResponse

from django.shortcuts import render

import uuid
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie

from urllib.parse import urlparse

import asyncio

import os
import requests

from rest_framework import viewsets
from .models import Pageview
from .serializers import AnalyticsSerializer


@ensure_csrf_cookie
def index(request, path=''):
    user_id = request.GET.get('user_id')

    if user_id is None or user_id == '':
        # No user_id provided in GET parameters, check the cookies
        user_id = request.COOKIES.get('user_id')

        if user_id is None or user_id == '':
            # This is a new user, create a new user_id
            user_id = str(uuid.uuid4())

            # Render the page with the user_id
            response = render(request, 'index.html', {'user_id': user_id})

            # Set a cookie with the user_id
            response.set_cookie('user_id', user_id, max_age=365*24*60*60)

            return response

    return render(request, 'index.html', {'user_id': user_id})

def serve_readme(request):
    with open('public/Welcome.md', 'r') as file:
        return HttpResponse(file.read(), content_type='text/plain')
    
def serve_links(request):
    with open('public/Links.md', 'r') as file:
        return HttpResponse(file.read(), content_type='text/plain')
    
def serve_lottie_file(request, filename):
    file_path = os.path.join('public', filename)
    with open(file_path, 'rb') as file:
        return HttpResponse(file.read(), content_type='application/octet-stream')

@csrf_protect
@api_view(['GET', 'POST'])
def query_list(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        task_id = request.GET.get('task_id')
        data = Row.objects.filter(user_id=user_id, task_id=task_id).order_by('-id')[:1]
        serializer = RowSerializer(data, context={'request': request}, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        user_id = request.data.get('user_id')
        task_id = request.data.get('task_id')
        absolute_uri = request.build_absolute_uri('/')
        parsed_uri = urlparse(absolute_uri)
        root_url = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        processed_data = loop.run_until_complete(process(request.data))

        processed_data['user_id'] = user_id
        processed_data['task_id'] = task_id
        serializer = RowSerializer(data=processed_data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_protect
@api_view(['PUT', 'DELETE'])
def query_detail(request, pk):
    try:
        query = Row.objects.get(pk=pk)
    except Row.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        user_id = request.data.get('user_id')
        task_id = request.data.get('task_id')
        absolute_uri = request.build_absolute_uri('/')
        parsed_uri = urlparse(absolute_uri)
        root_url = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        processed_data = loop.run_until_complete(process(request.data))

        processed_data['user_id'] = user_id
        processed_data['task_id'] = task_id
        serializer = RowSerializer(query, data=processed_data,context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        query.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

@csrf_protect
@api_view(['GET'])
def task_description_detail(request):
    task_id = request.GET.get('task_id')
    try:
        task_description = TaskDescription.objects.get(task_id=task_id)
    except TaskDescription.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TaskDescriptionSerializer(task_description, context={'request': request})
        return Response(serializer.data)


@csrf_protect
@api_view(['GET'])
def all_tasks(request):
    if request.method == 'GET':
        tasks = TaskDescription.objects.all().select_related('external_link', 'basics_description', 'svm_description', 'neural_network_description', 'clustering_description')
        serializer = TaskDescriptionSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    

@csrf_protect
@api_view(['GET'])
def quiz_description_detail(request):
    quiz_id = request.GET.get('quiz_id')
    try:
        quiz = Quiz.objects.get(quiz_id=quiz_id)
        data = {
            'questions': []
        }

        for i in range(1, 6):  # adjust the range according to the number of questions
            question_text = getattr(quiz, f'question_{i}')
            possible_options = ['a', 'b', 'c', 'd']
            options = [
                getattr(quiz, f'option_{i}_{option}')
                for option in possible_options
            ]

            code = getattr(quiz, f'code_{i}')

            if all(not option for option in options):
                if code:
                    question_type = 'coding'
                else:
                    question_type = 'text'
            else:
                question_type = 'multiple choice'

            if (question_type == 'multiple choice' and getattr(quiz, f"answer_{i}") in possible_options): # this could be suboptimal, what if the question is open but the answer is for example "a"?
                answer = getattr(quiz, f'option_{i}_{getattr(quiz, f"answer_{i}")}')
            else:
                answer = getattr(quiz, f"answer_{i}")

            question_data = {
                'question': question_text,
                'options': [
                    {'optionText': option, 'isCorrect': option == answer}
                    for option in options
                ],
                'question_type': question_type,
                'code' : code,
            }

            if (question_type == 'text' or question_type == 'coding'):
                question_data['options'] = [{'optionText': answer, 'isCorrect': True}]

            data['questions'].append(question_data)

        return JsonResponse(data)
    except Quiz.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


@csrf_protect
@api_view(['GET'])
def all_quizzes(request):
    if request.method == 'GET':
        quizzes = Quiz.objects.all()
        serializer = QuizSerializer(quizzes, many=True, context={'request': request})
        return Response(serializer.data)
    

@csrf_protect
@api_view(['GET'])
def intro_description_detail(request):
    intro_id = request.GET.get('intro_id')
    try:
        intro = Intro.objects.get(intro_id=intro_id)
    except Intro.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = IntroSerializer(intro, context={'request': request})
        return Response(serializer.data)


@csrf_protect
@api_view(['GET'])
def all_intros(request):
    if request.method == 'GET':
        intros = Intro.objects.all()
        serializer = IntroSerializer(intros, many=True, context={'request': request})
        return Response(serializer.data)

    
@csrf_protect
@api_view(['POST'])
def feedback(request):
    serializer = FeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_notebook(request, notebook_path:str):
    if os.getenv("NOTEBOOK_URL") is not None: 
        notebook_url = os.getenv("NOTEBOOK_URL") + notebook_path

        print('Get notebook: ', notebook_url)  # for debugging

        headers = {'Authorization': f'token {os.getenv("NOTEBOOK_TOKEN")}'}
        response = requests.get(notebook_url, headers=headers)

        if response.ok: 
            return JsonResponse(response.json())
        else:
            return JsonResponse({'error': 'Error loading notebook'}, status=500)  # internal server error
    
    else: return JsonResponse({'error': 'No GitHub linked'}, status=500)  # internal server error


@csrf_protect
@api_view(['POST'])
def analytics_view(request):
    serializer = AnalyticsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsViewSet(viewsets.ModelViewSet):
    queryset = Pageview.objects.all()
    serializer_class = AnalyticsSerializer


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return JsonResponse({'ip': ip})
