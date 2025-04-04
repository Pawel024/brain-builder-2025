# TODOs for reorganisation
# - make superclass CustomDataloader()
# - debugging

# TODO: implement testing and cross-validation

import os
from io import BytesIO  # for saving the images

import numbers
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
import matplotlib.figure as mf
from matplotlib.lines import Line2D
from matplotlib.cm import ScalarMappable
from matplotlib.colors import Normalize
from sklearn import datasets
from sklearn.model_selection import train_test_split


def get_data(dataset, typ:int=None, normalization=False, test_size=None, data=None):  # TODO: test this
    magic_box = {'datasets': datasets, 'normalization': normalization, 'DataFromSklearn1': DataFromSklearn1, 'DataFromSklearn2': DataFromSklearn2}
    
    # if the dataset has been passed on, just use that
    if data is not None:
        pass
    else:

        if type(dataset) is str and dataset.startswith('load_'):
            # import a dataset from sklearn
            exec('data = DataFromSklearn1(datasets.' + dataset + ', normalize=normalization)', magic_box)
            data = magic_box['data']
            # Note: exec may cause security problems if games is defined elsewhere, but should be fine for now

        elif type(dataset) is str and dataset.startswith('make_'):
            # import a dataset from sklearn
            exec('data = DataFromSklearn2(datasets.' + dataset + ', normalize=normalization, data_type=' + str(typ) + ')', magic_box)
            data = magic_box['data']
            # Note: exec may cause security problems if games is defined elsewhere, but should be fine for now

        elif type(dataset) is str and dataset.startswith('['):
            # Note: I had to use eval here on the external csv file,
            # so first some basic security measures:
            if (len(dataset) < 100 and list(dataset)[-1] == ']' and
                    not dataset.__contains__('(') and not dataset.__contains__(')')):
                data = DataFromFunction(eval(dataset), normalize=normalization)

        elif type(dataset) is str:
            # load the dataset from Excel -> use custom dataset class
            data = DataFromExcel(os.path.join(os.path.dirname(__file__), 'datasets/' + dataset), data_type=typ, normalize=normalization)


        # if test_size is not None or val_size is not None:
        #     train, test_val = train_test_split(data, test_size=(test_size+val_size))
        #     test, val = train_test_split(test_val, test_size=val_size/(test_size+val_size))
        #     return train, test, val
        # else: 
        #     return data
    
        train, test = train_test_split(data, test_size=test_size)
        data.training_set = train
        data.testing_set = test
    return data



"""
This module contains 3 classes:
- DataFromExcel: creates a dataset from a .csv file (e.g. Clas2a.csv), useful for real-world data
- DataFromSklearn: creates a dataset from a dataset from sklearn (wine, iris, etc.), useful for classification
- DataFromCustom: creates a dataset from a specified function, useful for regression
These classes and their functions are used in the building.py and levels.py modules.
"""

# Improvements:
# idea: try to make the code more efficient, maybe merge some functions somehow?
# idea: add custom feature selection
# idea: add manually defined normalization to standard normal distribution
# idea: add sklearn.preprocessing.MinMaxScaler(), .Normalizer() and .StandardScaler to scale the data
# idea: add class for images

# imports moved to top

