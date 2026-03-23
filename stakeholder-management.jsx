import React, { useState } from 'react';
import { Users, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, MessageSquare } from 'lucide-react';

const StakeholderManagement = () => {
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Stakeholder data
  const stakeholders = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      department: 'Clinical Operations',
      influence: 'high',
      interest: 'high',
      engagement: 95,
      priority: 'critical',
      lastContact: '2024-11-24',
      nextMeeting: '2024-11-27',
      concerns: ['Patient safety metrics', 'Clinical workflow efficiency'],
      requirements: ['Real-time bed occupancy alerts', 'Clinical outcome dashboards'],
      sentiment: 'positive',
      communicationPreference: 'Weekly meetings + Daily reports'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Chief Financial Officer',
      department: 'Finance',
      influence: 'high',
      interest: 'high',
      engagement: 88,
      priority: 'critical',
      lastContact: '2024-11-23',
      nextMeeting: '2024-11-28',
      concerns: ['Cost optimization', 'Revenue cycle management'],
      requirements: ['Financial forecasting', 'Cost per patient analytics'],
      sentiment: 'neutral',
      communicationPreference: 'Monthly presentations'
    },
    {
      id: 3,
      name: 'Emma Williams',
      role: 'Director of Nursing',
      department: 'Nursing',
      influence: 'medium',
      interest: 'high',
      engagement: 92,
      priority: 'high',
      lastContact: '2024-11-25',
      nextMeeting: '2024-11-29',
      concerns: ['Staff workload', 'Patient-to-nurse ratios'],
      requirements: ['Staffing level recommendations', 'Patient acuity tracking'],
      sentiment: 'positive',
      communicationPreference: 'Bi-weekly updates'
    },
    {
      id: 4,
      name: 'James Martinez',
      role: 'Head of IT',
      department: 'Information Technology',
      influence: 'high',
      interest: 'medium',
      engagement: 75,
      priority: 'high',
      lastContact: '2024-11-20',
      nextMeeting: '2024-12-02',
      concerns: ['System integration', 'Data security'],
      requirements: ['API documentation', 'Security compliance reports'],
      sentiment: 'cautious',
      communicationPreference: 'Technical documentation + Ad-hoc meetings'
    },
    {
      id: 5,
      name: 'Linda Thompson',
      role: 'Quality Improvement Manager',
      department: 'Quality',
      influence: 'medium',
      interest: 'high',
      engagement: 85,
      priority: 'medium',
      lastContact: '2024-11-22',
      nextMeeting: '2024-11-30',
      concerns: ['Quality metrics', 'Patient satisfaction'],
      requirements: ['Quality indicator dashboards', 'Trend analysis'],
      sentiment: 'positive',
      communicationPreference: 'Monthly reports + Quarterly reviews'
    },
    {
      id: 6,
      name: 'Robert Davis',
      role: 'Emergency Department Director',
      department: 'Emergency Medicine',
      influence: 'medium',
      interest: 'high',
      engagement: 90,
      priority: 'high',
      lastContact: '2024-11-25',
      nextMeeting: '2024-11-26',
      concerns: ['ED wait times', 'Patient throughput'],
      requirements: ['Real-time ED dashboard', 'Capacity planning tools'],
      sentiment: 'positive',
      communicationPreference: 'Daily briefings'
    }
  ];

  const upcomingMeetings = [
    { date: '2024-11-26', stakeholder: 'Robert Davis', topic: 'ED Analytics Review', duration: '1 hour' },
    { date: '2024-11-27', stakeholder: 'Dr. Sarah Johnson', topic: 'Clinical Dashboard Demo', duration: '45 min' },
    { date: '2024-11-28', stakeholder: 'Michael Chen', topic: 'Financial Analytics Presentation', duration: '1.5 hours' },
    { date: '2024-11-29', stakeholder: 'Emma Williams', topic: 'Nursing Metrics Discussion', duration: '30 min' },
    { date: '2024-11-30', stakeholder: 'Linda Thompson', topic: 'Quality Dashboard Walkthrough', duration: '1 hour' }
  ];

  const actionItems = [
    { id: 1, stakeholder: 'Dr. Sarah Johnson', action: 'Prepare clinical outcome analysis', priority: 'high', dueDate: '2024-11-26', status: 'in-progress' },
    { id: 2, stakeholder: 'Michael Chen', action: 'Generate cost savings report', priority: 'critical', dueDate: '2024-11-27', status: 'pending' },
    { id: 3, stakeholder: 'Emma Williams', action: 'Create staffing optimization dashboard', priority: 'medium', dueDate: '2024-11-28', status: 'in-progress' },
    { id: 4, stakeholder: 'James Martinez', action: 'Complete security audit documentation', priority: 'high', dueDate: '2024-11-29', status: 'pending' },
    { id: 5, stakeholder: 'Linda Thompson', action: 'Prepare quality metrics presentation', priority: 'medium', dueDate: '2024-11-30', status: 'completed' }
  ];

  const getInfluenceInterestQuadrant = (stakeholder) => {
    const influence = stakeholder.influence === 'high' ? 'High' : 'Medium/Low';
    const interest = stakeholder.interest === 'high' ? 'High' : 'Medium/Low';
    
    if (influence === 'High' && interest === 'High') return 'Manage Closely';
    if (influence === 'High' && interest === 'Medium/Low') return 'Keep Satisfied';
    if (influence === 'Medium/Low' && interest === 'High') return 'Keep Informed';
    return 'Monitor';
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'neutral': return 'text-yellow-600 bg-yellow-100';
      case 'cautious': return 'text-orange-600 bg-orange-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Stakeholder Management</h1>
        </div>
        <p className="text-gray-600">Business stakeholder engagement and communication tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{stakeholders.length}</span>
          </div>
          <p className="text-sm text-gray-600">Total Stakeholders</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-6 h-6 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{upcomingMeetings.length}</span>
          </div>
          <p className="text-sm text-gray-600">Upcoming Meetings</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-6 h-6 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{actionItems.filter(a => a.status !== 'completed').length}</span>
          </div>
          <p className="text-sm text-gray-600">Active Action Items</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">87%</span>
          </div>
          <p className="text-sm text-gray-600">Avg Engagement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stakeholder List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Key Stakeholders</h2>
          </div>
          
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {stakeholders.map((stakeholder) => (
              <div
                key={stakeholder.id}
                onClick={() => setSelectedStakeholder(stakeholder)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedStakeholder?.id === stakeholder.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{stakeholder.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(stakeholder.sentiment)}`}>
                        {stakeholder.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{stakeholder.role}</p>
                    <p className="text-xs text-gray-500">{stakeholder.department}</p>
                  </div>
                  <div className={`w-2 h-12 rounded ${getPriorityColor(stakeholder.priority)}`}></div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Engagement</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${stakeholder.engagement}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{stakeholder.engagement}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Strategy</p>
                    <p className="text-xs font-medium text-gray-700">{getInfluenceInterestQuadrant(stakeholder)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Next Meeting</p>
                    <p className="text-xs font-medium text-gray-700">{stakeholder.nextMeeting}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Stakeholder Details */}
          {selectedStakeholder ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Stakeholder Details</h2>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{selectedStakeholder.name}</h3>
                  <p className="text-sm text-gray-600">{selectedStakeholder.role}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Key Concerns</p>
                  <div className="space-y-1">
                    {selectedStakeholder.concerns.map((concern, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Requirements</p>
                  <div className="space-y-1">
                    {selectedStakeholder.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Communication Preference</p>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{selectedStakeholder.communicationPreference}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Last Contact</p>
                      <p className="font-medium text-gray-700">{selectedStakeholder.lastContact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Next Meeting</p>
                      <p className="font-medium text-gray-700">{selectedStakeholder.nextMeeting}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a stakeholder to view details</p>
            </div>
          )}

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Meetings</h2>
            </div>
            
            <div className="p-4 space-y-3">
              {upcomingMeetings.slice(0, 4).map((meeting, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{meeting.topic}</p>
                    <p className="text-xs text-gray-600">{meeting.stakeholder}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{meeting.date}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{meeting.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Action Items</h2>
            </div>
            
            <div className="p-4 space-y-2">
              {actionItems.filter(a => a.status !== 'completed').slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{item.action}</p>
                    <p className="text-xs text-gray-600">{item.stakeholder}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.priority}
                      </span>
                      <span className="text-xs text-gray-500">Due: {item.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeholderManagement;
