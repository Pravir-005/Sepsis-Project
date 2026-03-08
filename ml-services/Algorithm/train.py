import pandas as pd
import numpy as np
import joblib
import json
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score,classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.utils import shuffle

df=pd.read_csv("")

df=shuffle(df,random_state=42)

TARGET="SepsisLabel"

X=df.drop(TARGET,axis=1)
Y=df[TARGET]

feature_names=list(X.columns)

X_train,X_test,Y_train,Y_test=train_test_split(X,Y,test_size=0.2,random_state=42)

neg = len(Y_train[Y_train == 0])
pos = len(Y_train[Y_train == 1])
scale_pos_weight = neg / pos

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.03,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    eval_metric="logloss",
    random_state=42
)

model.fit(X_train,Y_train)

y_pred_proba = model.predict_proba(X_test)[:, 1]
auc = roc_auc_score(Y_test, y_pred_proba)

print("ROC-AUC Score:", auc)
print("\nClassification Report:\n")
print(classification_report(Y_test, model.predict(X_test)))

joblib.dump(model, "xgb_sepsis_model.pkl")

with open("feature_config.json", "w") as f:
    json.dump(feature_names, f)

print("\nModel saved successfully.")