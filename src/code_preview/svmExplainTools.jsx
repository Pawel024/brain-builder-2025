function svmToCode(cValue, gammaValue, kernelType) {
    let code = "from sklearn.svm import SVC\n";
    code += "from sklearn.preprocessing import StandardScaler\n\n";

    code += "def train_svm(X_train, y_train):\n";
    code += "    # Scale the features\n";
    code += "    scaler = StandardScaler()\n";
    code += "    X_train_scaled = scaler.fit_transform(X_train)\n\n";
    
    code += "    # Create and train the SVM model\n";
    code += `    model = SVC(C=${cValue}, `;
    
    if (kernelType === 'rbf') {
        code += `kernel='rbf', gamma=${gammaValue})\n`;
    } else {
        code += "kernel='linear')\n";
    }
    
    code += "    model.fit(X_train_scaled, y_train)\n\n";
    code += "    return model, scaler\n";

    return code;
}

export default svmToCode;
