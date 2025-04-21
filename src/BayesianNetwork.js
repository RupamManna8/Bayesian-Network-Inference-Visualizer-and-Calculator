import React, { useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './BayesianNetwork.css';

const BayesianNetwork = () => {
  const [variables, setVariables] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [probabilities, setProbabilities] = useState({});
  const [result, setResult] = useState(null);
  const [newVariable, setNewVariable] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [queryVariable, setQueryVariable] = useState('');
  const [evidenceVariable, setEvidenceVariable] = useState('');
  const [evidenceValue, setEvidenceValue] = useState(true);

  const addVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNodes((nodes) => [
        ...nodes,
        {
          id: newVariable,
          data: { label: newVariable },
          position: { x: Math.random() * 500, y: Math.random() * 300 },
        },
      ]);
      setProbabilities(prev => ({
        ...prev,
        [newVariable]: 0.5
      }));
      setNewVariable('');
    }
  };

  const addDependency = (parent, child) => {
    if (parent !== child) {
      const newDep = { parent, child };
      setDependencies([...dependencies, newDep]);
      setEdges((edges) => [
        ...edges,
        {
          id: `${parent}-${child}`,
          source: parent,
          target: child,
          type: 'smoothstep',
          animated: true,
        },
      ]);
      setProbabilities(prev => ({
        ...prev,
        [`${child}|${parent}`]: { true: 0.5, false: 0.5 },
        [parent]: 0.5
      }));
    }
  };

  const updateProbability = (key, value, condition = null) => {
    setProbabilities(prev => ({
      ...prev,
      [key]: condition !== null
        ? { ...prev[key], [condition]: value }
        : value
    }));
    setResult(null);
  };

  const restrictFactor = (factor, variable, value) => {
    return factor.filter(entry => entry[variable] === value);
  };

  const multiplyFactors = (f1, f2) => {
    const result = [];
    for (const row1 of f1) {
      for (const row2 of f2) {
        let canMerge = true;
        for (const key of Object.keys(row1)) {
          if (key !== 'prob' && row2.hasOwnProperty(key) && row1[key] !== row2[key]) {
            canMerge = false;
            break;
          }
        }
        if (canMerge) {
          const merged = { ...row1, ...row2 };
          merged.prob = row1.prob * row2.prob;
          result.push(merged);
        }
      }
    }
    return result;
  };

  const sumOut = (factor, variable) => {
    const grouped = {};
    for (const row of factor) {
      const key = JSON.stringify(Object.fromEntries(Object.entries(row).filter(([k]) => k !== variable && k !== 'prob')));
      grouped[key] = (grouped[key] || 0) + row.prob;
    }
    return Object.entries(grouped).map(([k, prob]) => ({ ...JSON.parse(k), prob }));
  };

  const getCombinations = (variables) => {
    if (variables.length === 0) return [{}];
    const [first, ...rest] = variables;
    const subComb = getCombinations(rest);
    return [
      ...subComb.map(c => ({ ...c, [first]: true })),
      ...subComb.map(c => ({ ...c, [first]: false })),
    ];
  };

  const buildFactors = () => {
    const factors = [];

    variables.forEach(v => {
      const parents = dependencies.filter(d => d.child === v).map(d => d.parent);
      const factor = [];
      const combinations = parents.length === 0 ? [{}] : getCombinations(parents);

      combinations.forEach(comb => {
        [true, false].forEach(val => {
          const key = parents.length ? `${v}|${parents.join(',')}` : v;
          const probData = probabilities[key];
          let prob;
          
          if (parents.length) {
            // Check parent values in combination
            const parentValues = parents.every(p => comb[p]);
            prob = val ? probData.true : probData.false;
            
            // Adjust probability based on parent values
            if (!parentValues) {
              prob = val ? (1 - probData.true) : (1 - probData.false);
            }
          } else {
            prob = val ? probData : (1 - probData);
          }

          factor.push({ ...comb, [v]: val, prob });
        });
      });

      factors.push(factor);
    });

    return factors;
  };

  const variableElimination = (queryVar, evidence = {}) => {
    let factors = buildFactors();

    for (const [varName, val] of Object.entries(evidence)) {
      factors = factors.map(f => f.some(row => varName in row) ? restrictFactor(f, varName, val) : f);
    }

    const toEliminate = variables.filter(v => v !== queryVar && !(v in evidence));

    toEliminate.forEach(v => {
      const relevant = factors.filter(f => f.some(row => v in row));
      const rest = factors.filter(f => !f.some(row => v in row));
      const multiplied = relevant.reduce((acc, cur) => multiplyFactors(acc, cur));
      const summed = sumOut(multiplied, v);
      factors = [...rest, summed];
    });

    const finalFactor = factors.reduce((acc, cur) => multiplyFactors(acc, cur));
    const total = finalFactor.reduce((sum, row) => sum + row.prob, 0);
    const result = finalFactor.find(row => row[queryVar] === true)?.prob || 0;
    return result / total;
  };

  const calculateProbability = () => {
    if (queryVariable && evidenceVariable) {
      const evidence = { [evidenceVariable]: evidenceValue };
      const result = variableElimination(queryVariable, evidence);
      setResult(result);
    }
  };

  return (
    <div className="bayesian-network">
      <h2>Custom Bayesian Network Calculator (with Variable Elimination)</h2>
      <div style={{ height: 400, border: '1px solid #ccc', marginBottom: 20 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <div className="variable-input">
        <input
          type="text"
          value={newVariable}
          onChange={(e) => setNewVariable(e.target.value)}
          placeholder="Enter variable name"
        />
        <button onClick={addVariable}>Add Variable</button>
      </div>

      <div className="variables-list">
        <h3>Variables:</h3>
        {variables.map(variable => (
          <div key={variable} className="variable-item">{variable}</div>
        ))}
      </div>

      {variables.length >= 2 && (
        <div className="dependency-selector">
          <h3>Add Dependency:</h3>
          <select
            onChange={(e) => {
              const [parent, child] = e.target.value.split('|');
              addDependency(parent, child);
            }}
          >
            <option value="">Select parent → child</option>
            {variables.map(v1 =>
              variables.map(v2 =>
                v1 !== v2 && (
                  <option key={`${v1}|${v2}`} value={`${v1}|${v2}`}>
                    {v1} → {v2}
                  </option>
                )
              )
            )}
          </select>
        </div>
      )}

      <div className="probabilities">
        <h3>Set Probabilities:</h3>
        {Object.entries(probabilities).map(([key, value]) => (
          <div key={key} className="input-group">
            {typeof value === 'number' ? (
              <>
                <label>P({key}):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={value}
                  onChange={(e) => updateProbability(key, parseFloat(e.target.value))}
                />
              </>
            ) : (
              <>
                <label>P({key}):</label>
                <div>
                  <div>
                    <label>True:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={value.true}
                      onChange={(e) => updateProbability(key, parseFloat(e.target.value), 'true')}
                    />
                  </div>
                  <div>
                    <label>False:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={value.false}
                      onChange={(e) => updateProbability(key, parseFloat(e.target.value), 'false')}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="probability-calculator">
        <h3>Calculate Probability:</h3>
        <div>
          <label>Query Variable:</label>
          <select value={queryVariable} onChange={(e) => setQueryVariable(e.target.value)}>
            <option value="">Select variable</option>
            {variables.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Evidence Variable:</label>
          <select value={evidenceVariable} onChange={(e) => setEvidenceVariable(e.target.value)}>
            <option value="">Select variable</option>
            {variables.filter(v => v !== queryVariable).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Evidence Value:</label>
          <select value={evidenceValue} onChange={(e) => setEvidenceValue(e.target.value === 'true')}>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      </div>

      <button 
        onClick={calculateProbability}
        disabled={!queryVariable || !evidenceVariable || dependencies.length === 0}
      >
        Calculate Probability (Variable Elimination)
      </button>

      {result !== null && (
        <div className="result">
          <p>P({queryVariable} | {evidenceVariable}={evidenceValue.toString()}) = {result.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
};

export default BayesianNetwork;
