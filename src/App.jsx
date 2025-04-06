import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

const API_BASE = "http://localhost:5050";

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [log, setLog] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterAction, setFilterAction] = useState('all');

  const sendPrompt = async () => {
    const res = await fetch(`${API_BASE}/api/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    setResponse(data);
    fetchLogs();
  };

  const fetchLogs = async () => {
    const res = await fetch(`${API_BASE}/logs`);
    const data = await res.json();
    setLog(data.reverse());
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => {
    if (filterAction === 'all') {
      setFiltered(log);
    } else {
      setFiltered(log.filter((entry) => entry.action === filterAction));
    }
  }, [log, filterAction]);

  const getActionStats = () => {
    const counts = {};
    log.forEach(entry => {
      counts[entry.action] = (counts[entry.action] || 0) + 1;
    });
    return Object.entries(counts).map(([action, count]) => ({ action, count }));
  };

  return (
    <div className="p-4 max-w-5xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">🧠 Sentient Prompt Logger + Visualizer</h1>
      <textarea
        className="w-full border p-2 mb-2"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something like: What can you do?"
      />
      <button className="bg-blue-600 text-white px-4 py-2 mb-4" onClick={sendPrompt}>
        Send Prompt
      </button>
      {response && (
        <div className="bg-gray-100 p-3 mb-4 rounded shadow">
          <h2 className="font-semibold mb-1">Latest Response</h2>
          <div><strong>Response:</strong> {response.response}</div>
          <div><strong>Action:</strong> {response.action}</div>
          <div><strong>Reason:</strong> {response.reason}</div>
        </div>
      )}
      <div className="flex items-center gap-4 my-4">
        <label htmlFor="filter">Filter by Action:</label>
        <select
          id="filter"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="all">All</option>
          <option value="log_only">log_only</option>
          <option value="respond">respond</option>
          <option value="store">store</option>
        </select>
      </div>
      <h2 className="text-lg font-semibold mt-6 mb-2">📊 Action Frequency</h2>
      <div className="bg-white p-4 shadow rounded mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={getActionStats()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="action" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#60A5FA" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="text-xl font-semibold mt-6 mb-2">🗂 Log History</h2>
      <div className="border rounded p-3 bg-white shadow-sm max-h-96 overflow-y-scroll">
        {filtered.map((entry, i) => (
          <div key={i} className="mb-3 border-b pb-2">
            <div className="text-sm text-gray-500">{entry.timestamp}</div>
            <div><strong>Prompt:</strong> {entry.prompt}</div>
            <div><strong>Response:</strong> {entry.response}</div>
            <div className="text-xs text-gray-600">
              <em>Action: {entry.action} • Reason: {entry.reason}</em>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
