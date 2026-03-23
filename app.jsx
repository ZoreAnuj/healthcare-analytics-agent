import React, { useState, useEffect, useRef } from 'react';
import { Send, TrendingUp, Users, Activity, AlertCircle, Brain, BarChart3, Download, Sparkles } from 'lucide-react';

const HealthcareGenAIDashboard = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Healthcare Analytics Assistant. I can help you analyze patient data, generate insights, and create visualizations on demand. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const messagesEndRef = useRef(null);

  // Sample healthcare metrics
  const [metrics] = useState({
    totalPatients: 45678,
    activeAppointments: 234,
    bedOccupancy: 87.5,
    avgWaitTime: 23,
    criticalAlerts: 12,
    patientSatisfaction: 4.6
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userQuery) => {
    // Simulate AI processing with contextual responses
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerQuery = userQuery.toLowerCase();
    
    if (lowerQuery.includes('patient') && (lowerQuery.includes('trend') || lowerQuery.includes('admission'))) {
      return {
        type: 'analysis',
        content: 'Based on the last 30 days of data, patient admissions show a 12% increase compared to the previous period. The key drivers are:\n\n• Respiratory conditions increased by 18% (likely seasonal)\n• Emergency admissions up 8%\n• Elective procedures remained stable\n\nPeak admission times: Monday 9-11 AM and Friday 2-4 PM',
        visualization: 'lineChart',
        data: generateTrendData()
      };
    } else if (lowerQuery.includes('bed') || lowerQuery.includes('occupancy')) {
      return {
        type: 'analysis',
        content: 'Current bed occupancy analysis:\n\n• Overall occupancy: 87.5% (above optimal 85%)\n• ICU beds: 92% occupied (12 available)\n• General wards: 85% occupied\n• Maternity: 78% occupied\n\nRecommendation: Consider activating surge capacity protocols for ICU and prioritizing elective procedure scheduling.',
        visualization: 'barChart',
        data: generateOccupancyData()
      };
    } else if (lowerQuery.includes('wait') || lowerQuery.includes('time')) {
      return {
        type: 'analysis',
        content: 'Wait time analysis for Emergency Department:\n\n• Average wait: 23 minutes (target: <20 min)\n• Triage to physician: 18 minutes\n• Physician to treatment: 45 minutes\n• Treatment to discharge: 2.3 hours\n\nBottleneck identified: Treatment phase. Recommend increasing nursing staff during peak hours (2-6 PM).',
        visualization: 'heatmap',
        data: null
      };
    } else if (lowerQuery.includes('department') || lowerQuery.includes('performance')) {
      return {
        type: 'analysis',
        content: 'Department performance summary:\n\n• Cardiology: 96% patient satisfaction, 4.2 avg length of stay\n• Orthopedics: 94% satisfaction, 3.8 avg length of stay\n• Emergency: 88% satisfaction, high volume (234 today)\n• Pediatrics: 98% satisfaction, excellent outcomes\n\nTop performer: Pediatrics. Area for improvement: Emergency department workflow optimization.',
        visualization: 'radarChart',
        data: null
      };
    } else if (lowerQuery.includes('cost') || lowerQuery.includes('revenue') || lowerQuery.includes('financial')) {
      return {
        type: 'analysis',
        content: 'Financial performance insights:\n\n• Monthly revenue: £4.2M (8% increase YoY)\n• Average cost per patient: £892\n• Insurance claim processing time: 12 days\n• Outstanding receivables: £1.3M\n\nOpportunity: Reducing claim processing time by 3 days could improve cash flow by approximately £325K monthly.',
        visualization: 'financial',
        data: generateFinancialData()
      };
    } else if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) {
      return {
        type: 'prediction',
        content: 'AI-powered forecast for next 7 days:\n\n• Expected admissions: 312 patients (±15)\n• High-risk readmission patients: 28\n• Predicted bed shortfall: 2 days (Thursday-Friday)\n• Recommended staffing increase: 12%\n\nML Model Confidence: 87%\n\nProactive recommendation: Schedule additional on-call staff for Thursday and Friday.',
        visualization: 'forecast',
        data: generateForecastData()
      };
    } else {
      return {
        type: 'general',
        content: 'I can help you with various healthcare analytics queries:\n\n• Patient admission trends and patterns\n• Bed occupancy and capacity planning\n• Department performance metrics\n• Wait time analysis\n• Financial performance insights\n• Predictive forecasting\n• Clinical outcome analysis\n\nTry asking something like: "Show me patient admission trends" or "What\'s our bed occupancy status?"'
      };
    }
  };

  const generateTrendData = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      admissions: Math.floor(Math.random() * 30) + 40,
      discharges: Math.floor(Math.random() * 28) + 38
    }));
  };

  const generateOccupancyData = () => {
    return [
      { dept: 'ICU', occupancy: 92 },
      { dept: 'General', occupancy: 85 },
      { dept: 'Maternity', occupancy: 78 },
      { dept: 'Pediatric', occupancy: 88 },
      { dept: 'Surgery', occupancy: 90 }
    ];
  };

  const generateFinancialData = () => {
    return Array.from({ length: 6 }, (_, i) => ({
      month: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][i],
      revenue: Math.floor(Math.random() * 800000) + 3600000,
      costs: Math.floor(Math.random() * 600000) + 2800000
    }));
  };

  const generateForecastData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      predicted: Math.floor(Math.random() * 20) + 40,
      confidence: Math.random() * 15 + 80
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        visualization: aiResponse.visualization,
        data: aiResponse.data,
        type: aiResponse.type
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualization = (type, data) => {
    if (!type || !data) return null;

    switch (type) {
      case 'lineChart':
        return <LineChartViz data={data} />;
      case 'barChart':
        return <BarChartViz data={data} />;
      case 'financial':
        return <FinancialChartViz data={data} />;
      case 'forecast':
        return <ForecastChartViz data={data} />;
      default:
        return null;
    }
  };

  const LineChartViz = ({ data }) => (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Patient Admission Trends (30 Days)</h4>
      <div className="relative h-48">
        <svg width="100%" height="100%" viewBox="0 0 600 180">
          <line x1="30" y1="160" x2="580" y2="160" stroke="#e5e7eb" strokeWidth="2" />
          <line x1="30" y1="20" x2="30" y2="160" stroke="#e5e7eb" strokeWidth="2" />
          
          {data.map((point, i) => {
            if (i === 0) return null;
            const prevPoint = data[i - 1];
            const x1 = 30 + (i - 1) * (550 / (data.length - 1));
            const x2 = 30 + i * (550 / (data.length - 1));
            const y1 = 160 - (prevPoint.admissions * 2);
            const y2 = 160 - (point.admissions * 2);
            return (
              <line
                key={`admission-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
          
          {data.map((point, i) => {
            if (i === 0) return null;
            const prevPoint = data[i - 1];
            const x1 = 30 + (i - 1) * (550 / (data.length - 1));
            const x2 = 30 + i * (550 / (data.length - 1));
            const y1 = 160 - (prevPoint.discharges * 2);
            const y2 = 160 - (point.discharges * 2);
            return (
              <line
                key={`discharge-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Admissions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Discharges</span>
        </div>
      </div>
    </div>
  );

  const BarChartViz = ({ data }) => (
    <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Department Bed Occupancy</h4>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-700 font-medium">{item.dept}</span>
              <span className="text-gray-600">{item.occupancy}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  item.occupancy > 90 ? 'bg-red-500' : item.occupancy > 85 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${item.occupancy}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FinancialChartViz = ({ data }) => (
    <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Performance (6 Months)</h4>
      <div className="relative h-48">
        <svg width="100%" height="100%" viewBox="0 0 600 180">
          {data.map((item, i) => {
            const x = 60 + i * 90;
            const revenueHeight = (item.revenue / 5000000) * 140;
            const costHeight = (item.costs / 5000000) * 140;
            return (
              <g key={i}>
                <rect
                  x={x - 15}
                  y={160 - revenueHeight}
                  width="15"
                  height={revenueHeight}
                  fill="#10b981"
                  rx="2"
                />
                <rect
                  x={x + 5}
                  y={160 - costHeight}
                  width="15"
                  height={costHeight}
                  fill="#ef4444"
                  rx="2"
                />
                <text x={x} y="175" fontSize="11" fill="#666" textAnchor="middle">
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-gray-600">Costs</span>
        </div>
      </div>
    </div>
  );

  const ForecastChartViz = ({ data }) => (
    <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">7-Day Admission Forecast (AI-Powered)</h4>
      <div className="relative h-48">
        <svg width="100%" height="100%" viewBox="0 0 600 180">
          {data.map((item, i) => {
            const x = 60 + i * 77;
            const predHeight = (item.predicted / 60) * 130;
            const confHeight = (item.confidence / 100) * 20;
            return (
              <g key={i}>
                <rect
                  x={x - 12}
                  y={150 - predHeight}
                  width="24"
                  height={predHeight}
                  fill="#f59e0b"
                  rx="3"
                />
                <rect
                  x={x - 8}
                  y={155}
                  width="16"
                  height={confHeight}
                  fill="#22c55e"
                  rx="2"
                  opacity="0.7"
                />
                <text x={x} y="175" fontSize="10" fill="#666" textAnchor="middle">
                  {item.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span className="text-xs text-gray-600">Predicted Admissions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-600">Confidence Level</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Healthcare AI Analytics</h1>
                <p className="text-sm text-gray-500">Conversational Dashboard powered by Gen AI</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Metrics Sidebar */}
          {showMetrics && (
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.totalPatients.toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-1">Total Patients</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.activeAppointments}</div>
                <div className="text-xs text-gray-600 mt-1">Active Appointments</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span className="text-xs text-gray-500">Current</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.bedOccupancy}%</div>
                <div className="text-xs text-gray-600 mt-1">Bed Occupancy</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-gray-500">Urgent</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.criticalAlerts}</div>
                <div className="text-xs text-gray-600 mt-1">Critical Alerts</div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-4 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold">AI Insights</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  Ask me anything about your healthcare data. I can analyze trends, predict outcomes, and provide actionable insights in real-time.
                </p>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col" style={{ height: '75vh' }}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        : 'bg-gray-50 border border-gray-200'
                    } rounded-2xl px-5 py-3 shadow-sm`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-gray-600">AI Assistant</span>
                      </div>
                    )}
                    <div className={`text-sm whitespace-pre-line ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      {message.content}
                    </div>
                    {message.visualization && message.data && renderVisualization(message.visualization, message.data)}
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Analyzing data...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about patient trends, bed occupancy, forecasts, or any healthcare metrics..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['Show patient admission trends', 'Bed occupancy status', 'Predict next week', 'Department performance'].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareGenAIDashboard;
