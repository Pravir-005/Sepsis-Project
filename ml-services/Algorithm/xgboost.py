import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from xgboost import XGBClassifier

# load dataset
data = pd.read_excel("Dataset.csv.xlsx")

print("Dataset Shape:", data.shape)
print("\nColumns:\n", data.columns)

# drop index columns created by excel
data = data.drop(columns=["Unnamed: 0", "Unnamed: 44", "Unnamed: 45"], errors='ignore')

print("\nCleaned Columns:", data.columns)

# check missing values
print("\nMissing values in each column:")
print(data.isnull().sum())

# separate features and label
X = data.drop("SepsisLabel", axis=1)
y = data["SepsisLabel"]

# fill missing values using column mean
imputer = SimpleImputer(strategy="mean")

X_imputed = imputer.fit_transform(X)

print("\nMissing values handled using mean strategy")

scaler = StandardScaler()

X_scaled = scaler.fit_transform(X_imputed)


X_train, X_test, y_train, y_test = train_test_split(

    X_scaled,
    y,
    test_size=0.2,
    random_state=42

)

print("\nTraining Samples:", X_train.shape)
print("Testing Samples:", X_test.shape)


model = XGBClassifier(

    n_estimators=300,
    max_depth=7,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42

)

print("\nTraining XGBoost Model...")

model.fit(X_train, y_train)

y_pred = model.predict(X_test)


accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:", accuracy)

print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(6,5))

sns.heatmap(cm, annot=True, fmt="d")

plt.title("Confusion Matrix")

plt.xlabel("Predicted")

plt.ylabel("Actual")

plt.show()

importance = model.feature_importances_

features = X.columns

feature_importance = pd.DataFrame({

    "Feature": features,
    "Importance": importance

})

feature_importance = feature_importance.sort_values(by="Importance", ascending=False)

print("\nTop Important Features:")
print(feature_importance.head(15))


# plot feature importance

plt.figure(figsize=(10,6))

plt.barh(feature_importance["Feature"][:15],
         feature_importance["Importance"][:15])

plt.title("Top Feature Importance")

plt.gca().invert_yaxis()

plt.show()

import joblib

joblib.dump(model, "sepsis_xgboost_model.pkl")

print("\nModel Saved Successfully!")