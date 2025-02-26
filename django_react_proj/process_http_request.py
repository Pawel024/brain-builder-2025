"""
This module is used to process the data sent from the frontend.
It is activated when the backend receives a POST request from the frontend.
When this happens, the data is sent to the process function, which reads out the data and performs the requested action:
0. Load the data; the feature names and images are sent to the frontend via the 'events' SSE using the 'data' message
1. Build and train a network; updates are sent via the 'events' SSE using the 'progress' and 'update' messages
2. Classify a given input (if no network is initialized, it will return "No Network"); the predicted value is returned with rest of the request
Messages:
- 'data': contains the feature names and images
- 'progress': contains the progress -> every 1% of epochs
- 'update': contains the error list, weights, biases and plots -> every 10% of epochs
"""

# Improvements:
# Idea: make the normalization an integer value so it's easier to expand

from backend.processing import building 
from django_react_proj import processes 
from backend import data_functions as df
import os
import pickle
import requests
import pandas as pd
import json
from base64 import b64encode, b64decode
from django_react_proj.consumers import Transceiver

from django.core.cache import cache
import time
#from asgiref.sync import sync_to_async

async def process(req):

    req = dict(req)
    task_id, user_id = int(req['task_id']), req['user_id']
    inputs = json.loads(req['in_out'])


    if req['action'] == 0:  # load the data and send the feature names and images to the frontend
        d = {}

        try:
            gd = json.loads(inputs['games_data'])
            print(f"Games data loaded: {gd}")
            
            gd = pd.DataFrame(gd).set_index('task_id')
            print(f"Games DataFrame:\n{gd}")
            
            if task_id not in gd.index:
                print(f"Task ID {task_id} not found in games data index.")
                raise KeyError(f"Task ID {task_id} not found in games data index.")
            
            dataset = gd.loc[task_id, 'dataset']
            print(f"Dataset: {dataset}")
            
            normalization = bool(inputs['normalization'])
            print(f"Normalization: {normalization}")
            
            data = df.get_data(dataset=dataset, normalization=normalization, typ=gd.loc[task_id, 'type'])
            print(f"Data loaded: {data}")
            
            cache.set(f'{user_id}_data', pickle.dumps(data), 10*60)  # cache the data for 10 minutes
            print("Data loaded and stored in cache")

            d['header'] = 'data'
            d['feature_names'] = [x.replace('_', ' ') for x in data.feature_names]
            d['plot'] = b64encode(data.images[-1]).decode()  # base64 encoded image, showing pyplot of the data
            d['n_objects'] = data.n_objects

            tc = Transceiver.connections.get((str(user_id)))
            t = 0
            while tc is None and t < 10:
                time.sleep(0.1)
                print("Waiting for switchboard")
                t += 0.1
            if tc is not None:
                print('Sending data to switchboard')
                await tc.send_data(d)
        except KeyError as e:
            print(f"KeyError: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")


    elif req['action'] == 2:  # classify a given input
        # check if a cached version of the network and data exist and load them if they do
        nn = cache.get(f'{user_id}_nn')
        data = cache.get(f'{user_id}_data')

        if nn is not None and data is not None:
            nn = pickle.loads(nn)
            data = pickle.loads(data)

            input_vector = json.loads(inputs['model_input'])
            if len(input_vector) != data.n_features:
                print("Wrong Network")
                output_value = "Wrong Network"
            else:
                typ = data.data_type
                normalization = data.normalization
                output_value = building.predict(input_vector, nn, typ, data, normalization=normalization, name=True)
        else:
            # TODO: what to do in this case? 
            print("No Network (or no data)")
            output_value = "No Network"
        req['in_out'] = json.dumps(output_value)

    req['action'] = 0
    return req
