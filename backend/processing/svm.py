"""
This module contains the backend code for the SVM tasks. 
"""

import sys
if __name__ == '__main__':
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))
import backend.data_functions as df
from backend.processing.communication import send_update, is_cancelled
import numpy as np
from torch.utils.data import DataLoader
from sklearn.svm import SVC
from sklearn.metrics import f1_score
from base64 import b64encode  # for encoding the images

def modify_data(dataset):
    # Assuming `dataset` is an instance of the class containing the __getitem__ method
    X = []
    y = []  

    for sample in dataset:
        X.append(sample['data'])
        y.append(sample['target'])

    # Convert lists to numpy arrays
    X = np.vstack(X)  # This stacks the feature vectors into a 2D array
    y = np.vstack(y)  # This stacks the target vectors into a 2D array 

    X = np.reshape(X, (X.shape[0], -1))  # for some reason numpy adds an extra dimension, remove it.
    y = np.reshape(y, (y.shape[0], -1))
    if y.shape[1] == 1:
        y = y.ravel()

    return X, y


def main(kernel, c, gamma, dataset, normalization, user_id, task_id):
    """
    Main function for the SVM tasks. 
    """
    batch_size = 1
    test_size = 0.1

    data = df.get_data(dataset=dataset, normalization=normalization, typ=1, data=None, test_size=test_size)
    training_set = DataLoader(data.training_set, batch_size=batch_size, shuffle=True)
    test_set = DataLoader(data.testing_set, batch_size=batch_size, shuffle=True)
    X_train, y_train = modify_data(training_set)
    X_test, y_test = modify_data(test_set)
    
    model = SVC(kernel=kernel, C=c, gamma=gamma)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    accuracy = model.score(X_test, y_test)
    f1score = f1_score(y_test, y_pred, average='weighted')

    data.plot_decision_boundary(model, step=0.005)  # plot the current decision boundary (will be ignored if the dataset has too many dimensions)
    plot = b64encode(data.images[-1]).decode()

    send_update(header='SVM', var_names=['plot', 'f1score'], vars=(plot, f1score), task_id=task_id, user_id=user_id)
