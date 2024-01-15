from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from .models import Row, TaskDescription
from .serializers import *
from .process_data import process

from django.shortcuts import render

import uuid
from django.views.decorators.csrf import csrf_protect


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
        processed_data = process(request.data, root_url)
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
        absolute_uri = request.build_absolute_uri('/')
        parsed_uri = urlparse(absolute_uri)
        root_url = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
        processed_data = process(request.data, root_url)
        processed_data['user_id'] = request.data.get('user_id')
        processed_data['task_id'] = request.data.get('task_id')
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

/* the two functions below still need to be changed */
@csrf_protect
@api_view(['GET', 'POST'])
def q_list(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        task_id = request.GET.get('task_id')
        data = Progress.objects.filter(user_id=user_id, task_id=task_id).order_by('-id')[:1]
        serializer = ProgressSerializer(data, context={'request': request}, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ProgressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(request.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@csrf_protect
@api_view(['PUT', 'DELETE'])
def q_detail(request, pk):
    try:
        query = Progress.objects.get(pk=pk)
    except Progress.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        absolute_uri = request.build_absolute_uri('/')
        parsed_uri = urlparse(absolute_uri)
        root_url = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
        processed_data = request.data
        processed_data['user_id'] = request.data.get('user_id')
        processed_data['task_id'] = request.data.get('task_id')
        serializer = ProgressSerializer(query, data=processed_data,context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(request.data, status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        query.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)