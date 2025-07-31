import React, { useState } from 'react';
import { SubQuestion, SearchResult } from '../../lib/agent/types';

interface DeepSearchReportProps {
  mainTask: string;
  subTasks: SubQuestion[];
  sources: SearchResult[];
  finalAnswer: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

const DeepSearchReport: React.FC<DeepSearchReportProps> = ({
  mainTask,
  subTasks,
  sources,
  finalAnswer,
  status
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm mt-4">
      {/* Header */}
      <div 
        className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 rounded-t-lg"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <h3 className="font-semibold text-lg text-gray-800">Research Process</h3>
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            {status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'In Progress'}
          </span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100">
          {/* Main Task */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Main Research Goal</h4>
            <p className="text-gray-900">{mainTask}</p>
          </div>

          {/* Sub-tasks */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Research Steps</h4>
            <div className="space-y-3">
              {subTasks.map((subTask, index) => (
                <div key={subTask.id} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {subTask.status === 'completed' ? (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : subTask.status === 'in-progress' ? (
                      <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-900">{subTask.question}</p>
                    {subTask.sources && subTask.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {subTask.sources.map((source: string, idx: number) => (
                          <a
                            key={idx}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-blue-600 hover:text-blue-800 transition"
                          >
                            Source {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Answer */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Synthesized Answer</h4>
            <div className="prose max-w-none bg-blue-50 p-4 rounded-lg">
              {finalAnswer ? (
                <div dangerouslySetInnerHTML={{ __html: finalAnswer.replace(/\n/g, '<br />') }} />
              ) : (
                <p className="text-gray-500 italic">
                  {status === 'completed' 
                    ? 'The research is complete, but no answer was generated.' 
                    : 'Generating final answer...'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepSearchReport;