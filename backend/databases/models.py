from django.db import models

# Row model: used for front-end to back-end communication
class Row(models.Model):
    action = models.IntegerField()
    user_id = models.CharField(max_length=100)
    task_id = models.IntegerField()
    in_out = models.JSONField(null=True)
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user_id + " - task " + str(self.task_id) + " - action " + str(self.action)


class Progress(models.Model):
    user_id = models.CharField(max_length=100)
    task_description = models.ForeignKey('TaskDescription', on_delete=models.CASCADE, related_name='progress', null=True)
    status = models.IntegerField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user_id + " - " + str(self.task_id)


# ___________________________________________________________________________________________________


class TaskDescription(models.Model):
    visibility = models.BooleanField(default=True)
    enabled = models.BooleanField(default=True)
    task_id = models.IntegerField(unique=True)
    short_name = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    short_description = models.TextField()
    description = models.TextField(null=True, blank=True)
    dataset = models.TextField(null=True, blank=True)
    type = models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3')])
    n_inputs = models.IntegerField(null=True, blank=True)
    n_outputs = models.IntegerField(null=True, blank=True)
    file_name = models.TextField(max_length=50, null=True, blank=True)
    function_name = models.TextField(max_length=50, null=True, blank=True)
    other_task = models.TextField(max_length=50, null=True, blank=True)

    def __str__(self):
        return str(self.task_id) + " - " + str(self.name)


class ExternalLink(models.Model):
    task_description = models.OneToOneField(TaskDescription, on_delete=models.CASCADE, primary_key=True, related_name='external_link')
    url = models.TextField()
    
    def __str__(self):
        return str(self.task_description.task_id) + " - " + str(self.task_description.name)


class BasicsDescription(models.Model):
    task_description = models.OneToOneField(TaskDescription, on_delete=models.CASCADE, primary_key=True, related_name='basics_description')
    order_slider_visibility = models.BooleanField()
    max_order = models.IntegerField(null=True, blank=True)
    min_order = models.IntegerField(null=True, blank=True)
    datapoints_field_visibility = models.BooleanField()
    features_field_visibility = models.BooleanField()
    type_menu_visibility = models.BooleanField()
    type_menu_options = models.TextField(null=True, blank=True)

    def __str__(self):
        return str(self.task_description.task_id) + " - " + str(self.task_description.name)


class SVMDescription(models.Model):
    task_description = models.OneToOneField(TaskDescription, on_delete=models.CASCADE, primary_key=True, related_name='svm_description')
    rbf_visibility = models.BooleanField()
    c_slider_visibility = models.BooleanField()
    gamma_slider_visibility = models.BooleanField()
    highlight_support_vectors = models.BooleanField()
    accuracy_visibility = models.BooleanField()
    f1_visibility = models.BooleanField()

    def __str__(self):
        return str(self.task_description.task_id) + " - " + str(self.task_description.name)


class NeuralNetworkDescription(models.Model):
    task_description = models.OneToOneField(TaskDescription, on_delete=models.CASCADE, primary_key=True, related_name='neural_network_description')
    max_epochs = models.IntegerField(default=100)
    max_layers = models.IntegerField(default=4)
    max_nodes = models.IntegerField(default=8)
    iterations_slider_visibility = models.BooleanField(default=True)
    lr_slider_visibility = models.BooleanField(default=True)
    normalization_visibility = models.BooleanField(default=False)
    af_visibility = models.BooleanField(default=False)
    decision_boundary_visibility = models.BooleanField(default=False)
    af_options = models.TextField(max_length=50, default='', blank=True)
    optimizer_options = models.TextField(max_length=50, default='', blank=True)
    sensitive_data = models.BooleanField(default=False, null=True, blank=True)
    
    def __str__(self) -> str:
        return str(self.task_description.task_id) + " - " + str(self.task_description.name)


class ClusteringDescription(models.Model):
    task_description = models.OneToOneField(TaskDescription, on_delete=models.CASCADE, primary_key=True, related_name='clustering_description')
    type_selection_options = models.TextField(max_length=10, null=True, blank=True)
    type_selection_visibility = models.BooleanField()
    distance_visibility = models.BooleanField()
    cluster_slider_visibility = models.BooleanField()
    linkage_visibility = models.BooleanField()
    silhouette_coefficient_visibility = models.BooleanField()
    elbow_plot_visibility = models.BooleanField()

    def __str__(self) -> str:
        return str(self.task_description.task_id) + " - " + str(self.task_description.name)
    
    
class Intro(models.Model):
    intro_id = models.IntegerField(unique=True)
    visibility = models.BooleanField(default=False)
    name = models.CharField(max_length=200)
    content = models.TextField()

    def __str__(self):
        return str(self.intro_id) + " - " + str(self.name)

    
class Quiz(models.Model):
    quiz_id = models.IntegerField(unique=True)
    visibility = models.BooleanField(default=False)
    
    question_1 = models.TextField(null=True, blank=True)
    code_1 = models.TextField(null=True, blank=True)
    option_1_a = models.CharField(max_length=200, null=True, blank=True)
    option_1_b = models.CharField(max_length=200, null=True, blank=True)
    option_1_c = models.CharField(max_length=200, null=True, blank=True)
    option_1_d = models.CharField(max_length=200, null=True, blank=True)
    answer_1 = models.CharField(max_length=200, null=True, blank=True)

    question_2 = models.TextField(null=True, blank=True)
    code_2 = models.TextField(null=True, blank=True)
    option_2_a = models.CharField(max_length=200, null=True, blank=True)
    option_2_b = models.CharField(max_length=200, null=True, blank=True)
    option_2_c = models.CharField(max_length=200, null=True, blank=True)
    option_2_d = models.CharField(max_length=200, null=True, blank=True)
    answer_2 = models.CharField(max_length=200, null=True, blank=True)

    question_3 = models.TextField(null=True, blank=True)
    code_3 = models.TextField(null=True, blank=True)
    option_3_a = models.CharField(max_length=200, null=True, blank=True)
    option_3_b = models.CharField(max_length=200, null=True, blank=True)
    option_3_c = models.CharField(max_length=200, null=True, blank=True)
    option_3_d = models.CharField(max_length=200, null=True, blank=True)
    answer_3 = models.CharField(max_length=200, null=True, blank=True)

    question_4 = models.TextField(null=True, blank=True)
    code_4 = models.TextField(null=True, blank=True)
    option_4_a = models.CharField(max_length=200, null=True, blank=True)
    option_4_b = models.CharField(max_length=200, null=True, blank=True)
    option_4_c = models.CharField(max_length=200, null=True, blank=True)
    option_4_d = models.CharField(max_length=200, null=True, blank=True)
    answer_4 = models.CharField(max_length=200, null=True, blank=True)

    question_5 = models.TextField(null=True, blank=True)
    code_5 = models.TextField(null=True, blank=True)
    option_5_a = models.CharField(max_length=200, null=True, blank=True)
    option_5_b = models.CharField(max_length=200, null=True, blank=True)
    option_5_c = models.CharField(max_length=200, null=True, blank=True)
    option_5_d = models.CharField(max_length=200, null=True, blank=True)
    answer_5 = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return str(self.quiz_id)

class Feedback(models.Model):
    feedback = models.JSONField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.timestamp)

class LevelState(models.Model):
    level = models.IntegerField()
    active = models.BooleanField(default=False)

    def __str__(self):
        return "Level " + str(self.level) + " - " + str(self.active)