class DataFromExcel(Dataset):
    """Create a dataset from a CSV file with column labels in the first row.
    data_type can be one of the following integers:
    - 1: classification (a single 'Targets' column, data in columns labeled with feature names)
    - 2: regression (multiple 'Target_n' or 'Target_abc' columns, data in columns labeled with feature names)
    """

    def __init__(self, csv_file_path, data_type=1, normalize=False):
        """
        Arguments:
            csv_file_path (string): Path to the csv file with annotations.
            data_type (integer): currently only 0 is supported
            normalize (boolean): normalize the data to the range [0, 1]
        """
        self.training_set, self.testing_set, self.validation_set = None, None, None
        self.data_type, self.normalization = data_type, normalize
        self.data = pd.read_csv(csv_file_path)
        # set some initial values
        self.n_targets, self.n_features, self.n_objects = 0, 0, 0
        self.target_names, self.feature_names, self.minima, self.maxima = [], [], [], []

        # replace slashes and spaces in the column names
        self.data.columns = self.data.columns.str.replace(' ', '_')
        self.data.columns = self.data.columns.str.replace('/', '_')

        if data_type == 1:
            self.feature_names = self.data.columns[~self.data.columns.str.contains('Target')]
            self.n_features = len(self.feature_names)

            self.target_names = self.data.loc[:, 'Target'].unique()
            self.n_targets = len(self.target_names)
            # now transform the target_names to integers
            name_to_index = {name: i for i, name in enumerate(self.target_names)}
            self.data.loc[:, 'Target'] = self.data.loc[:, 'Target'].map(name_to_index)
            self.data.dropna(inplace=True)  # delete NaN values
            self.data.reset_index(drop=True, inplace=True)  # reset the index

            self.n_objects = len(self.data)

            self.minima = self.data.loc[:, self.feature_names].min(axis=0)
            self.maxima = self.data.loc[:, self.feature_names].max(axis=0)

            if self.normalization:
                for i, f in enumerate(self.feature_names):
                    self.data.loc[:, f] = ((self.data.loc[:, f] - self.minima.iloc[i]) /
                                           (self.maxima.iloc[i] - self.minima.iloc[i]))

        elif data_type == 2:
            # first find all the target columns
            self.target_names = self.data.columns[self.data.columns.str.contains('Target')]
            self.n_targets = len(self.target_names)

            self.feature_names = self.data.columns[~self.data.columns.str.contains('Target')]
            self.feature_names = np.array(self.feature_names)
            self.n_features = len(self.feature_names)
            self.n_objects = len(self.data)

            self.minima = self.data.min(axis=0)
            self.maxima = self.data.max(axis=0)
            if self.normalization:
                for i in range(self.n_features + self.n_targets):
                    self.data.iloc[:, i] = ((self.data.iloc[:, i] - self.minima.iloc[i]) /
                                            (self.maxima.iloc[i] - self.minima.iloc[i]))

        else:
            print("Data type not supported yet")
            pass

        self.images = []
        self.plot_data()  # plots all of the features against each other and stores the bytes data in 'images'

    # modifying the inherited functions

    def __len__(self):
        return self.n_objects

    def __getitem__(self, idx):

        if torch.is_tensor(idx):
            idx = np.array(idx.tolist())

        target = None

        if self.data_type == 1:
            target = self.data.loc[idx, 'Target']
            target = np.array([target], dtype=int).reshape(-1, 1)

        elif self.data_type == 2:
            target = self.data.loc[idx, self.target_names]
            target = np.array([target], dtype=float).reshape(-1, self.n_targets)

        dat = self.data.loc[idx, self.feature_names]
        dat = np.array([dat], dtype=float).reshape(-1, self.n_features)
        sample = {'data': dat, 'target': target}

        return sample

    # adding some extra functions

    def normalize(self, X):
        try:
            assert len(X) == self.n_features
        except AssertionError:
            print("Looks like x does not have the right length, is your data type supported?")
            return None
        out = []
        for i, x in enumerate(X):
            mini = self.minima.loc[self.feature_names[i]]
            maxi = self.maxima.loc[self.feature_names[i]]
            out += [(x-mini)/(maxi-mini)]
        return out

    def denormalize(self, Y):  # this is only necessary for regression
        assert len(Y) == self.n_targets
        out = []
        for i, y in enumerate(Y):
            mini = self.minima.loc[self.target_names[i]]
            maxi = self.maxima.loc[self.target_names[i]]
            out += [y*(maxi-mini)+mini]
        return out

    def label_name(self, i):
        assert type(i) is int
        try:
            return str(self.target_names[i])
        except IndexError:
            print("Target name not found")
            return None

    def sort_data(self, column='Target'):
        """Sorts the target_names of the dataset in ascending order and returns the sorted dataset."""
        self.data.sort_values(by=[column], inplace=True)
        self.data.reset_index(drop=True, inplace=True)

    def plot_data(self):
        """Plots the data."""
        img = BytesIO()

        if self.data_type == 1:
            data = np.array(self.data.loc[:, self.feature_names]).copy()
            if self.normalization: # denormalize before plotting
                for i, f in enumerate(self.feature_names):
                    data[:, i] = self.data.loc[:, f] * (self.maxima.iloc[i] - self.minima.iloc[i]) + self.minima.iloc[i]

            n_plots = self.n_features * (self.n_features - 1) // 2
            n_cols = 2
            n_rows = int(np.ceil(n_plots / n_cols))
            if n_plots == 1:
                n_cols = 1
                n_rows = 1
            fig = mf.Figure()
            ax = fig.subplots(n_rows, n_cols)
            k = 0

            for i in range(self.n_features-1):
                if type(data[0, i]) is not str:
                    for j in range(i+1, self.n_features):
                        if type(data[0, j]) is not str:
                            row = k // n_cols
                            col = k % n_cols
                            if n_plots == 1:
                                scatter = ax.scatter(data[:, i], data[:, j], c=self.data.loc[:, 'Target'])
                                ax.set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax.set_ylabel(self.feature_names[j].replace('_', ' '))
                            elif n_rows == 1:
                                scatter = ax[col].scatter(data[:, i], data[:, j], c=self.data.loc[:, 'Target'])
                                ax[col].set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax[col].set_ylabel(self.feature_names[j].replace('_', ' '))
                            else: 
                                scatter = ax[row, col].scatter(data[:, i], data[:, j], c=self.data.loc[:, 'Target'])
                                ax[row, col].set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax[row, col].set_ylabel(self.feature_names[j].replace('_', ' '))
                            k += 1
            # Create a legend
            cmap = scatter.get_cmap()
            norm = Normalize(vmin=min(self.data.loc[:, 'Target']), vmax=max(self.data.loc[:, 'Target']))
            sm = ScalarMappable(cmap=cmap, norm=norm)
            legend_elements = [Line2D([0], [0], marker='o', color='w', markerfacecolor=sm.to_rgba(i), markersize=10) for i in range(len(self.target_names))]
            fig.legend(handles=legend_elements, labels=list(self.target_names), loc='lower left', bbox_to_anchor=(1, 0), title='Classes')

        elif self.data_type == 2:
            data = np.array(self.data).copy()
            if self.normalization: # denormalize before plotting
                for i in range(self.n_features + self.n_targets):
                    data[:, i] = self.data.iloc[:, i] * (self.maxima.iloc[i] - self.minima.iloc[i]) + self.minima.iloc[i]

            n_plots = (self.n_features + self.n_targets) * (self.n_features + self.n_targets - 1) // 2
            n_cols = 2
            n_rows = int(np.ceil(n_plots / n_cols))
            if n_plots == 1:
                n_cols = 1
                n_rows = 1
            fig = mf.Figure()
            ax = fig.subplots(n_rows, n_cols)
            k = 0
            for i in range(self.n_features + self.n_targets - 1):
                if type(data[0, i]) is not str:
                    for j in range(i+1, self.n_features + self.n_targets):
                        if type(data[0, j]) is not str:
                            row = k // n_cols
                            col = k % n_cols
                            if n_plots == 1:
                                ax.scatter(data[:, i], data[:, j], c=(4/255, 151/255, 185/255))
                                ax.set_xlabel(self.data.columns[i].replace('_', ' '))
                                ax.set_ylabel(self.data.columns[j].replace('_', ' '))
                            elif n_rows == 1:
                                ax[col].scatter(data[:, i], data[:, j], c=(4/255, 151/255, 185/255))
                                ax[col].set_xlabel(self.data.columns[i].replace('_', ' '))
                                ax[col].set_ylabel(self.data.columns[j].replace('_', ' '))
                            else: 
                                ax[row, col].scatter(data[:, i], data[:, j], c=(4/255, 151/255, 185/255))
                                ax[row, col].set_xlabel(self.data.columns[i].replace('_', ' '))
                                ax[row, col].set_ylabel(self.data.columns[j].replace('_', ' '))
                            k += 1

        fig.tight_layout()
        fig.savefig(img, format='png', bbox_inches='tight')
        img.seek(0)
        self.images.append(img.getvalue())
        fig.clear()
        print("Plot created.")

    # This function is based on a CSE2510 Notebook and plots the decision boundary of a classifier
    def plot_decision_boundary(self, model, step=0.01):
        fig = mf.Figure()
        ax = fig.subplots(1, 1)

        if self.data_type == 1:
            if self.n_features < 3 and self.n_targets < 5:
                if self.normalization:
                    mesh = np.meshgrid(*self.n_features * [np.arange(-0.1, 1.1, step)])
                else:
                    mesh = np.meshgrid(*[np.arange(mini-(maxi-mini)*step, maxi+(maxi-mini)*step, (maxi-mini)*step) for mini, maxi in zip(self.minima, self.maxima)])
                
                # Plot the decision boundary. For that, we will assign a color to each
                # point in the mesh.
                    
                mesh = np.array(mesh)
                Z = np.array(model.predict(mesh.reshape(self.n_features, -1).T))
                Z = Z.reshape(mesh[0].shape)

                data = np.array(self.data.loc[:, self.feature_names]).copy()
                if self.normalization: # denormalize before plotting
                    for i, f in enumerate(self.feature_names):
                        data[:, i] = self.data.loc[:, f] * (self.maxima.iloc[i] - self.minima.iloc[i]) + self.minima.iloc[i]

                ax.contourf(mesh[0], mesh[1], Z, alpha=0.5)
                ax.scatter(data[:, 0], data[:, 1], c=self.data.loc[:, 'Target'])

                ax.set_xlabel(self.feature_names[0].replace('_', ' '))
                ax.set_ylabel(self.feature_names[1].replace('_', ' '))

                # if self.normalization:
                #     ax.set_xlim(-0.1, 1.1)
                #     ax.set_ylim(-0.1, 1.1)
                # else:
                #     ax.set_xlim(self.minima[0]-abs(self.minima[0])*step, self.maxima[0]-abs(self.maxima[0])*step)
                #     ax.set_ylim(self.minima[1]-abs(self.minima[1])*step, self.maxima[1]-abs(self.maxima[1])*step)
                img = BytesIO()
                fig.tight_layout()
                fig.savefig(img, format='png')
                img.seek(0)
                self.images.append(img.getvalue())
                fig.clear()
                                

        elif self.data_type == 2:
            if self.n_features == 1 and self.n_targets == 1:
                mini, maxi = self.minima[0], self.maxima[0]
                if self.normalization:
                    inp = np.arange(-0.1, 1.1, step)
                else:
                    inp = np.arange(mini, maxi, (maxi-mini)*step)

                # Plot the decision boundary. For that, we will assign a color to each
                # point in the mesh.
                inp = np.array(inp)
                Z = np.array(model.predict(inp.reshape(self.n_features, -1).T, typ=2))
                Z = Z[:, 0]
                
                data = np.array(self.data).copy()
                if self.normalization: # denormalize before plotting
                    for i in range(self.n_features + self.n_targets):
                        data[:, i] = self.data.iloc[:, i] * (self.maxima.iloc[i] - self.minima.iloc[i]) + self.minima.iloc[i]
                    inp = inp * (self.maxima.iloc[0] - self.minima.iloc[0]) + self.minima.iloc[0]
                    Z = Z * (self.maxima.iloc[1] - self.minima.iloc[1]) + self.minima.iloc[1]
                
                fig = mf.Figure()
                ax = fig.subplots(1, 1)

                ax.scatter(data[:, 0], data[:, self.n_features], color=(4/255, 151/255, 185/255))  # display first feature and first target
                ax.plot(inp, Z, color=(185/255,38/255,4/255))
                ax.set_xlabel(self.feature_names[0].replace('_', ' '))
                ax.set_ylabel(self.target_names[0].replace('_', ' '))

                # if self.normalization:
                #     ax.set_xlim([0, 1])
                #     ax.set_ylim([0, 1])
                # else:
                ax.set_xlim(mini, maxi)
                ax.set_ylim(mini, maxi)
                
                img = BytesIO()
                fig.tight_layout()
                fig.savefig(img, format='png')
                img.seek(0)
                self.images.append(img.getvalue())
                fig.clear()



