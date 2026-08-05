document.addEventListener('DOMContentLoaded', async () => {
  const urlDisplay = document.getElementById('website-url');
  const auditBtn = document.getElementById('audit-btn');
  const loader = document.getElementById('loader');
  const resultCard = document.getElementById('resultCard');
  const scoreValue = document.getElementById('scoreValue');
  const findingsDiv = document.getElementById('findings');
  const viewFull = document.getElementById('viewFull');

  let activeUrl = '';

  // Get current tab URL
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      activeUrl = tabs[0].url;
      // Strip out http/https for display
      urlDisplay.textContent = activeUrl.replace(/^https?:\/\//, '');
      viewFull.href = `http://localhost:5173/onboarding?url=${encodeURIComponent(activeUrl)}`;
    } else {
      urlDisplay.textContent = 'Could not read tab URL';
      auditBtn.disabled = true;
    }
  } catch (e) {
    urlDisplay.textContent = 'Chrome extensions API not available locally.';
    activeUrl = 'https://example.com'; 
  }

  auditBtn.addEventListener('click', async () => {
    if (!activeUrl) return;

    auditBtn.style.display = 'none';
    loader.style.display = 'block';
    resultCard.style.display = 'none';

    try {
      // Pointing to local backend for dev, this would be https://api.zieads.com in production
      const response = await fetch('http://localhost:3000/api/quick-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: activeUrl })
      });

      const data = await response.json();
      
      if (response.ok && data) {
        scoreValue.textContent = data.score;
        let color = '#dc2626';
        if (data.score >= 70) color = '#00c9a7';
        else if (data.score >= 50) color = '#f59e0b';
        
        scoreValue.style.color = color;
        scoreValue.style.borderColor = color;

        findingsDiv.innerHTML = '';
        if (data.findings && data.findings.length > 0) {
          data.findings.slice(0, 2).forEach(f => {
            const row = document.createElement('div');
            row.style.marginBottom = '8px';
            row.innerHTML = `<span style="color: #dc2626; font-weight: bold; margin-right: 4px;">•</span> ${f.title}`;
            findingsDiv.appendChild(row);
          });
        }
        
        resultCard.style.display = 'block';
      } else {
        urlDisplay.textContent = data.error || 'Audit failed.';
        auditBtn.style.display = 'block';
      }
    } catch (err) {
      urlDisplay.textContent = 'Network error. Ensure ZieAds is running.';
      auditBtn.style.display = 'block';
    } finally {
      loader.style.display = 'none';
    }
  });
});
