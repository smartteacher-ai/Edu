import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { FileText, Trash2, Plus, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ContentList() {
  const { contents, deleteContent } = useStore();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Content</h1>
          <p className="text-gray-500 mt-1">Manage your uploaded files and raw text.</p>
        </div>
        <Link 
          to="/content/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Upload
        </Link>
      </div>

      {contents.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Upload a document or paste some text to start generating educational materials.</p>
          <Link 
            to="/content/new" 
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Upload your first file &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {contents.map((item) => (
              <li key={item.id} className="hover:bg-gray-50 transition-colors group">
                <div className="flex items-center justify-between p-4 sm:px-6">
                  <Link to={`/content/${item.id}`} className="flex-1 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          {item.type}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(item.extractedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm('Are you sure you want to delete this content?')) {
                          deleteContent(item.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <Link to={`/content/${item.id}`} className="p-2 text-gray-400 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
