const mongoose = require('mongoose');
const Question = require('../models/Question');
const Admin = require('../models/Admin');
require('dotenv').config();

const questions = [
  // MEDIUM LEVEL QUESTIONS (1-7)
  {
    questionId: 1,
    questionText: "Calculate the weighted average of product ratings where weights are the number of reviews.",
    dataset: {
      type: "table",
      headers: ["Product", "Rating", "Reviews"],
      rows: [
        ["A", 4.2, 150],
        ["B", 3.8, 200],
        ["C", 4.6, 100],
        ["D", 3.9, 250]
      ]
    },
    answer: "4.01",
    hintText: "Multiply each rating by its reviews, sum them, then divide by total reviews",
    learnContent: "Weighted average: Σ(value × weight) / Σ(weight). Used when data points have different importance.",
    digitValue: 7
  },
  {
    questionId: 2,
    questionText: "What is the coefficient of variation (CV) for this sales data? (round to 2 decimal places)",
    dataset: {
      type: "list",
      values: [120, 150, 180, 200, 250]
    },
    answer: "0.26",
    hintText: "CV = (Standard Deviation / Mean). First calculate mean and std dev",
    learnContent: "Coefficient of Variation measures relative variability, useful for comparing datasets with different scales.",
    digitValue: 3
  },
  {
    questionId: 3,
    questionText: "Based on this scatter plot data, what is the R-squared value? (round to 2 decimal places)",
    dataset: {
      type: "chart",
      chartType: "scatter",
      data: [
        { x: 1, y: 2.1 },
        { x: 2, y: 3.9 },
        { x: 3, y: 6.2 },
        { x: 4, y: 7.8 },
        { x: 5, y: 10.1 }
      ],
      regression: "y = 2.02x + 0.06"
    },
    answer: "0.99",
    hintText: "R² measures how well the regression line fits the data. Look at how close points are to the line",
    learnContent: "R-squared indicates the proportion of variance in dependent variable explained by independent variable.",
    digitValue: 9
  },
  {
    questionId: 4,
    questionText: "Calculate the interquartile range (IQR) for this dataset.",
    dataset: {
      type: "list",
      values: [12, 15, 18, 22, 25, 28, 32, 35, 40, 45]
    },
    answer: "17",
    hintText: "IQR = Q3 - Q1. Find the 75th percentile minus 25th percentile",
    learnContent: "IQR measures the spread of the middle 50% of data, robust against outliers.",
    digitValue: 2
  },
  {
    questionId: 5,
    questionText: "What is the z-score for the value 85 in this dataset? (round to 2 decimal places)",
    dataset: {
      type: "table",
      headers: ["Values"],
      rows: [[70], [75], [80], [85], [90], [95], [100]],
      statistics: { mean: 85, stdDev: 10 }
    },
    answer: "0.00",
    hintText: "Z-score = (value - mean) / standard deviation. The value 85 is exactly the mean",
    learnContent: "Z-score measures how many standard deviations a value is from the mean.",
    digitValue: 5
  },
  {
    questionId: 6,
    questionText: "Calculate the Pearson correlation coefficient between advertising spend and sales. (round to 2 decimal places)",
    dataset: {
      type: "table",
      headers: ["Ad Spend ($000)", "Sales ($000)"],
      rows: [
        [10, 120],
        [15, 150],
        [20, 180],
        [25, 210],
        [30, 240]
      ]
    },
    answer: "1.00",
    hintText: "Perfect positive linear relationship: r = 1.00",
    learnContent: "Pearson correlation measures linear relationship strength between two continuous variables.",
    digitValue: 1
  },
  {
    questionId: 7,
    questionText: "What percentage of data falls within 1 standard deviation of the mean in this normal distribution?",
    dataset: {
      type: "chart",
      chartType: "histogram",
      image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIE5vcm1hbCBEaXN0cmlidXRpb24gQ3VydmUgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImN1cnZlR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj4KICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNGY4MWJkO3N0b3Atb3BhY2l0eTowLjgiLz4KICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMxNzNkYztzdG9wLW9wYWNpdHk6MC45Ii8+CiAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNGY4MWJkO3N0b3Atb3BhY2l0eTowLjgiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8IS0tIEJhY2tncm91bmQgLS0+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZjlmYSIvPgogIDwhLS0gR3JpZCBsaW5lcyAtLT4KICA8ZGVmcz4KICA8cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCAzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KICA8IS0tIEF4ZXMgLS0+CiAgPGxpbmUgeDE9IjUwIiB5MT0iMjUwIiB4Mj0iMzUwIiB5Mj0iMjUwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxsaW5lIHgxPSI1MCIgeTE9IjUwIiB4Mj0iNTAiIHkyPSIyNTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPCEtLSBOb3JtYWwgZGlzdHJpYnV0aW9uIGN1cnZlIC0tPgogIDxwYXRoIGQ9Ik0gNTAgMjUwIFEgMTAwIDIzMCAxNTAgMTgwIFEgMjAwIDEwMCAyNTAgMTgwIFEgMzAwIDIzMCAzNTAgMjUwIiBzdHJva2U9InVybCgjY3VydmVHcmFkaWVudCkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPgogIDwhLS0gU2hhZGVkIGFyZWEgZm9yIDEgc3RhbmRhcmQgZGV2aWF0aW9uIC0tPgogIDxwYXRoIGQ9Ik0gMTUwIDI1MCBRIDE3NSAyMTAgMjAwIDEzNSBRIDIyNSAyMTAgMjUwIDI1MCBaIiBmaWxsPSJyZ2JhKDc1LCAxOTIsIDEwOCwgMC4zKSIgc3Ryb2tlPSIjNGJjMDZjIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8IS0tIExhYmVscyAtLT4KICA8dGV4dCB4PSIyMDAiIHk9IjI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMzMzIj7OvDwvdGV4dD4KICA8dGV4dCB4PSIxNTAiIHk9IjI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij7OvS3PgzwvdGV4dD4KICA8dGV4dCB4PSIyNTAiIHk9IjI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij7OvSvPgzwvdGV4dD4KICA8dGV4dCB4PSIxMDAiIHk9IjI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij7OvS0yz4M8L3RleHQ+CiAgPHRleHQgeD0iMzAwIiB5PSIyNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NiI+zr0rMs+DPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPk5vcm1hbCBEaXN0cmlidXRpb248L3RleHQ+CiAgPHRleHQgeD0iMjAwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM0YmMwNmMiPjY4LjIlPC90ZXh0Pgo8L3N2Zz4K",
      data: [
        { range: "μ-2σ to μ-1σ", percentage: 13.6 },
        { range: "μ-1σ to μ", percentage: 34.1 },
        { range: "μ to μ+1σ", percentage: 34.1 },
        { range: "μ+1σ to μ+2σ", percentage: 13.6 },
        { range: "Others", percentage: 4.6 }
      ]
    },
    answer: "68.2",
    hintText: "Add the percentages for μ-1σ to μ and μ to μ+1σ",
    learnContent: "Empirical rule: ~68% of data falls within 1 standard deviation in normal distribution.",
    digitValue: 8
  },
  // HARD QUESTIONS (8-10)
  {
    questionId: 8,
    questionText: "Calculate the chi-square statistic for this contingency table. (round to 2 decimal places)",
    dataset: {
      type: "table",
      headers: ["Treatment", "Success", "Failure", "Total"],
      rows: [
        ["A", 60, 40, 100],
        ["B", 30, 70, 100],
        ["Total", 90, 110, 200]
      ]
    },
    answer: "18.18",
    hintText: "χ² = Σ((Observed - Expected)² / Expected). Calculate expected frequencies first",
    learnContent: "Chi-square test measures association between categorical variables in contingency tables.",
    digitValue: 4
  },
  {
    questionId: 9,
    questionText: "What is the p-value for a two-tailed t-test with t-statistic = 2.5 and df = 18? (round to 3 decimal places)",
    dataset: {
      type: "table",
      headers: ["t-statistic", "degrees of freedom", "significance level"],
      rows: [[2.5, 18, "α = 0.05"]],
      tTable: "Critical value at α=0.05 (two-tailed) = 2.101"
    },
    answer: "0.022",
    hintText: "Since |t| > critical value, p < 0.05. Use t-distribution table or approximation",
    learnContent: "P-value represents probability of obtaining test statistic as extreme as observed, assuming null hypothesis.",
    digitValue: 6
  },
  {
    questionId: 10,
    questionText: "Calculate the F-statistic for ANOVA with between-group variance = 150 and within-group variance = 25.",
    dataset: {
      type: "table",
      headers: ["Source", "Sum of Squares", "df", "Mean Square"],
      rows: [
        ["Between Groups", 450, 3, 150],
        ["Within Groups", 400, 16, 25],
        ["Total", 850, 19, ""]
      ]
    },
    answer: "6",
    hintText: "F = MSB / MSW = Mean Square Between / Mean Square Within",
    learnContent: "F-statistic in ANOVA compares variance between groups to variance within groups.",
    digitValue: 0
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    await Question.deleteMany({});
    await Admin.deleteMany({});

    await Question.insertMany(questions);
    console.log('Medium-level questions seeded successfully');

    const admin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });

    await admin.save();
    console.log('Admin user created successfully');

    console.log('Database seeded successfully!');
    console.log('Final vault code (digits in order):', questions.map(q => q.digitValue).join(''));
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();