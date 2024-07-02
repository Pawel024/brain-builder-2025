from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import threading
from functools import partial
import json
from django_react_proj import processes
from backend.processing import communication

class Transceiver(AsyncWebsocketConsumer):
    connections = {}

    async def connect(self):
        print(f'Connection scope: {self.scope}')
        self.user_id = self.scope['url_route']['kwargs']['userId']
        #self.task_id = self.scope['url_route']['kwargs']['taskId']
        Transceiver.connections[self.user_id] = self
        print("Transceiver connected")
        self.secondary_loop = asyncio.new_event_loop()
        t = threading.Thread(target=self.secondary_loop.run_forever)
        t.start()
        await self.accept()

    async def disconnect(self, close_code):
        self.secondary_loop.stop()
        del Transceiver.connections[self.user_id]
        print("Transceiver disconnected")
        
    # Receive message from WebSocket
    async def receive(self, text_data):
        instructions = json.loads(text_data)
        task_type = instructions['header']
        print("instructions received, preparing for task ", task_type)

        if task_type == 'start':
            # start the process
            task_id = instructions['task_id']
            communication.cancel_vars[(self.user_id, task_id)] = False

            communication.send_fn_vars[(str(self.user_id), str(task_id))] = self.async_send

            processes.run(file_name=instructions['file_name'], function_name=instructions['function_name'], args=instructions)
        
        elif task_type == 'cancel':
            task_id = instructions['task_id']  # watch out: this should be the notebook_id for notebooks!
            communication.cancel_vars[(self.user_id, task_id)] = True

        elif task_type == 'code':
            nb_id = instructions['notebook_id']
            communication.cancel_vars[(self.user_id, nb_id)] = False
            await processes.execute_code(instructions['code'], self.user_id, nb_id, send_fn=self.send)
        

    # Send an update to the frontend
    async def send_data(self, data):
        task_type = data['header']
        print("sending data for task ", task_type)
        await self.send(json.dumps(data))

        #ping = {'header': 'ping'}
        #self.send(json.dumps(ping))
        #await self.send_data(ping)
    

    def async_send(self, message, wait=False):
        """
        Uses a secondary loop to send messages to the frontend.
        The loop is opened in Transceiver.connect and closed in Transceiver.disconnect.
        Returns False if an error occurs in the loop. If wait is True, the function will wait for the message to be sent and return True when it completes.
        """

        try:
            result = asyncio.run_coroutine_threadsafe(self.send_data(message), self.secondary_loop)
            if wait:  
                result.result()
                return True
        except Exception as e: 
            print("Can't send: ", e)
            return False

    #secondary_loop.call_soon_threadsafe(asyncio.create_task, self.send_data(message))  # alternative way, does not allow for error handling


    # # function to handle subprocess output
    # async def handle_output(self, process):  # TODO: test this
    #     # Loop over the lines of the process's output
    #     for line in iter(process.stdout.readline, b''):
    #         # Send the line to the client
    #         self.send(json.dumps({"output": line.decode('utf-8')}))
    #     # Send the final state to the client
    #     websocket.send(json.dumps({"state": "finished"}))



# class Plotter(AsyncWebsocketConsumer):
    #     ...
    #     if self.custom_id == '11':
    #         print(data['title'], " received")
    #         plot, error = df.create_plot11(self.x, self.y, data['a'], data['b'])
    #         plot = b64encode(plot).decode()
    #         await self.send(json.dumps({'title': 'plot', 'plot': plot, 'error': error}))
    #         print("plot sent")
