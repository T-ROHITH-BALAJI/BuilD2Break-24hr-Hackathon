import React, { useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const AdminDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    const results = {
      token: null,
      apiBase: null,
      endpoints: {},
      errors: []
    };

    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      results.token = token ? 'Found' : 'Not found';
      
      // Determine API base URL
      results.apiBase = window.location.origin.includes('localhost') 
        ? 'http://localhost:5000' 
        : window.location.origin;

      // Test endpoints
      const endpoints = [
        { name: 'Dashboard Stats', path: '/api/admin/dashboard/stats' },
        { name: 'Users Count', path: '/api/admin/users?limit=1' },
        { name: 'Jobs Count', path: '/api/admin/jobs?limit=1' },
        { name: 'Applications Count', path: '/api/admin/applications?limit=1' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Testing ${endpoint.name}: ${results.apiBase}${endpoint.path}`);
          
          const response = await fetch(`${results.apiBase}${endpoint.path}`, {
            method: 'GET',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          });

          const responseText = await response.text();
          
          results.endpoints[endpoint.name] = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            response: responseText ? responseText.substring(0, 500) + '...' : 'Empty response'
          };
          
          // Try to parse as JSON for successful responses
          if (response.ok && responseText) {
            try {
              const jsonData = JSON.parse(responseText);
              results.endpoints[endpoint.name].data = jsonData;
            } catch (e) {
              // Not JSON, keep as text
            }
          }
          
        } catch (error) {
          results.endpoints[endpoint.name] = {
            error: error.message,
            ok: false
          };
          results.errors.push(`${endpoint.name}: ${error.message}`);
        }
      }

      // Test database connectivity by checking user count
      try {
        const response = await fetch('/api/admin/users?limit=1&page=1', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          results.databaseConnection = `Working - Found ${data.pagination?.total || 0} users total`;
        } else {
          results.databaseConnection = `Error: ${response.status} ${response.statusText}`;
        }
      } catch (error) {
        results.databaseConnection = `Error: ${error.message}`;
      }

    } catch (error) {
      results.errors.push(`General error: ${error.message}`);
    }

    setDebugInfo(results);
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">🔍 Admin Debug Panel</h3>
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Test API Connectivity
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-4 text-sm">
          {/* Token Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${debugInfo.token === 'Found' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span><strong>Auth Token:</strong> {debugInfo.token}</span>
          </div>

          {/* API Base */}
          <div>
            <strong>API Base URL:</strong> {debugInfo.apiBase}
          </div>

          {/* Database Connection */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${debugInfo.databaseConnection?.includes('Working') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span><strong>Database:</strong> {debugInfo.databaseConnection}</span>
          </div>

          {/* Endpoints */}
          <div>
            <strong>Endpoint Tests:</strong>
            <div className="ml-4 mt-2 space-y-2">
              {Object.entries(debugInfo.endpoints).map(([name, result]) => (
                <div key={name} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${result.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <strong>{name}</strong>
                    <span className="text-gray-600">({result.status || 'Error'})</span>
                  </div>
                  
                  {result.data && (
                    <div className="bg-green-50 p-2 rounded mt-2">
                      <strong>Data Preview:</strong>
                      <pre className="text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2).substring(0, 300)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-50 p-2 rounded mt-2 text-red-700">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.response && !result.data && (
                    <div className="bg-gray-50 p-2 rounded mt-2">
                      <strong>Response:</strong>
                      <div className="text-xs mt-1">{result.response}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {debugInfo.errors.length > 0 && (
            <div className="bg-red-50 p-3 rounded">
              <strong className="text-red-800">Errors:</strong>
              <ul className="mt-2 text-red-700">
                {debugInfo.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDebugPanel;