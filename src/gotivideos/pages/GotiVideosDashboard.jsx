import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill={active ? '#0dbaab' : '#9ca3af'} />
  </svg>
);
const MediaIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="3" stroke={active ? '#0dbaab' : '#9ca3af'} strokeWidth="2" />
    <path d="M9 8L17 12L9 16V8Z" fill={active ? '#0dbaab' : '#9ca3af'} />
  </svg>
);
const ShoppableIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke={active ? '#0dbaab' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke={active ? '#0dbaab' : '#9ca3af'} strokeWidth="2"/>
    <path d="M16 10C16 12.21 14.21 14 12 14C9.79 14 8 12.21 8 10" stroke={active ? '#0dbaab' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FolderSVG = ({ size = 72 }) => (
  <svg width={size} height={Math.round(size * 0.8)} viewBox="0 0 72 58" fill="none">
    <path d="M0 8C0 3.58 3.58 0 8 0H26L33 9H64C68.42 9 72 12.58 72 17V50C72 54.42 68.42 58 64 58H8C3.58 58 0 54.42 0 50V8Z" fill="#8a8a8a"/>
    <path d="M0 17H72V50C72 54.42 68.42 58 64 58H8C3.58 58 0 54.42 0 50V17Z" fill="#9e9e9e"/>
  </svg>
);

export default function GotiVideosDashboard() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('media');
  const [activeSubNav, setActiveSubNav] = useState('all');
  const [videos, setVideos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root, {_id, name} = inside folder

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [hoveredFolder, setHoveredFolder] = useState(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState(null);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');

  const [showProductFilter, setShowProductFilter] = useState(false);
  const [showMediaTypeFilter, setShowMediaTypeFilter] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeProductFilter, setActiveProductFilter] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState(null);
  const [sortBy, setSortBy] = useState('date_created');

  const fileInputRef = useRef(null);
  const folderNameRef = useRef(null);
  const renameRef = useRef(null);
  const clickTimers = useRef({});

  useEffect(() => {
    if (!shop) return;
    loadFolders();
  }, [shop]);

  useEffect(() => {
    if (!shop) return;
    loadVideos();
  }, [shop, currentFolder, activeSubNav]);

  useEffect(() => {
    if (showNewFolderModal && folderNameRef.current) folderNameRef.current.focus();
  }, [showNewFolderModal]);

  useEffect(() => {
    if (showRenameModal && renameRef.current) renameRef.current.focus();
  }, [showRenameModal]);

  useEffect(() => {
    const handler = () => {
      setShowProductFilter(false);
      setShowMediaTypeFilter(false);
      setShowSortMenu(false);
      setFolderMenuOpen(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const loadFolders = async () => {
    const res = await fetch(`/api/gotivideos/folders?shop=${shop}`);
    const data = await res.json();
    if (data.success) setFolders(data.data);
  };

  const loadVideos = async () => {
    let url = `/api/gotivideos/videos?shop=${shop}`;
    if (activeSubNav === 'all' || activeSubNav === 'uploads') {
      url += currentFolder ? `&folderId=${currentFolder._id}` : `&folderId=root`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setVideos(data.data);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    if (currentFolder) formData.append('folderId', currentFolder._id);
    setUploading(true);
    setUploadProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/gotivideos/videos?shop=${shop}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => { setUploading(false); setUploadProgress(0); loadVideos(); };
    xhr.onerror = () => { setUploading(false); alert('Upload failed'); };
    xhr.send(formData);
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/gotivideos/videos/${id}?shop=${shop}`, { method: 'DELETE' });
    setVideos(v => v.filter(x => x._id !== id));
  };

  // Single click selects, double click opens folder
  const handleFolderClick = (folder) => {
    if (clickTimers.current[folder._id]) {
      clearTimeout(clickTimers.current[folder._id]);
      delete clickTimers.current[folder._id];
      // Double click → open folder
      setCurrentFolder(folder);
      setSearch('');
    } else {
      clickTimers.current[folder._id] = setTimeout(() => {
        delete clickTimers.current[folder._id];
        // Single click → do nothing (just hover effect)
      }, 280);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const res = await fetch(`/api/gotivideos/folders?shop=${shop}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setFolders(f => [...f, data.data]);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

  const deleteFolder = async (id) => {
    if (!confirm('Delete this folder? Videos inside will be moved to root.')) return;
    await fetch(`/api/gotivideos/folders/${id}?shop=${shop}`, { method: 'DELETE' });
    setFolders(f => f.filter(x => x._id !== id));
    setFolderMenuOpen(null);
  };

  const openRename = (folder) => {
    setRenameTarget(folder);
    setRenameName(folder.name);
    setShowRenameModal(true);
    setFolderMenuOpen(null);
  };

  const confirmRename = async () => {
    if (!renameName.trim()) return;
    const res = await fetch(`/api/gotivideos/folders/${renameTarget._id}?shop=${shop}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setFolders(f => f.map(x => x._id === renameTarget._id ? data.data : x));
      if (currentFolder?._id === renameTarget._id) setCurrentFolder(data.data);
    }
    setShowRenameModal(false);
    setRenameTarget(null);
  };

  if (!shop) { window.location.href = '/gotivideos/install'; return null; }

  const sortVideos = (list) => [...list].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filterVideos = (list) => {
    let result = list.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
    if (activeMediaType === 'image') return [];
    if (activeMediaType && activeMediaType !== 'video') return [];
    return result;
  };

  const displayVideos = sortVideos(filterVideos(videos));
  const displayFolders = currentFolder ? [] : folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const sortLabels = {
    name: 'Name', size: 'Size', date_uploaded: 'Date uploaded',
    date_created: 'Date created', date_modified: 'Date modified',
  };

  const subNavItems = [
    { key: 'all', label: 'All Files', icon: '▦' },
    { key: 'recent', label: 'Recently Added', icon: '↑' },
    { key: 'uploads', label: 'My Uploads', icon: '⬆' },
    { key: 'unused', label: 'Unused Items', icon: '◻' },
    { key: 'deleted', label: 'Recently Deleted', icon: '🗑' },
  ];

  const formatSize = (bytes) => bytes ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : '';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Icon Sidebar */}
      <div style={{
        width: '64px', background: '#f9fafb', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '16px', gap: '4px', borderRight: '1px solid #e5e7eb'
      }}>
        {[
          { key: 'home', label: 'Home', Icon: HomeIcon },
          { key: 'media', label: 'Media', Icon: MediaIcon },
          { key: 'shoppable', label: 'Shoppable', Icon: ShoppableIcon },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            width: '52px', padding: '10px 4px 8px',
            background: activeTab === key ? '#e8f8f7' : 'transparent',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
          }}>
            <Icon active={activeTab === key} />
            <span style={{ fontSize: '10px', color: activeTab === key ? '#0dbaab' : '#9ca3af', fontWeight: '500' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Sub Sidebar */}
      {activeTab === 'media' && (
        <div style={{
          width: '210px', background: '#fff', flexShrink: 0,
          display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb'
        }}>
          <div style={{ padding: '20px 16px 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Library
          </div>
          {subNavItems.map(item => (
            <button key={item.key} onClick={() => { setActiveSubNav(item.key); setCurrentFolder(null); }} style={{
              padding: '9px 14px', background: activeSubNav === item.key ? '#f0faf9' : 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
              color: activeSubNav === item.key ? '#0dbaab' : '#6b7280',
              fontSize: '13.5px', fontWeight: activeSubNav === item.key ? '600' : '400',
              textAlign: 'left', borderRadius: '6px', margin: '1px 8px', width: 'calc(100% - 16px)'
            }}>
              <span style={{ fontSize: '14px', opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '60px 40px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
              Get started with your shoppable videos
            </h1>
            <p style={{ color: '#6d7175', fontSize: '15px', marginBottom: '48px' }}>
              Upload videos, tag products, and embed on your Shopify store
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
              {[
                { title: '1. Upload Video', desc: 'Go to Media and upload your product video', icon: '⬆️', tab: 'media' },
                { title: '2. Tag Products', desc: 'Click on the video to tag Shopify products', icon: '🏷️', tab: 'media' },
                { title: '3. Embed Widget', desc: 'Add the widget code to your Shopify theme', icon: '🛒', tab: null },
              ].map((step, i) => (
                <div key={i} onClick={() => step.tab && setActiveTab(step.tab)} style={{
                  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '14px',
                  padding: '28px 20px', cursor: step.tab ? 'pointer' : 'default'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{step.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a', marginBottom: '8px' }}>{step.title}</div>
                  <div style={{ color: '#6d7175', fontSize: '13px', lineHeight: '1.5' }}>{step.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('media')} style={{
              marginTop: '48px', background: '#0dbaab', border: 'none', borderRadius: '8px',
              padding: '13px 32px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
            }}>Go to Media →</button>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Breadcrumb */}
                {currentFolder ? (
                  <>
                    <button onClick={() => { setCurrentFolder(null); setSearch(''); }} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '20px', fontWeight: '700', color: '#6b7280', padding: 0
                    }}>All Files</button>
                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>{currentFolder.name}</span>
                  </>
                ) : (
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>All Files</h2>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {!currentFolder && (
                  <button onClick={(e) => { e.stopPropagation(); setShowNewFolderModal(true); }} style={{
                    background: '#fff', border: '1px solid #d1d5db', borderRadius: '7px',
                    padding: '8px 16px', fontSize: '13px', color: '#374151', cursor: 'pointer',
                    fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>📁 New folder</button>
                )}
                <button onClick={() => fileInputRef.current.click()} disabled={uploading} style={{
                  background: uploading ? '#a3e4df' : '#0dbaab', border: 'none', borderRadius: '7px',
                  padding: '8px 18px', color: '#fff', fontSize: '13px',
                  fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  ⬆ {uploading ? `${uploadProgress}%` : 'Upload'}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" style={{ display: 'none' }} />
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div style={{ padding: '8px 24px 0', flexShrink: 0 }}>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#0dbaab', transition: 'width 0.3s' }} />
                </div>
                <div style={{ color: '#6d7175', fontSize: '12px', marginTop: '4px', paddingBottom: '8px' }}>
                  Uploading{currentFolder ? ` to "${currentFolder.name}"` : ''}... {uploadProgress}%
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                  style={{
                    width: '100%', padding: '9px 14px 9px 32px', fontSize: '14px',
                    border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none',
                    background: '#f9fafb', color: '#1a1a1a', boxSizing: 'border-box'
                  }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Product filter */}
                <div style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowProductFilter(v => !v); setShowMediaTypeFilter(false); setShowSortMenu(false); }}
                    style={{
                      padding: '5px 12px', background: activeProductFilter ? '#e8f4f3' : '#fff',
                      border: `1px solid ${activeProductFilter ? '#0dbaab' : '#d1d5db'}`,
                      borderRadius: '20px', fontSize: '12px', color: activeProductFilter ? '#0dbaab' : '#374151',
                      cursor: 'pointer', fontWeight: '500'
                    }}>Product {activeProductFilter ? '✓' : '▾'}</button>
                  {showProductFilter && (
                    <div onClick={e => e.stopPropagation()} style={{
                      position: 'absolute', top: '32px', left: 0, background: '#fff',
                      border: '1px solid #e5e7eb', borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '200px', overflow: 'hidden'
                    }}>
                      {['With tagged products', 'Without tagged products', 'With specific product'].map((opt, i) => (
                        <button key={opt} onClick={() => { setActiveProductFilter(activeProductFilter === opt ? null : opt); setShowProductFilter(false); }} style={{
                          width: '100%', padding: '10px 14px', background: activeProductFilter === opt ? '#f0faf9' : '#fff',
                          border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                          color: activeProductFilter === opt ? '#0dbaab' : '#374151',
                          fontWeight: activeProductFilter === opt ? '600' : '400',
                          borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none'
                        }}>{opt}</button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Media Type filter */}
                <div style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowMediaTypeFilter(v => !v); setShowProductFilter(false); setShowSortMenu(false); }}
                    style={{
                      padding: '5px 12px', background: activeMediaType ? '#e8f4f3' : '#fff',
                      border: `1px solid ${activeMediaType ? '#0dbaab' : '#d1d5db'}`,
                      borderRadius: '20px', fontSize: '12px', color: activeMediaType ? '#0dbaab' : '#374151',
                      cursor: 'pointer', fontWeight: '500'
                    }}>Media Type {activeMediaType ? '✓' : '▾'}</button>
                  {showMediaTypeFilter && (
                    <div onClick={e => e.stopPropagation()} style={{
                      position: 'absolute', top: '32px', left: 0, background: '#fff',
                      border: '1px solid #e5e7eb', borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '200px', overflow: 'hidden'
                    }}>
                      {[['image','Image'],['video','Video'],['instagram_video','Instagram video posts'],['instagram_image','Instagram image posts'],['instagram_stories','Instagram stories'],['tiktok','Tiktok videos']].map(([type, label], i) => (
                        <button key={type} onClick={() => { setActiveMediaType(activeMediaType === type ? null : type); setShowMediaTypeFilter(false); }} style={{
                          width: '100%', padding: '10px 14px', background: activeMediaType === type ? '#f0faf9' : '#fff',
                          border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                          color: activeMediaType === type ? '#0dbaab' : '#374151',
                          fontWeight: activeMediaType === type ? '600' : '400',
                          borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none'
                        }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Sort */}
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowSortMenu(v => !v); setShowProductFilter(false); setShowMediaTypeFilter(false); }}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#6d7175', fontSize: '13px', fontWeight: '500', padding: '5px 8px', borderRadius: '6px'
                    }}>{sortLabels[sortBy]} ↓</button>
                  {showSortMenu && (
                    <div onClick={e => e.stopPropagation()} style={{
                      position: 'absolute', top: '32px', right: 0, background: '#fff',
                      border: '1px solid #e5e7eb', borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '180px', overflow: 'hidden'
                    }}>
                      <div style={{ padding: '8px 14px 6px', fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px' }}>SORT BY</div>
                      {Object.entries(sortLabels).map(([key, label], i) => (
                        <button key={key} onClick={() => { setSortBy(key); setShowSortMenu(false); }} style={{
                          width: '100%', padding: '9px 14px', background: '#fff', border: 'none',
                          cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#1a1a1a',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: i < Object.keys(sortLabels).length - 1 ? '1px solid #f3f4f6' : 'none'
                        }}>
                          {label}
                          {sortBy === key && <span style={{ color: '#0dbaab', fontWeight: '700' }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {displayFolders.length === 0 && displayVideos.length === 0 && !uploading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>{currentFolder ? '📁' : '🎬'}</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                    {currentFolder ? `"${currentFolder.name}" is empty` : 'No videos yet'}
                  </div>
                  <div style={{ fontSize: '13px' }}>Upload your first video to get started</div>
                  <button onClick={() => fileInputRef.current.click()} style={{
                    marginTop: '20px', background: '#0dbaab', border: 'none', borderRadius: '8px',
                    padding: '11px 24px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                  }}>⬆ Upload Video</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>

                  {/* Folders (only at root) */}
                  {displayFolders.map(folder => (
                    <div key={folder._id} style={{ position: 'relative', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredFolder(folder._id)}
                      onMouseLeave={() => setHoveredFolder(null)}
                      onClick={() => handleFolderClick(folder)}
                    >
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '16px 8px 10px', borderRadius: '10px',
                        background: hoveredFolder === folder._id ? '#f9fafb' : 'transparent',
                        border: '1px solid transparent',
                        transition: 'background 0.15s', userSelect: 'none'
                      }}>
                        <FolderSVG size={72} />
                        <div style={{
                          marginTop: '8px', fontSize: '13px', fontWeight: '500', color: '#1a1a1a',
                          textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%'
                        }}>{folder.name}</div>
                      </div>
                      {/* 3-dot menu */}
                      {hoveredFolder === folder._id && (
                        <button onClick={(e) => { e.stopPropagation(); setFolderMenuOpen(folderMenuOpen === folder._id ? null : folder._id); }} style={{
                          position: 'absolute', bottom: '10px', right: '8px',
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: '#fff', border: '1px solid #e5e7eb',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', color: '#374151', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          fontWeight: '700', letterSpacing: '1px'
                        }}>···</button>
                      )}
                      {folderMenuOpen === folder._id && (
                        <div onClick={e => e.stopPropagation()} style={{
                          position: 'absolute', bottom: '36px', right: '8px',
                          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 200, minWidth: '140px', overflow: 'hidden'
                        }}>
                          <button onClick={() => openRename(folder)} style={{
                            width: '100%', padding: '10px 14px', background: '#fff', border: 'none',
                            cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#374151',
                            display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6'
                          }}>✏️ Rename</button>
                          <button onClick={() => deleteFolder(folder._id)} style={{
                            width: '100%', padding: '10px 14px', background: '#fff', border: 'none',
                            cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#d72c0d',
                            display: 'flex', alignItems: 'center', gap: '8px'
                          }}>🗑 Delete</button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Videos */}
                  {displayVideos.map(video => (
                    <div key={video._id} style={{ cursor: 'pointer', position: 'relative' }}
                      onMouseEnter={() => setHoveredVideo(video._id)}
                      onMouseLeave={() => setHoveredVideo(null)}
                    >
                      <div style={{
                        height: '120px', background: '#f3f4f6', borderRadius: '10px',
                        overflow: 'hidden', position: 'relative', border: '1px solid #e5e7eb',
                        boxShadow: hoveredVideo === video._id ? '0 4px 14px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                        transition: 'box-shadow 0.2s'
                      }}>
                        {video.thumbnailUrl
                          ? <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎬</div>
                        }
                        {video.status !== 'ready' && (
                          <div style={{
                            position: 'absolute', top: '6px', left: '6px',
                            background: 'rgba(0,0,0,0.65)', color: '#fbbf24',
                            borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '600'
                          }}>{video.status === 'processing' ? 'Processing...' : video.status}</div>
                        )}
                        {video.size && (
                          <div style={{
                            position: 'absolute', bottom: '6px', right: '6px',
                            background: 'rgba(0,0,0,0.55)', color: '#fff',
                            borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: '600'
                          }}>{formatSize(video.size)}</div>
                        )}
                        {hoveredVideo === video._id && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}>
                            <button onClick={() => navigate(`/gotivideos/editor/${video._id}?shop=${shop}`)} style={{
                              background: '#0dbaab', border: 'none', borderRadius: '6px',
                              padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                            }}>Tag</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video._id); }} style={{
                              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                              borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', cursor: 'pointer'
                            }}>✕</button>
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '7px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', gap: '8px' }}>
                          <span>👁 {video.views}</span>
                          <span>🛒 {video.conversions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SHOPPABLE TAB */}
        {activeTab === 'shoppable' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>Shoppable Videos</h2>
            <p style={{ color: '#6d7175', fontSize: '15px' }}>Coming soon — create and manage shoppable video widgets here.</p>
          </div>
        )}
      </div>

      {/* CREATE FOLDER MODAL */}
      {showNewFolderModal && (
        <div onClick={() => { setShowNewFolderModal(false); setNewFolderName(''); }} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '12px', padding: '28px', width: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px' }}>Create new folder</div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Folder name</label>
            <input ref={folderNameRef} value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setShowNewFolderModal(false); setNewFolderName(''); } }}
              placeholder="Enter folder name"
              style={{
                width: '100%', padding: '10px 12px', fontSize: '14px',
                border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none',
                boxSizing: 'border-box', color: '#1a1a1a', marginBottom: '20px'
              }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewFolderModal(false); setNewFolderName(''); }} style={{
                padding: '9px 20px', background: '#fff', border: '1px solid #d1d5db',
                borderRadius: '7px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: '500'
              }}>Cancel</button>
              <button onClick={createFolder} disabled={!newFolderName.trim()} style={{
                padding: '9px 20px', background: newFolderName.trim() ? '#1a1a1a' : '#d1d5db',
                border: 'none', borderRadius: '7px', fontSize: '13px', color: '#fff',
                cursor: newFolderName.trim() ? 'pointer' : 'not-allowed', fontWeight: '600'
              }}>Create folder</button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {showRenameModal && renameTarget && (
        <div onClick={() => setShowRenameModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '12px', padding: '28px', width: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px' }}>Rename folder</div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Folder name</label>
            <input ref={renameRef} value={renameName} onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setShowRenameModal(false); }}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '14px',
                border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none',
                boxSizing: 'border-box', color: '#1a1a1a', marginBottom: '20px'
              }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRenameModal(false)} style={{
                padding: '9px 20px', background: '#fff', border: '1px solid #d1d5db',
                borderRadius: '7px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: '500'
              }}>Cancel</button>
              <button onClick={confirmRename} disabled={!renameName.trim()} style={{
                padding: '9px 20px', background: renameName.trim() ? '#1a1a1a' : '#d1d5db',
                border: 'none', borderRadius: '7px', fontSize: '13px', color: '#fff',
                cursor: renameName.trim() ? 'pointer' : 'not-allowed', fontWeight: '600'
              }}>Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
