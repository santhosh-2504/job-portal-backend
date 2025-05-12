// Configuration
const config = {
    // Set this to your Render backend URL when deployed
    apiUrl: 'https://job-portal-backend-6489.onrender.com/api/jobs/process',
    // For local development
    localApiUrl: 'http://localhost:5000/api/jobs/process'
};

// DOM Elements
const processBtn = document.getElementById('processBtn');
const jobDetailsTextarea = document.getElementById('jobDetails');
const statusContainer = document.getElementById('statusContainer');
const resultContainer = document.getElementById('resultContainer');

// Determine which API URL to use based on the environment
function getApiUrl() {
    // If running locally (localhost or file://), use the local API URL for testing
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.protocol === 'file:') {
        return config.localApiUrl;
    }
    // Otherwise use the production API URL
    return config.apiUrl;
}

// Process job details
async function processJobDetails() {
    const jobDetails = jobDetailsTextarea.value.trim();
    
    if (!jobDetails) {
        showStatus('Please enter job details', 'error');
        return;
    }
    
    // Show loading status
    showStatus('Processing job details with AI...', 'loading');
    processBtn.disabled = true;
    
    try {
        const response = await fetch(getApiUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobDetails })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('Job processed and saved successfully!', 'success');
            resultContainer.textContent = JSON.stringify(data.job, null, 2);
            resultContainer.style.display = 'block';
        } else {
            showStatus(`Error: ${data.message}`, 'error');
            if (data.error) {
                resultContainer.textContent = JSON.stringify(data, null, 2);
                resultContainer.style.display = 'block';
            }
        }
    } catch (error) {
        showStatus(`Network error: ${error.message}. Make sure the backend server is running.`, 'error');
    } finally {
        processBtn.disabled = false;
    }
}

// Display status message
function showStatus(message, type) {
    statusContainer.textContent = message;
    statusContainer.className = `status ${type}`;
    statusContainer.style.display = 'block';
}

// Event listeners
processBtn.addEventListener('click', processJobDetails);

// Add keyboard shortcut (Ctrl/Cmd + Enter) to process job
jobDetailsTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        processJobDetails();
    }
});