class DataFromSklearn1(Dataset):  # this one is for load_wine(), etc.
    def __init__(self, dataset, normalize=False):  # assumed to be for classification
        self.training_set, self.testing_set, self.validation_set = None, None, None
        self.data = dataset.data
        self.targets = dataset.target
        self.data_type = 1
        self.normalization = normalize

        self.target_names = dataset.target_names
        self.feature_names = dataset.feature_names
        self.feature_names = [x.replace(' ', '_') for x in self.feature_names]
        self.feature_names = [x.replace('/', '_') for x in self.feature_names]

        self.n_targets = len(self.target_names)
        self.n_features = len(self.feature_names)
        self.n_objects = len(self.data)

        self.minima = np.min(self.data, axis=0)
        self.maxima = np.max(self.data, axis=0)

        if self.normalization:
            for i in range(self.n_features):
                self.data[:, i] = ((self.data[:, i] - self.minima[i]) / (self.maxima[i] - self.minima[i]))

        self.images = []
        self.plot_data()  # uncomment if you want plots of the data; they will be saved in plt_dir

    def __len__(self):
        return self.n_objects

    def __getitem__(self, idx):

        if torch.is_tensor(idx):
            idx = np.array(idx.tolist())

        target = self.targets[idx]
        target = np.array([target], dtype=int).reshape(-1, 1)
        dat = self.data[idx, :]
        dat = np.array([dat], dtype=float).reshape(-1, self.n_features)
        sample = {'data': dat, 'target': target}

        return sample

    # adding some extra functions

    def normalize(self, x):
        assert len(x) == self.n_features
        out = []
        for i, x in enumerate(x):
            mini = self.minima[i]
            maxi = self.maxima[i]
            out += [(x-mini)/(maxi-mini)]
        return out

    def label_name(self, i):
        assert type(i) is int
        assert i < self.n_targets
        return str(self.target_names[i])

    def sort_data(self, column='Target'):
        """Sorts the labels of the dataset in ascending order and returns the sorted dataset."""
        # sort the numpy array
        if column == 'Target':
            idx = np.argsort(self.targets)
            self.targets = self.targets[idx]
            self.data = self.data[idx, :]
        else:
            idx = np.argsort(self.data[:, np.where(self.feature_names == column)])
            self.data = self.data[idx, :]
            self.targets = self.targets[idx]

    def plot_data(self):
        """Plots the data."""
        img = BytesIO()

        data = self.data.copy()
        if self.normalization: # denormalize before plotting
            for i in range(self.n_features):
                data[:, i] = self.data[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]

        n_plots = self.n_features * (self.n_features - 1) // 2
        n_cols = 2
        n_rows = int(np.ceil(n_plots / n_cols))
        if n_plots == 1:
            n_cols = 1
            n_rows = 1
        fig = mf.Figure()
        ax = fig.subplots(n_rows, n_cols)
        k = 0

        for i in range(self.n_features-1):
            if type(data[0, i]) is not str:
                for j in range(i+1, self.n_features):
                    if type(data[0, j]) is not str:
                        row = k // n_cols
                        col = k % n_cols
                        if n_plots == 1:
                            ax.scatter(data[:, i], data[:, j], c=self.targets)
                            ax.set_xlabel(self.feature_names[i].replace('_', ' '))
                            ax.set_ylabel(self.feature_names[j].replace('_', ' '))
                        elif n_rows == 1:
                            ax[col].scatter(data[:, i], data[:, j], c=self.targets)
                            ax[col].set_xlabel(self.feature_names[i].replace('_', ' '))
                            ax[col].set_ylabel(self.feature_names[j].replace('_', ' '))
                        else:
                            ax[row, col].scatter(data[:, i], data[:, j], c=self.targets)
                            ax[row, col].set_xlabel(self.feature_names[i].replace('_', ' '))
                            ax[row, col].set_ylabel(self.feature_names[j].replace('_', ' '))
                        k += 1
        
        fig.tight_layout()
        fig.savefig(img, format='png')
        img.seek(0)
        self.images.append(img.getvalue())
        fig.clear()

    def plot_decision_boundary(self, model, step=0.01):

        if self.n_features < 3:
            if self.normalization:
                mesh = np.meshgrid(*self.n_features * [np.arange(-0.1, 1.1, step)])
            else:
                mesh = np.meshgrid(*[np.arange(mini-(maxi-mini)*step, maxi(maxi-mini)*step, (maxi-mini)*step) for mini, maxi in zip(self.minima, self.maxima)])

            # Plot the decision boundary. For that, we will assign a color to each
            # point in the mesh.
            mesh = np.array(mesh)
            Z = np.array(model.predict(mesh.reshape(self.n_features, -1).T))
            Z = Z.reshape(mesh[0].shape)
            
            data = self.data.copy()
            if self.normalization: # denormalize before plotting
                for i in range(self.n_features):
                    data[:, i] = self.data[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]

            n_plots = self.n_features * (self.n_features - 1) // 2
            n_cols = 2
            n_rows = int(np.ceil(n_plots / n_cols))
            if n_plots == 1:
                n_cols = 1
                n_rows = 1
            fig = mf.Figure()
            ax = fig.subplots(n_rows, n_cols)
            k = 0

            for i in range(self.n_features):
                if type(data[0, i]) is not str:
                    for j in range(i + 1, self.n_features + 1):
                        if type(data[0, j]) is not str:
                            # Put the result into a color plot
                            row = k // n_cols
                            col = k % n_cols
                            if n_plots == 1:
                                ax.contourf(mesh[i][0],
                                            mesh[j][0],
                                            Z, alpha=0.5)
                                ax.scatter(data[:, i], data[:, j], c=self.targets)
                                ax.set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax.set_ylabel(self.feature_names[j].replace('_', ' '))
                                
                                # if self.normalization:
                                #     ax.set_xlim(-0.1, 1.1)
                                #     ax.set_ylim(-0.1, 1.1)
                                # else:
                                #     ax.set_xlim(self.minima[i], self.maxima[i])
                                #     ax.set_ylim(self.minima[j], self.maxima[j])

                            elif n_rows == 1:
                                ax[col].contourf(mesh[i][0],
                                                mesh[j][0],
                                                Z, alpha=0.5)
                                ax[col].scatter(data[:, i], data[:, j], c=self.targets)
                                ax[col].set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax[col].set_ylabel(self.feature_names[j].replace('_', ' '))
                            else:
                                ax[row, col].contourf(mesh[i][0],
                                             mesh[j][0],
                                             Z, alpha=0.5)
                                ax[row, col].scatter(data[:, i], data[:, j], c=self.targets)
                                ax[row, col].set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax[row, col].set_ylabel(self.feature_names[j].replace('_', ' '))
                            k += 1

            img = BytesIO()
            fig.tight_layout()
            fig.savefig(img, format='png')
            img.seek(0)
            self.images.append(img.getvalue())
            fig.clear()


