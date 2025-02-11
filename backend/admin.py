from django.contrib import admin
from django.contrib.auth.models import Group, User
from .databases.models import Row, TaskDescription, Quiz, Intro, Feedback, BasicsDescription, SVMDescription, NeuralNetworkDescription, ClusteringDescription, ExternalLink, Pageview

admin.site.unregister(Group)
admin.site.unregister(User)

admin.site.register(Row)
admin.site.register(TaskDescription)
admin.site.register(BasicsDescription)
admin.site.register(SVMDescription)
admin.site.register(NeuralNetworkDescription)
admin.site.register(ClusteringDescription)
admin.site.register(ExternalLink)
admin.site.register(Quiz)
admin.site.register(Intro)
admin.site.register(Feedback)
admin.site.register(Pageview)