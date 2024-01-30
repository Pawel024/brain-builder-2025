from channels.generic.websocket import AsyncWebsocketConsumer
import json
from backend import data_functions as df
from base64 import b64encode, b64decode

class Coach(AsyncWebsocketConsumer):
    connections = {}

    async def connect(self):
        print(f'Connection scope: {self.scope}')
        self.user_id = self.scope['url_route']['kwargs']['userId']
        self.task_id = self.scope['url_route']['kwargs']['taskId']
        Coach.connections[(self.user_id, self.task_id)] = self
        print("coach connected")
        await self.accept()

    async def disconnect(self, close_code):
        del Coach.connections[(self.user_id, self.task_id)]
        print("coach disconnected")
        
    # Receive message from WebSocket
    async def receive(self, data):
        print("coach received data, but is currently unequipped to handle it")
        # uncomment if we decide to send frontend data via the WebSocket as well
        """
        instructions = json.loads(data)
        task_type = instructions['title']
        print("instructions received, preparing for task ", task_type)
        from process_data import process
        process(instructions, root_link, pk, csrf_token, callback=self.send_data)
        """

    # Send an update to the frontend
    async def send_data(self, data):
        task_type = data['title']
        print("sending data for task ", task_type)
        await self.send(json.dumps(data))


class Plotter(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['userId']
        self.custom_id = self.scope['url_route']['kwargs']['customId']
        if self.custom_id == '11':
            self.x, self.y = df.create_plot11()
        print("plotter connected")
        await self.accept()

    async def disconnect(self, close_code):
        print("plotter disconnected")
    
    async def receive(self, data):
        data = json.loads(data)
        if self.custom_id == '11':
            plot = df.create_plot11(self.x, self.y, data['a'], data['b'])
            plot = b64encode(plot).decode()
            await self.send(json.dumps({'title': 'plot', 'plot': plot}))