class DataFromSklearn2(Dataset):  # this one is for make_moons(n_samples, noise), make_regression() and make_classification()
    def __init__(self, dataset, normalize=False, data_type=2):  # works for up to 10 features and 10 targets
        self.training_set, self.testing_set, self.validation_set = None, None, None
        self.data_type = data_type
        self.data, self.targets = dataset
        if len(self.data.shape) == 1:
            self.data = self.data.reshape(-1, 1)
        if len(self.targets.shape) == 1:
            self.targets = self.targets.reshape(-1, 1)
        
        self.normalization = normalize
        self.n_targets = len(self.targets[0])
        self.n_features = len(self.data[0])
        self.n_objects = len(self.data)
        if self.data_type == 1:
            self.n_targets = np.unique(self.targets).shape[0]

        self.target_names = ['Target_1', 'Target_2', 'Target_3', 'Target_4', 'Target_5', 'Target_6', 'Target_7',
                             'Target_8', 'Target_9', 'Target_10']
        self.feature_names = ['Feature_1', 'Feature_2', 'Feature_3', 'Feature_4', 'Feature_5', 'Feature_6',
                              'Feature_7', 'Feature_8', 'Feature_9', 'Feature_10']
        self.feature_names = self.feature_names[:self.n_features]
        self.target_names = self.target_names[:self.n_targets]

        self.minima = np.min(self.data, axis=0)
        self.maxima = np.max(self.data, axis=0)
        self.target_minima = np.min(self.targets, axis=0)
        self.target_maxima = np.max(self.targets, axis=0)

        if self.normalization:
            for i in range(self.n_features):
                self.data[:, i] = ((self.data[:, i] - self.minima[i]) / (self.maxima[i] - self.minima[i]))
            if self.data_type == 2:
                for i in range(self.n_targets):
                    self.targets[:, i] = ((self.targets[:, i] - self.target_minima[i]) /
                                          (self.target_maxima[i] - self.target_minima[i]))

        self.images = []
        self.plot_data()  # uncomment if you want plots of the data; they will be saved in plt_dir # TODO are they? 

    def __len__(self):
        return self.n_objects

    def __getitem__(self, idx):

        if torch.is_tensor(idx):
            idx = np.array(idx.tolist())

        if self.data_type == 1:
            target = self.targets[idx]
            target = np.array([target], dtype=int).reshape(-1, 1)
        else:
            target = self.targets[idx]
            target = np.array([target], dtype=float).reshape(-1, self.n_targets)
        dat = self.data[idx, :]
        dat = np.array([dat], dtype=float).reshape(-1, self.n_features)
        sample = {'data': dat, 'target': target}

        return sample

    # adding some extra functions

    def normalize(self, x):
        assert len(x) == self.n_features
        out = []
        for i, x in enumerate(x):
            mini = self.minima[i]
            maxi = self.maxima[i]
            out += [(x-mini)/(maxi-mini)]
        return out

    def denormalize(self, y):
        assert len(y) == self.n_targets
        out = []
        for i, y in enumerate(y):
            mini = self.target_minima[i]
            maxi = self.target_maxima[i]
            out += [y*(maxi-mini)+mini]
        return out

    def label_name(self, i):
        assert type(i) is int
        assert i < self.n_targets
        return str(self.target_names[i])

    def sort_data(self, column='Target'):
        """Sorts the labels of the dataset in ascending order and returns the sorted dataset."""

        if self.data_type == 1:
            if column == 'Target':
                idx = np.argsort(self.targets)
                self.targets = self.targets[idx]
                self.data = self.data[idx, :]
            else:
                idx = np.argsort(self.data[:, np.where(self.feature_names == column)])
                self.data = self.data[idx, :]
                self.targets = self.targets[idx]

        else:
            if column.__contains__('Target'):
                idx = np.argsort(self.targets[:, np.where(self.target_names == column)])
                self.targets = self.targets[idx]
                self.data = self.data[idx, :]
            else:
                idx = np.argsort(self.data[:, np.where(self.feature_names == column)])
                self.data = self.data[idx, :]
                self.targets = self.targets[idx]

    def plot_data(self):
        """Plots the data."""
        img = BytesIO()

        if self.data_type == 1:
            
            data = self.data.copy()
            if self.normalization: # denormalize before plotting
                for i in range(self.n_features):
                    data[:, i] = self.data[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]
                        
            n_plots = self.n_features * (self.n_features - 1) // 2
            n_cols = 2
            n_rows = int(np.ceil(n_plots / n_cols))
            if n_plots == 1:
                n_cols = 1
                n_rows = 1
            fig = mf.Figure()
            ax = fig.subplots(n_rows, n_cols)
            k = 0

            for i in range(self.n_features - 1):
                if type(data[0, i]) is not str:
                    for j in range(i + 1, self.n_features):
                        if type(data[0, j]) is not str:
                            row = k // n_cols
                            col = k % n_cols
                            if n_plots == 1:
                                ax.scatter(data[:, i], data[:, j], c=self.targets, cmap='Dark2')
                                ax.set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax.set_ylabel(self.feature_names[j].replace('_', ' '))
                            elif n_rows == 1:
                                ax[col].scatter(data[:, i], data[:, j], c=self.targets, cmap='Dark2')
                                ax[col].set_xlabel(self.feature_names[i].replace('_', ' '))
                                ax[col].set_ylabel(self.feature_names[j].replace('_', ' '))
                            else:
                                ax[row, col].scatter(data[:, i], data[:, j], c=self.targets, cmap='Dark2')
                                ax[row, col].xlabel(self.feature_names[i].replace('_', ' '))
                                ax[row, col].ylabel(self.feature_names[j].replace('_', ' '))
                            k += 1

        else:
            d = np.concatenate((self.data.copy(), self.targets.copy()), axis=1)
            c = self.feature_names + self.target_names
            # nothing to see here, just move along
            
            if self.normalization:  # denormalize before plotting
                for i in range(self.n_features):
                    d[:, i] = self.data[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]
                for j in range(self.n_targets):
                    d[:, i+j] = self.targets[:, j] * (self.target_maxima[j] - self.target_minima[j]) + self.target_minima[j]

            n_plots = (self.n_features + self.n_targets) * (self.n_features + self.n_targets - 1) // 2
            n_cols = 2
            n_rows = int(np.ceil(n_plots / n_cols))
            if n_plots == 1:
                n_cols = 1
                n_rows = 1
            fig = mf.Figure()
            ax = fig.subplots(n_rows, n_cols)
            k = 0

            for i in range(self.n_features + self.n_targets - 1):
                if type(d[0, i]) is not str:
                    for j in range(i+1, self.n_features + self.n_targets):
                        if type(d[0, j]) is not str:
                            row = k // n_cols
                            col = k % n_cols
                            if n_plots == 1:
                                ax.scatter(d[:, i], d[:, j], c=(4/255, 151/255, 185/255))
                                ax.set_xlabel(c[i].replace('_', ' '))
                                ax.set_ylabel(c[j].replace('_', ' '))
                            elif n_rows == 1:
                                ax[col].scatter(d[:, i], d[:, j], c=(4/255, 151/255, 185/255))
                                ax[col].set_xlabel(c[i].replace('_', ' '))
                                ax[col].set_ylabel(c[j].replace('_', ' '))
                            else:
                                ax[row, col].scatter(d[:, i], d[:, j], c=(4/255, 151/255, 185/255))
                                ax[row, col].set_xlabel(c[i].replace('_', ' '))
                                ax[row, col].set_ylabel(c[j].replace('_', ' '))
                            k += 1
        
        fig.tight_layout()
        fig.savefig(img, format='png')
        img.seek(0)
        self.images.append(img.getvalue())
        fig.clear()

    def plot_decision_boundary(self, model, step=0.01):
        fig = mf.Figure()
        ax = fig.subplots(1, 1)

        if self.data_type == 1:
            if self.n_features < 3 and self.n_targets < 5:
                if self.normalization:
                    mesh = np.meshgrid(*self.n_features * [np.arange(-0.1, 1.1, step)])
                else:
                    mesh = np.meshgrid(*[np.arange(mini-(maxi-mini)*step, maxi+(maxi-mini)*step, (maxi-mini)*step) for mini, maxi in zip(self.minima, self.maxima)])
                
                # Plot the decision boundary. For that, we will assign a color to each
                # point in the mesh.
                    
                mesh = np.array(mesh)
                Z = np.array(model.predict(mesh.reshape(self.n_features, -1).T))
                Z = Z.reshape(mesh[0].shape)

                data = self.data.copy()
                if self.normalization: # denormalize before plotting
                    for i in range(self.n_features):
                        mesh[i] = mesh[i] * (self.maxima[i] - self.minima[i]) + self.minima[i]
                        data[:, i] = self.data[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]

                ax.contourf(mesh[0], mesh[1], Z, alpha=0.5, cmap='Set2')
                ax.scatter(data[:, 0], data[:, 1], c=self.targets, cmap='Dark2')

                ax.set_xlabel("Feature 1")
                ax.set_ylabel("Feature 2")

                # if self.normalization:
                #     ax.set_xlim(-0.1, 1.1)
                #     ax.set_ylim(-0.1, 1.1)
                # else:
                #     ax.set_xlim(self.minima[0], self.maxima[0])
                #     ax.set_ylim(self.minima[1], self.maxima[1])
        
        elif self.data_type == 2:
            if self.n_features == 1 and self.n_targets == 1:
                if self.normalization:
                    inp = np.arange(-0.1, 1.1, step)
                else:
                    mini, maxi = self.minima[0], self.maxima[0]
                    inp = np.arange(mini, maxi, (maxi-mini)*step)

                # Plot the decision boundary. For that, we will assign a color to each
                # point in the mesh.
                inp = np.array(inp)
                Z = np.array(model.predict(inp.reshape(self.n_features, -1).T, typ=2))
                Z = Z[:, 0]

                data = self.data.copy()
                targets = self.targets.copy()
                if self.normalization: # denormalize before plotting
                    for i in range(self.n_features):
                        inp[:, i] = inp[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]
                        data[:, i] = self.data[:, i] * (self.maxima[i] - self.minima[i]) + self.minima[i]
                    for j in range(self.n_targets):
                        Z[:, j] = Z[:, j] * (self.target_maxima[j] - self.target_minima[j]) + self.target_minima[j]
                        targets[:, j] = self.targets[:, j] * (self.target_maxima[j] - self.target_minima[j]) + self.target_minima[j]


                ax.plot(inp, Z, color=(185/255,38/255,4/255))
                ax.scatter(data[:, 0], targets[:, 0])

                ax.set_xlabel("Feature")
                ax.set_ylabel("Target")

                # if self.normalization:
                #     ax.set_xlim(-0.1, 1.1)
                #     ax.set_ylim(-0.1, 1.1)
                # else:
                #     ax.set_xlim(mini, maxi)
                #     ax.set_ylim(self.target_minima[0], self.target_maxima[0])

        img = BytesIO()
        fig.tight_layout()
        fig.savefig(img, format='png')
        img.seek(0)
        self.images.append(img.getvalue())
        fig.clear()


