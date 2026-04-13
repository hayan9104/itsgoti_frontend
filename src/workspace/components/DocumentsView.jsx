import { useState, useEffect } from 'react';
import { workspaceBoardsAPI, workspaceTasksAPI, workspaceUploadAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const DocumentsView = ({ boardId, boardName, boardColor }) => {
  const { user, isSuperAdmin } = useWorkspaceAuth();
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'tasks'
  const [boardDocs, setBoardDocs] = useState([]);
  const [taskDocs, setTaskDocs] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', url: '', type: 'link' });
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [boardId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [boardRes, tasksRes] = await Promise.all([
        workspaceBoardsAPI.getOne(boardId),
        workspaceTasksAPI.getByBoard(boardId)
      ]);

      if (boardRes.data.success) {
        setBoardDocs(boardRes.data.data.attachments || []);
      }

      if (tasksRes.data.success) {
        const tasks = tasksRes.data.data;
        setAllTasks(tasks);
        let allTaskDocs = [];
        
        tasks.forEach(task => {
          // If not super admin, only show documents from tasks they have access to
          const userId = (user?.id || user?._id)?.toString();
          const taskAssigneeId = task.assignee?._id?.toString() || task.assignee?.toString();
          const taskCreatorId = task.createdBy?._id?.toString() || task.createdBy?.toString();
          
          const isAssigned = userId && taskAssigneeId && taskAssigneeId === userId;
          const isCreator = userId && taskCreatorId && taskCreatorId === userId;
          
          if (isSuperAdmin || isAssigned || isCreator) {
            const docs = (task.attachments || []).map(doc => ({
              ...doc,
              _id: doc._id || doc.id, // Ensure _id is present
              taskName: task.title,
              taskId: task._id
            }));
            allTaskDocs = [...allTaskDocs, ...docs];
          }
        });
        
        setTaskDocs(allTaskDocs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate task selection if on tasks tab
    if (activeTab === 'tasks' && !selectedTaskId) {
      alert('Please select a task first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await workspaceUploadAPI.uploadFile(formData);
      if (res.data.success) {
        // Determine file type from MIME type or extension
        const mimeBase = file.type.split('/')[0]; // image, video, audio, application
        let type = 'file';

        if (mimeBase === 'image') type = 'image';
        else if (mimeBase === 'video') type = 'video';
        else if (mimeBase === 'audio') type = 'audio';
        else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) type = 'pdf';
        else if (file.type.includes('word') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) type = 'word';

        const docData = {
          name: file.name,
          url: res.data.url,
          type: type,
          size: file.size
        };

        let saveRes;
        if (activeTab === 'board') {
          saveRes = await workspaceBoardsAPI.addDocument(boardId, docData);
          if (saveRes.data.success) {
            const addedDoc = {
              ...saveRes.data.data,
              _id: saveRes.data.data._id || saveRes.data.data.id
            };
            setBoardDocs(prev => [...prev, addedDoc]);
          }
        } else {
          saveRes = await workspaceTasksAPI.addDocument(selectedTaskId, docData);
          if (saveRes.data.success) {
            // Find task title for local state update
            const task = allTasks.find(t => t._id === selectedTaskId);
            const docWithTask = {
              ...saveRes.data.data,
              _id: saveRes.data.data._id || saveRes.data.data.id,
              taskName: task?.title,
              taskId: selectedTaskId
            };
            setTaskDocs(prev => [...prev, docWithTask]);
          }
        }

        if (saveRes.data.success) {
          setShowAddModal(false);
          setSelectedTaskId('');
          setTaskSearchQuery('');
          // Reset file input
          if (document.querySelector('input[type="file"]')) {
            document.querySelector('input[type="file"]').value = '';
          }
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      alert(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newDoc.name || !newDoc.url) return;

    // Validate task selection if on tasks tab
    if (activeTab === 'tasks' && !selectedTaskId) {
      alert('Please select a task first');
      return;
    }

    setUploading(true);
    try {
      const docData = {
        name: newDoc.name,
        url: newDoc.url,
        type: 'link',
        size: 0
      };

      let saveRes;
      if (activeTab === 'board') {
        saveRes = await workspaceBoardsAPI.addDocument(boardId, docData);
        if (saveRes.data.success) {
          const addedDoc = {
            ...saveRes.data.data,
            _id: saveRes.data.data._id || saveRes.data.data.id
          };
          setBoardDocs(prev => [...prev, addedDoc]);
        }
      } else {
        saveRes = await workspaceTasksAPI.addDocument(selectedTaskId, docData);
        if (saveRes.data.success) {
          const task = allTasks.find(t => t._id === selectedTaskId);
          const docWithTask = {
            ...saveRes.data.data,
            _id: saveRes.data.data._id || saveRes.data.data.id,
            taskName: task?.title,
            taskId: selectedTaskId
          };
          setTaskDocs(prev => [...prev, docWithTask]);
        }
      }

      if (saveRes.data.success) {
        setShowAddModal(false);
        setNewDoc({ name: '', url: '', type: 'link' });
        setSelectedTaskId('');
        setTaskSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to add link:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add link';
      alert(`Failed to add link: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, taskId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      let res;
      if (activeTab === 'board') {
        res = await workspaceBoardsAPI.deleteDocument(boardId, docId);
        if (res.data.success) {
          setBoardDocs(prevDocs => prevDocs.filter(d => d._id !== docId));
        }
      } else {
        // Use the taskId passed from the document object
        res = await workspaceTasksAPI.deleteDocument(taskId, docId);
        if (res.data.success) {
          setTaskDocs(prevDocs => prevDocs.filter(d => d._id !== docId));
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete document');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'pdf': return '📄';
      case 'word': return '📝';
      case 'link': return '🔗';
      default: return '📁';
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading documents...</div>;

  const currentDocs = activeTab === 'board' ? boardDocs : taskDocs;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', backgroundColor: '#2a2b2d' }}>
      {/* Tabs & Actions */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #333436', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', backgroundColor: '#2a2b2d', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setActiveTab('board')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'board' ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: activeTab === 'board' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'board' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Overall Board Documents
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'tasks' ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: activeTab === 'tasks' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'tasks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Task Documents
          </button>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setSelectedTaskId('');
              setTaskSearchQuery('');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f6e6f',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            {activeTab === 'board' ? 'Add Board Document' : 'Upload to Task'}
          </button>
        )}
      </div>

      {/* Documents Grid */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {currentDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
            <p>No documents found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {currentDocs.map((doc, idx) => (
              <div 
                key={idx}
                style={{
                  border: '1px solid #333436',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  backgroundColor: '#2a2b2d',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6f6e6f';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333436';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => window.open(doc.url, '_blank')}
              >
                <div style={{ fontSize: '32px', textAlign: 'center', padding: '10px' }}>
                  {getIcon(doc.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f1f1', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                  </div>
                  {activeTab === 'tasks' && doc.taskName && (
                    <div style={{ fontSize: '12px', color: '#6f6e6f', marginBottom: '4px' }}>
                      Task: {doc.taskName}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {doc.type.toUpperCase()} • {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'LINK'}
                  </div>
                </div>
                
                {isSuperAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc._id, doc.taskId);
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {activeTab === 'board' ? 'Add Board Document' : 'Upload to Task'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {activeTab === 'tasks' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#e5e7eb', marginBottom: '8px' }}>Select Task</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Search tasks..."
                    value={taskSearchQuery}
                    onChange={(e) => {
                      setTaskSearchQuery(e.target.value);
                      setSelectedTaskId(''); // Reset selection when searching
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #424244', fontSize: '14px', outline: 'none' }}
                  />
                  
                  {taskSearchQuery && !selectedTaskId && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#2a2b2d', border: '1px solid #333436', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      {allTasks
                        .filter(t => t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()))
                        .map(task => (
                          <div 
                            key={task._id}
                            onClick={() => {
                              setSelectedTaskId(task._id);
                              setTaskSearchQuery(task.title);
                            }}
                            style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #2a2b2d' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontWeight: '500', color: '#f1f1f1' }}>{task.title}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>Status: {task.status}</div>
                          </div>
                        ))}
                      {allTasks.filter(t => t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())).length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>No tasks found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#e5e7eb', marginBottom: '12px' }}>Upload File</label>
              <div 
                onClick={() => !uploading && !(activeTab === 'tasks' && !selectedTaskId) && document.getElementById('file-upload-input').click()}
                style={{
                  border: '2px dashed #333436',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: (uploading || (activeTab === 'tasks' && !selectedTaskId)) ? 'not-allowed' : 'pointer',
                  backgroundColor: '#252628',
                  transition: 'all 0.2s',
                  opacity: (activeTab === 'tasks' && !selectedTaskId) ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!uploading && !(activeTab === 'tasks' && !selectedTaskId)) {
                    e.currentTarget.style.borderColor = '#6f6e6f';
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333436';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
              >
                <input 
                  id="file-upload-input"
                  type="file" 
                  onChange={handleFileUpload}
                  disabled={uploading || (activeTab === 'tasks' && !selectedTaskId)}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                  {uploading ? '⏳' : '📤'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f1f1f1', marginBottom: '4px' }}>
                  {uploading ? 'Uploading...' : 'Click to select a file'}
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  Images, Videos, PDFs, Word, etc.
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #333436', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#e5e7eb', marginBottom: '8px' }}>Or Add Link</label>
              <input 
                type="text"
                placeholder="Document Name"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #424244', fontSize: '14px', marginBottom: '12px', outline: 'none' }}
              />
              <input 
                type="text"
                placeholder="URL (https://...)"
                value={newDoc.url}
                onChange={(e) => setNewDoc({ ...newDoc, url: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #424244', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
              />
              <button 
                onClick={handleAddLink}
                disabled={uploading || !newDoc.name || !newDoc.url || (activeTab === 'tasks' && !selectedTaskId)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: (newDoc.name && newDoc.url && (activeTab === 'board' || selectedTaskId)) ? '#6f6e6f' : '#333436',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (newDoc.name && newDoc.url && (activeTab === 'board' || selectedTaskId)) ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {uploading ? 'Adding...' : 'Add Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;