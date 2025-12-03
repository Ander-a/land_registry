import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHome, 
  FaUsers,
  FaMapMarkedAlt,
  FaTrophy,
  FaBell,
  FaSignOutAlt,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaImage,
  FaPaperPlane,
  FaEllipsisV
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import './CommunityFeed.css'

export default function CommunityFeed() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [showPostCreator, setShowPostCreator] = useState(false)

  useEffect(() => {
    fetchCommunityPosts()
  }, [])

  const fetchCommunityPosts = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await communityService.getPosts()
      
      // Mock data for now
      const mockPosts = [
        {
          id: '1',
          author: {
            id: 'user1',
            name: 'Jane Mukami',
            avatar: null,
            trust_score: 92
          },
          content: 'Just witnessed the land claim at Plot 245, Section B being validated. The community review process is working great! 🎉',
          images: [],
          likes: 24,
          comments: 8,
          verifications: 3,
          liked_by_user: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          location: 'Kiambu County',
          type: 'verification'
        },
        {
          id: '2',
          author: {
            id: 'user2',
            name: 'David Omondi',
            avatar: null,
            trust_score: 85
          },
          content: 'Reminder: Community meeting this Saturday at 10 AM to discuss the new land registry procedures. All validators welcome!',
          images: [],
          likes: 18,
          comments: 5,
          verifications: 0,
          liked_by_user: true,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          location: 'Nairobi',
          type: 'announcement'
        },
        {
          id: '3',
          author: {
            id: 'user3',
            name: 'Mary Wanjiku',
            avatar: null,
            trust_score: 78
          },
          content: 'Successfully verified my first land claim today! The validation process was smooth and transparent. Big thanks to the validators in my area.',
          images: [],
          likes: 32,
          comments: 12,
          verifications: 5,
          liked_by_user: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          location: 'Nakuru',
          type: 'milestone'
        }
      ]
      
      setPosts(mockPosts)
    } catch (err) {
      console.error('Failed to fetch community posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLikePost = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked_by_user: !post.liked_by_user,
            likes: post.liked_by_user ? post.likes - 1 : post.likes + 1
          }
        }
        return post
      })
    )
    // TODO: Call API to like/unlike post
  }

  const handleCreatePost = async () => {
    if (!newPost.trim()) return

    const newPostData = {
      id: Date.now().toString(),
      author: {
        id: authState.user.id,
        name: authState.user.name,
        avatar: null,
        trust_score: 75
      },
      content: newPost,
      images: [],
      likes: 0,
      comments: 0,
      verifications: 0,
      liked_by_user: false,
      created_at: new Date().toISOString(),
      location: 'Your Area',
      type: 'general'
    }

    setPosts([newPostData, ...posts])
    setNewPost('')
    setShowPostCreator(false)
    // TODO: Call API to create post
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffMs = now - postTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return postTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'verification':
        return <FaCheckCircle className="type-icon verification" />
      case 'announcement':
        return <FaBell className="type-icon announcement" />
      case 'milestone':
        return <FaTrophy className="type-icon milestone" />
      default:
        return null
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="community-feed-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaUsers className="logo-icon" />
          </div>
          <h2 className="sidebar-title">Land Registry</h2>
          <p className="sidebar-subtitle">Community Portal</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/community/feed" className="nav-item active">
            <FaUsers className="nav-icon" />
            <span>Community Feed</span>
          </Link>
          <Link to="/community/claims" className="nav-item">
            <FaMapMarkedAlt className="nav-icon" />
            <span>Claims Near You</span>
          </Link>
          <Link to="/community/score" className="nav-item">
            <FaTrophy className="nav-icon" />
            <span>Validator Score</span>
          </Link>
          <Link to="/notifications" className="nav-item">
            <FaBell className="nav-icon" />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="page-title">Community Feed</h1>
            <button 
              onClick={() => setShowPostCreator(!showPostCreator)}
              className="create-post-btn"
            >
              <FaImage /> Share Update
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="feed-content">
          {/* Post Creator */}
          {showPostCreator && (
            <div className="post-creator">
              <div className="creator-header">
                <div className="user-avatar">
                  {authState?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h4>{authState?.user?.name}</h4>
                  <p>Share something with your community</p>
                </div>
              </div>
              <textarea
                className="post-input"
                placeholder="What's happening in your neighborhood?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={4}
              />
              <div className="creator-actions">
                <button className="icon-btn">
                  <FaImage /> Photo
                </button>
                <button className="icon-btn">
                  <FaMapMarkerAlt /> Location
                </button>
                <div className="spacer"></div>
                <button 
                  onClick={() => {
                    setShowPostCreator(false)
                    setNewPost('')
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                  className="submit-btn"
                >
                  <FaPaperPlane /> Post
                </button>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          <div className="posts-feed">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading community posts...</p>
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <div className="author-avatar">
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="author-info">
                        <h4 className="author-name">{post.author.name}</h4>
                        <div className="post-meta">
                          <span className="trust-score">
                            <FaCheckCircle /> {post.author.trust_score}% Trust
                          </span>
                          <span className="separator">•</span>
                          <span className="post-time">{formatTimestamp(post.created_at)}</span>
                          {post.location && (
                            <>
                              <span className="separator">•</span>
                              <span className="post-location">
                                <FaMapMarkerAlt /> {post.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="post-type">
                      {getPostTypeIcon(post.type)}
                    </div>
                    <button className="post-menu-btn">
                      <FaEllipsisV />
                    </button>
                  </div>

                  <div className="post-content">
                    <p>{post.content}</p>
                  </div>

                  {post.images && post.images.length > 0 && (
                    <div className="post-images">
                      {post.images.map((img, idx) => (
                        <img key={idx} src={img} alt="Post" />
                      ))}
                    </div>
                  )}

                  <div className="post-stats">
                    <span className="stat-item">
                      {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                    </span>
                    {post.verifications > 0 && (
                      <>
                        <span className="separator">•</span>
                        <span className="stat-item">
                          {post.verifications} {post.verifications === 1 ? 'verification' : 'verifications'}
                        </span>
                      </>
                    )}
                    <span className="separator">•</span>
                    <span className="stat-item">
                      {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>

                  <div className="post-actions">
                    <button 
                      className={`action-btn ${post.liked_by_user ? 'active' : ''}`}
                      onClick={() => handleLikePost(post.id)}
                    >
                      {post.liked_by_user ? <FaHeart /> : <FaRegHeart />}
                      <span>Like</span>
                    </button>
                    <button className="action-btn">
                      <FaComment />
                      <span>Comment</span>
                    </button>
                    <button className="action-btn">
                      <FaCheckCircle />
                      <span>Verify</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FaUsers className="empty-icon" />
                <h3>No posts yet</h3>
                <p>Be the first to share something with your community!</p>
                <button 
                  onClick={() => setShowPostCreator(true)}
                  className="empty-action-btn"
                >
                  Create Post
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
