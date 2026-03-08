# Sepsis Prediction using XGBoost

## Project Overview

Sepsis is a life-threatening medical condition that occurs when the body's response to infection causes widespread inflammation and organ dysfunction. Early detection of sepsis is critical because delayed treatment significantly increases mortality risk.

This project demonstrates a **basic machine learning prototype** designed to predict the likelihood of sepsis using patient clinical data such as vital signs and laboratory measurements. The goal of this project is to explore how **Artificial Intelligence and Machine Learning can assist healthcare systems in identifying early warning signs of sepsis**.

The system uses the **XGBoost (Extreme Gradient Boosting)** algorithm to analyze patient features and predict whether a patient is likely to develop sepsis.

This project is intended as a **demonstration prototype** rather than a production medical system.

---

# Project Objective

The main objective of this project is to:

* Explore the application of **machine learning in healthcare**
* Demonstrate **sepsis prediction using patient clinical data**
* Build a **basic prototype system combining machine learning and web technologies**
* Showcase the integration of **data processing, model training, and application deployment**

---

# Team Members

This project was developed collaboratively by the following team members:

### Pravir Nihar Maity

**Role:** Machine Learning Development
Responsibilities:

* Designing and implementing the machine learning pipeline
* Data preprocessing and feature handling
* Training and evaluating the XGBoost model
* Integrating the prediction logic

### Jaswa J R

**Role:** Full Stack Development
Responsibilities:

* Developing the web interface
* Backend integration for model interaction
* Building the application structure for demonstrating predictions
* Managing frontend and backend communication

### Yogesh G N

**Role:** Data Processing and Support
Responsibilities:

* Data refining and preprocessing support
* Dataset organization and cleaning
* Handling non-technical project coordination tasks
* Supporting documentation and workflow organization

---

# Project Motto

**"Leveraging Artificial Intelligence to assist early detection and improve healthcare awareness."**

Our motivation behind this project was to explore how **machine learning techniques can contribute to healthcare decision support systems**, even at a prototype level. By building a simplified demonstration model, we aim to encourage further research and innovation in **AI-assisted medical diagnostics**.

---

# Project Scope

This project presents a **basic proof-of-concept system** that demonstrates how machine learning models can be used to analyze medical datasets and generate predictions.

The system includes:

* Data preprocessing
* Handling missing values
* Training a machine learning model
* Predicting sepsis risk
* Displaying results through an application interface

Since this is a **demo-level implementation**, it is not intended for real-world clinical use.

---

# Dataset Description

The dataset used in this project contains patient medical measurements typically collected in ICU environments.

Example features include:

* Heart Rate (HR)
* Oxygen Saturation (O2Sat)
* Body Temperature (Temp)
* Blood Pressure measurements (SBP, MAP, DBP)
* Respiratory Rate
* Laboratory test results such as:

  * Glucose
  * White Blood Cells
  * Hemoglobin
  * Platelets
  * Creatinine
  * Bilirubin
* Demographic information:

  * Age
  * Gender

The dataset includes a target variable:

```
SepsisLabel
```

Where:

* **0 → No Sepsis**
* **1 → Sepsis Detected**

---

# Machine Learning Approach

This project uses **XGBoost (Extreme Gradient Boosting)** as the primary machine learning algorithm.

XGBoost is widely used for structured data problems due to its:

* High accuracy
* Efficiency
* Ability to handle missing values
* Strong performance in classification tasks

The model learns patterns from patient medical data and predicts the likelihood of sepsis.

---

# Machine Learning Pipeline

The workflow of the machine learning model includes the following steps:

1. Dataset loading
2. Data cleaning
3. Handling missing values
4. Feature preprocessing
5. Splitting the dataset into training and testing sets
6. Training the XGBoost model
7. Evaluating the model performance
8. Saving the trained model

---

# Technologies Used

### Programming Language

* Python

### Machine Learning Libraries

* pandas
* numpy
* scikit-learn
* xgboost

### Visualization

* matplotlib
* seaborn

### Development Tools

* Jupyter Notebook / Python environment
* GitHub for version control

### Web Development

* Full stack implementation handled separately in the application layer

---

# Installation

Install required dependencies:

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
├── LICENSE
```

---

# Model Implementation (Example)

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

data = pd.read_excel("Dataset.csv.xlsx")

X = data.drop("SepsisLabel", axis=1)
y = data["SepsisLabel"]

imputer = SimpleImputer(strategy="mean")
X = imputer.fit_transform(X)

scaler = StandardScaler()
X = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = XGBClassifier()

model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

---

# Model Evaluation

The model performance is evaluated using:

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix

These metrics help analyze how effectively the model predicts sepsis cases.

---

# Limitations

This project has several limitations:

* It is a **basic demonstration system**
* The dataset may contain missing or incomplete clinical information
* The model is not trained for real medical deployment
* Predictions should **not be used for actual medical diagnosis**

The project is purely intended for **educational and research demonstration purposes**.

---

# Future Improvements

Future enhancements could include:

* Advanced model tuning
* Handling time-series patient data
* Deep learning models for medical prediction
* Real-time hospital monitoring systems
* Integration with medical decision support tools

---

# Conclusion

This project demonstrates a simple prototype for **machine learning-based sepsis prediction**. By combining data processing, machine learning, and application development, the team explored how AI technologies can assist healthcare-related research.

Although this system is only a **basic demonstration**, it highlights the potential of **machine learning in medical data analysis** and encourages further exploration in AI-driven healthcare solutions.

---

# License

This project is licensed under the **MIT License**.

---

# Acknowledgment

We acknowledge the collaborative effort of the team members who contributed to the development of this project across machine learning, full stack development, and data processing tasks.
