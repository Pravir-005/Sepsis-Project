# Sepsis Prediction using XGBoost

## Project Overview

Sepsis is a life-threatening medical condition caused by the body's extreme response to infection. Early prediction of sepsis can help doctors intervene sooner and save lives.

This project uses **Machine Learning (XGBoost)** to predict whether a patient will develop sepsis based on vital signs and laboratory measurements.

The model analyzes medical parameters such as:

* Heart Rate (HR)
* Oxygen Saturation (O2Sat)
* Temperature
* Blood Pressure
* Respiratory Rate
* Glucose
* White Blood Cells
* Age
* Other clinical indicators

The target variable is:

```
SepsisLabel
```

* **0 → No Sepsis**
* **1 → Sepsis Detected**

---

# Dataset

The dataset contains patient medical measurements collected from ICU monitoring systems.

### Features

Some important features include:

* HR – Heart Rate
* O2Sat – Oxygen Saturation
* Temp – Body Temperature
* SBP – Systolic Blood Pressure
* MAP – Mean Arterial Pressure
* DBP – Diastolic Blood Pressure
* Resp – Respiratory Rate
* EtCO2 – End Tidal CO₂
* BaseExcess
* HCO3
* FiO2
* pH
* PaCO2
* SaO2
* AST
* BUN
* Alkaline Phosphatase
* Calcium
* Chloride
* Creatinine
* Bilirubin Direct
* Glucose
* Lactate
* Magnesium
* Phosphate
* Potassium
* Bilirubin Total
* TroponinI
* Hematocrit
* Hemoglobin
* Platelets
* White Blood Cells
* Age
* Gender

Target Column:

```
SepsisLabel
```

---

# Machine Learning Model

This project uses **XGBoost (Extreme Gradient Boosting)**.

XGBoost is a powerful ensemble learning algorithm that combines multiple decision trees to improve prediction accuracy.

Advantages of XGBoost:

* High prediction accuracy
* Handles missing values well
* Works well with structured medical datasets
* Efficient and fast training

---

# Project Pipeline

The machine learning pipeline follows these steps:

1. Load dataset
2. Clean unnecessary columns
3. Handle missing values
4. Feature scaling
5. Train-test split
6. Train XGBoost model
7. Evaluate performance
8. Visualize results
9. Save trained model

---

# Installation

Install required Python libraries:

```bash
pip install pandas numpy scikit-learn xgboost matplotlib seaborn joblib
```

---

# Project Structure

```
Sepsis-Prediction/
│
├── Dataset.csv.xlsx
├── sepsis_model.py
├── sepsis_xgboost_model.pkl
├── README.md
```

---

# Model Implementation

```python
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from xgboost import XGBClassifier

import matplotlib.pyplot as plt
import seaborn as sns
import joblib


# Load dataset
data = pd.read_excel("Dataset.csv.xlsx")


# Remove unnecessary columns
data = data.drop(columns=["Unnamed: 0","Unnamed: 44","Unnamed: 45"], errors="ignore")


# Separate features and label
X = data.drop("SepsisLabel", axis=1)
y = data["SepsisLabel"]


# Handle missing values
imputer = SimpleImputer(strategy="mean")
X = imputer.fit_transform(X)


# Feature scaling
scaler = StandardScaler()
X = scaler.fit_transform(X)


# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# XGBoost model
model = XGBClassifier(
    n_estimators=300,
    max_depth=7,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss"
)


# Train model
model.fit(X_train, y_train)


# Predictions
y_pred = model.predict(X_test)


# Evaluation
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))


# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)

sns.heatmap(cm, annot=True, fmt="d")

plt.title("Confusion Matrix")

plt.show()


# Save model
joblib.dump(model, "sepsis_xgboost_model.pkl")
```

---

# Model Evaluation

Evaluation metrics used:

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix

These metrics help measure how well the model detects sepsis cases.

---

# Feature Importance

XGBoost allows us to analyze which medical features influence predictions the most.

Example important features:

* Lactate
* Heart Rate
* Respiratory Rate
* White Blood Cells
* Blood Pressure

Understanding feature importance helps doctors interpret model decisions.

---

# Future Improvements

Possible improvements for this project:

* Hyperparameter tuning (GridSearchCV)
* Handling class imbalance
* Using time-series models
* Deep learning approaches
* Real-time ICU monitoring systems

---

# Applications

This model can be used for:

* ICU patient monitoring
* Early sepsis detection
* Clinical decision support systems
* Healthcare AI research

---

# Conclusion

Early sepsis detection can significantly reduce mortality rates.
This project demonstrates how machine learning techniques like XGBoost can assist medical professionals in predicting sepsis risk based on patient data.

---

# Author

***Pravir Nihar Maity***
Computer Science Student
Machine Learning & AI Enthusiast
