import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

const API_BASE_URL = '/api';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState('');
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);

  const validateUrl = (url: string) => {
    // Simple validation for GitHub repo URL
    const regex = /^https?:\/\/github\.com\/[\w-]+\/[\w-]+(\.git)?$/;
    return regex.test(url);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate the repo URL
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }
    
    if (!validateUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }
    
    try {
      setIsDeploying(true);
      setDeploymentStatus('uploading');
      
      // Start deployment process
      const deployResponse = await axios.post(`${API_BASE_URL}/deploy`, {
        repoUrl: repoUrl.endsWith('.git') ? repoUrl : `${repoUrl}.git`,
      });
      
      const { deploymentId } = deployResponse.data;
      
      // Poll for deployment status
      setDeploymentStatus('building');
      const statusInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(
            `${API_BASE_URL}/deployment/${deploymentId}/status`
          );
          
          const { status, url, error } = statusResponse.data;
          
          if (status === 'completed') {
            clearInterval(statusInterval);
            setDeploymentStatus('deployed');
            setDeploymentInfo({
              id: deploymentId,
              url,
              status: 'deployed',
              repository: repoUrl,
              branch: 'main',
              deployedAt: new Date().toISOString(),
            });
            setIsDeploying(false);
          } else if (status === 'failed') {
            clearInterval(statusInterval);
            setDeploymentStatus('deployment-failed');
            setError(error || 'Deployment failed');
            setIsDeploying(false);
          }
        } catch (error) {
          clearInterval(statusInterval);
          setDeploymentStatus('deployment-failed');
          setError('Failed to check deployment status');
          setIsDeploying(false);
        }
      }, 3000);
    } catch (error: any) {
      setIsDeploying(false);
      setDeploymentStatus('deployment-failed');
      setError(error.response?.data?.error || 'Failed to start deployment');
    }
  };

  const handleReset = () => {
    setRepoUrl('');
    setDeploymentInfo(null);
    setDeploymentStatus(null);
    setError('');
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">▲</div>
            <div className="logo-text">Vercel Clone</div>
          </div>
          <div className="nav-links">
            <a href="#" className="active">Deploy</a>
            <a href="#">Documentation</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </nav>

      <main>
        <div className="content-wrapper">
          <div className="hero">
            <h1>Deploy to the Edge</h1>
            <p className="subtitle">
              Experience continuous deployment from git repositories to our global edge network.
            </p>
          </div>

          {!deploymentInfo && !isDeploying && (
            <div className="card">
              <form className="deploy-form" onSubmit={handleDeploy}>
                <div className="form-group">
                  <label htmlFor="repoUrl">GitHub Repository</label>
                  <input
                    id="repoUrl"
                    type="text"
                    className="form-input"
                    placeholder="https://github.com/username/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={isDeploying}
                  />
                  {error && <div className="error-message">{error}</div>}
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <div className="spinner"></div>
                      Deploying...
                    </>
                  ) : (
                    'Deploy'
                  )}
                </button>
              </form>
            </div>
          )}

          {isDeploying && deploymentStatus && (
            <div className="card">
              <div className="progress-box">
                <h3>
                  {deploymentStatus === 'uploading'
                    ? 'Uploading Repository'
                    : 'Building Project'}
                </h3>
                <p className="subtitle">
                  {deploymentStatus === 'uploading'
                    ? 'Fetching your code from GitHub...'
                    : 'Building and optimizing your project...'}
                </p>
                <div className="loading-bar">
                  <div className="loading-bar-progress"></div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <span className={`status-badge status-${deploymentStatus}`}>
                    {deploymentStatus === 'uploading' ? 'UPLOADING' : 'BUILDING'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {deploymentInfo && (
            <div className="card">
              <div className="success-box">
                <div className="success-icon">✓</div>
                <h3>Successfully deployed!</h3>
                <p>Your project is now live on our edge network.</p>
                <div className="deployment-link">
                  {deploymentInfo.url}
                </div>
                <a 
                  href={deploymentInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Visit Site
                </a>
              </div>

              <div className="deployment-info">
                <h2>Deployment Details</h2>
                <div className="info-row">
                  <div className="info-label">Status</div>
                  <div>
                    <span className="status-badge status-deployed">
                      DEPLOYED
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">Repository</div>
                  <div className="info-value">{deploymentInfo.repository}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Branch</div>
                  <div className="info-value">{deploymentInfo.branch}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Deployment ID</div>
                  <div className="info-value">{deploymentInfo.id}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Deployed At</div>
                  <div className="info-value">
                    {new Date(deploymentInfo.deployedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <button onClick={handleReset} className="btn-outline">
                Deploy New Project
              </button>
            </div>
          )}

          {deploymentStatus === 'deployment-failed' && !isDeploying && (
            <div className="card">
              <div className="error-box">
                <div className="error-icon">!</div>
                <h3>Deployment Failed</h3>
                <p>{error || 'An unexpected error occurred during deployment.'}</p>
              </div>
              <button onClick={handleReset} className="btn-outline">
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Vercel Clone. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
