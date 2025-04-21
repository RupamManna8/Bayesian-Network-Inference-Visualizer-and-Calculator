# Bayesian Network Calculator (with Variable Elimination)
This is a React-based visual tool for building custom Bayesian networks and performing probabilistic inference using the variable elimination algorithm.


## 🚀 Features
🧠 Create custom variables representing nodes in your Bayesian network.

🔁 Define dependencies (edges) between variables.

📊 Assign conditional and unconditional probabilities.

🔍 Query the probability of a variable given evidence using variable elimination.

🎨 Interactive graph visualization using React Flow.

💡 Real-time inference updates.

## 📦 Tech Stack
React – UI framework

React Flow – Graph/network visualization

CSS – Custom styles for the UI

JavaScript – Core logic & inference algorithm implementation

## 🛠️ Setup Instructions
1. Clone the Repository

 git clone https://github.com/RupamManna8/Bayesian-Network-Inference-Visualizer-and-Calculator.git

 cd bayesian-network

2. Install Dependencies

 npm install

3. Run the App

 npm start
 
This will launch the app at http://localhost:3000.

## 🔧 Usage Guide
➕ Add Variables
Enter a variable name and click "Add Variable".

Each variable appears as a node in the graph.

🔗 Define Dependencies
Use the dropdown to define parent → child relationships.

📈 Set Probabilities
For independent variables: set P(Variable).

For dependent variables: set P(Child | Parent) (true/false cases).

❓ Query Probability
Select a query variable and an evidence variable with a boolean value.

Click "Calculate Probability" to perform inference using variable elimination.

## 🧠 Inference Logic
This tool implements the variable elimination algorithm, which:

Builds factor tables from user-defined CPTs.

Restricts factors based on evidence.

Eliminates hidden variables via summation.

Multiplies remaining factors and normalizes to get the final probability.

## 📁 File Structure

src/

 │
 ├── BayesianNetwork.js   # Main component with logic and UI
 ├── BayesianNetwork.css  # Styling
 ├── App.js               # Entry point
 └── index.js             # ReactDOM render


## 📜 License
MIT License — feel free to use, modify, and distribute.