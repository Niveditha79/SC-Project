import pandas as pd
import numpy as np

np.random.seed(42)
n_samples = 1000

# Features
age = np.random.randint(18, 70, size=n_samples)
education_years = np.random.randint(10, 20, size=n_samples)
gender = np.random.choice(['Male', 'Female'], size=n_samples)

# Introduce Bias: Males are slightly more likely to be approved regardless of other features
# Approval depends on education, age, and heavily on gender to create demographic parity difference
score = education_years * 2 + age * 0.5
score[gender == 'Male'] += 10  # Bias

# Target: Approved (1) or Denied (0)
threshold = np.median(score)
approved = (score > threshold).astype(int)

df = pd.DataFrame({
    'Age': age,
    'Education_Years': education_years,
    'Gender': gender,
    'Approved': approved
})

df.to_csv('test_dataset.csv', index=False)
print("test_dataset.csv created successfully.")