class DataFromFunction(Dataset):  # this one is for one to one regression on simple functions
    def __init__(self, inp, normalize=False):  # works for up to 10 features and 10 targets
        self.data_type = 2

        self.training_set, self.testing_set, self.validation_set = None, None, None
        self.n_features, self.n_targets = 1, 1
        self.function, self.n_objects, lower, upper, noise = inp
        self.data = np.random.rand(self.n_objects) * (upper - lower) + lower

        self.targets = self.function(self.data) + np.random.normal(0, noise, self.n_objects)
        # delete any NaNs
        self.data = self.data[~np.isnan(self.targets)]
        self.targets = self.targets[~np.isnan(self.targets)]

        self.feature_names = ['x']
        self.target_names = ['y']

        self.minima = min(self.data)
        self.maxima = max(self.data)
        self.target_minima = min(self.targets)
        self.target_maxima = max(self.targets)

        self.normalization = normalize
        if normalize:
            self.data = ((self.data - self.minima) / (self.maxima - self.minima))
            self.targets = ((self.targets - self.target_minima) /
                                        (self.target_maxima - self.target_minima))

        self.images = []
        self.plot_data()  

    def __len__(self):
        return self.n_objects

    def __getitem__(self, idx):

        if torch.is_tensor(idx):
            idx = np.array(idx.tolist())

        target = self.targets[idx]
        target = np.array([target], dtype=float).reshape(-1, self.n_targets)
        dat = self.data[idx]
        dat = np.array([dat], dtype=float).reshape(-1, self.n_features)
        sample = {'data': dat, 'target': target}

        return sample

    # some extra functions

    def normalize(self, x):
        assert len(x) == 1
        out = []
        for i, x in enumerate(x):
            mini = self.minima
            maxi = self.maxima
            out += [(x-mini)/(maxi-mini)]
        return out

    def denormalize(self, y):
        assert len(y) == 1 
        out = []
        for i, y in enumerate(y):
            mini = self.target_minima
            maxi = self.target_maxima
            out += [y*(maxi-mini) + mini]
        return out

    def label_name(self, i):
        assert type(i) is int
        assert i < self.n_targets
        return str(self.target_names[i])

    def sort_data(self, column='y'):
        """Sorts the labels of the dataset in ascending order and returns the sorted dataset."""

        if column.__contains__('y'):
            idx = np.argsort(self.targets)
            self.targets = self.targets[idx]
            self.data = self.data[idx]
        else:
            idx = np.argsort(self.data)
            self.data = self.data[idx]
            self.targets = self.targets[idx]

    def plot_data(self):
        """Plots the data."""
        fig = mf.Figure()
        ax = fig.subplots(1, 1)
        img = BytesIO()

        data = self.data.copy()
        targets = self.targets
        if self.normalization: 
            data = self.data*(self.maxima-self.minima) + self.minima 
            targets = [self.denormalize([y])[0] for y in self.targets]

        ax.scatter(data, targets, color=(4/255, 151/255, 185/255))
        ax.set_xlabel(self.feature_names[0].replace('_', ' '))
        ax.set_ylabel(self.target_names[0].replace('_', ' '))
        
        fig.tight_layout()
        fig.savefig(img, format='png')
        img.seek(0)
        self.images.append(img.getvalue())
        fig.clear()

    def plot_decision_boundary(self, model, step=0.01):
        fig = mf.Figure()
        ax = fig.subplots(1, 1)

        if self.normalization:
            inp = np.arange(-0.1, 1.1, step)
        else:
            mini, maxi = self.minima, self.maxima
            inp = np.arange(mini, maxi, (maxi-mini)*step)

        # Plot the predicted function. 
        inp = np.array(inp)
        Z = np.array(model.predict(inp.reshape(self.n_features, -1).T, typ=2))
        Z = Z[:, 0]

        data = self.data.copy()
        targets = self.targets.copy()
        if self.normalization: 
            inp = inp*(self.maxima-self.minima) + self.minima 
            Z = [self.denormalize([y])[0] for y in Z]
            data = self.data*(self.maxima-self.minima) + self.minima 
            targets = [self.denormalize([y])[0] for y in self.targets]
        
        ax.scatter(data, targets, color=(4/255, 151/255, 185/255))
        ax.plot(inp, Z, color=(185/255,38/255,4/255))
        ax.set_xlabel(self.feature_names[0].replace('_', ' '))
        ax.set_ylabel(self.target_names[0].replace('_', ' '))

        # if self.normalization:
        #     ax.set_xlim(-0.1, 1.1)
        #     ax.set_ylim(-0.1, 1.1)
        # else:
        #     ax.set_xlim(mini, maxi)
        #     ax.set_ylim(self.target_minima, self.target_maxima)

        img = BytesIO()
        fig.tight_layout()
        fig.savefig(img, format='png')
        img.seek(0)
        self.images[-1] = img.getvalue()
        fig.clear()
