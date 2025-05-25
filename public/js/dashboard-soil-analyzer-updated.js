/**
 * Dashboard Soil Analyzer JavaScript
 * Handles soil sample recording, processing, and dashboard updates
 */
document.addEventListener('DOMContentLoaded', function() {
  // Element references
  const quickAnalyzeBtn = document.getElementById('quick-analyze-btn');
  const submitFirstSampleBtn = document.getElementById('submit-first-sample');
  const quickAnalysisModal = document.getElementById('quick-analysis-modal');
  const cancelQuickAnalysisBtn = document.getElementById('cancel-quick-analysis');
  const quickSampleForm = document.getElementById('quick-sample-form');
  const quickSampleNameInput = document.getElementById('quick-sample-name');
  const quickLocationInput = document.getElementById('quick-location');
  const quickNotesInput = document.getElementById('quick-notes');
  const audioWaveContainer = document.getElementById('audio-wave');
  const audioRecordingModal = document.getElementById('audio-recording-modal');
  const processingModal = document.getElementById('processing-modal');
  const resultModal = document.getElementById('result-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const cancelRecordingBtn = document.getElementById('cancel-recording');
  const viewSampleBtn = document.getElementById('view-sample-btn');
  const processingProgress = document.getElementById('processing-progress');
  const processingStep = document.getElementById('processing-step');
  const timer = document.getElementById('timer');
  
  // Dashboard stats elements
  const waterLevelStat = document.querySelector('.stat-card:nth-child(1) .stat-info h3');
  const phLevelStat = document.querySelector('.stat-card:nth-child(2) .stat-info h3');
  const soilHealthStat = document.querySelector('.stat-card:nth-child(3) .stat-info h3');
  const totalSamplesStat = document.querySelector('.stat-card:nth-child(4) .stat-info h3');
  
  // Recent samples table
  const recentSamplesContainer = document.querySelector('.dashboard-section:first-of-type');
  
  // Chart instances
  let phChart = null;
  let nutrientChart = null;
  
  let soilResultId = null;
  let audioWave = null;
  let timerInterval = null;

  // Initialize charts if data exists
  if (typeof soilData !== 'undefined' && soilData.length > 0) {
    initCharts();
  }
  
  // Initialize audio wave visualization
  const initAudioWave = () => {
    // Create audio wave visualization
    const waves = 3;
    const width = audioWaveContainer.offsetWidth;
    const height = audioWaveContainer.offsetHeight;
    
    // Create SVG
    audioWaveContainer.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    audioWaveContainer.appendChild(svg);
    
    // Create paths for waves
    const colors = ['rgba(45, 164, 78, 0.8)', 'rgba(45, 164, 78, 0.6)', 'rgba(45, 164, 78, 0.4)'];
    
    for (let i = 0; i < waves; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', colors[i]);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('id', `wave-${i}`);
      svg.appendChild(path);
    }
    
    return {
      svg,
      width,
      height
    };
  };
  
  // Generate wave path
  const animateWaves = (wave) => {
    const { width, height } = wave;
    const centerY = height / 2;
    
    let frame = 0;
    
    return setInterval(() => {
      for (let i = 0; i < 3; i++) {
        const amplitude = (i + 1) * 15 * (Math.sin(frame / 50) * 0.5 + 0.5);
        const frequency = 0.01 - (i * 0.002);
        const phaseShift = i * 0.5 + (frame / 50);
        
        let d = `M 0 ${centerY}`;
        
        for (let x = 0; x < width; x += 5) {
          const y = centerY + amplitude * Math.sin(x * frequency + phaseShift);
          d += ` L ${x} ${y}`;
        }
        
        const path = document.getElementById(`wave-${i}`);
        if (path) {
          path.setAttribute('d', d);
        }
      }
      
      frame++;
    }, 30);
  };
  
  // Start timer countdown
  const startTimer = () => {
    let seconds = 5;
    timer.textContent = seconds;
    
    return setInterval(() => {
      seconds--;
      timer.textContent = seconds;
      
      if (seconds <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
  };
  
  // Show modal
  const showModal = (modal) => {
    if (modal) {
      modal.classList.remove('hidden');
      modalOverlay.classList.remove('hidden');
    }
  };
  
  // Hide modal
  const hideModal = (modal) => {
    if (modal) {
      modal.classList.add('hidden');
      modalOverlay.classList.add('hidden');
    }
  };
  
  // Simulate the processing steps
  const simulateProcessing = () => {
    const steps = [
      'Analyzing audio frequencies...',
      'Identifying soil composition...',
      'Measuring pH levels...',
      'Calculating nutrient content...',
      'Determining water retention...',
      'Evaluating soil health...',
      'Generating recommendations...',
      'Finalizing results...'
    ];
    
    let currentStep = 0;
    const totalSteps = steps.length;
    
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (currentStep < totalSteps) {
          processingStep.textContent = steps[currentStep];
          processingProgress.style.width = `${Math.round((currentStep + 1) / totalSteps * 100)}%`;
          currentStep++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 800);
    });
  };
  
  // Initialize charts
  function initCharts() {
    // Clean up existing charts first
    if (phChart) phChart.destroy();
    if (nutrientChart) nutrientChart.destroy();
    
    // pH Trend Chart
    if (document.getElementById('phTrendChart')) {
      const phCtx = document.getElementById('phTrendChart').getContext('2d');
      phChart = new Chart(phCtx, {
        type: 'line',
        data: {
          labels: soilData.map(s => s.date),
          datasets: [{
            label: 'pH Level',
            data: soilData.map(s => s.ph),
            borderColor: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              min: 0,
              max: 14,
              title: {
                display: true,
                text: 'pH Level'
              }
            }
          }
        }
      });
    }
    
    // Nutrient Bar Chart
    if (document.getElementById('nutrientBarChart')) {
      const nutrientCtx = document.getElementById('nutrientBarChart').getContext('2d');
      nutrientChart = new Chart(nutrientCtx, {
        type: 'bar',
        data: {
          labels: ['Nitrogen', 'Phosphorus', 'Potassium'],
          datasets: [{
            label: 'Latest Sample',
            data: [
              soilData[0].nitrogen,
              soilData[0].phosphorus,
              soilData[0].potassium
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: [
              'rgba(34, 197, 94, 1)',
              'rgba(249, 115, 22, 1)',
              'rgba(168, 85, 247, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Level (%)'
              }
            }
          }
        }
      });
    }
  }
  
  // Update dashboard stats with new soil data
  const updateDashboardStats = (newSoil) => {
    // Simple update - just trigger a page reload
    
    // For immediate visual feedback before reload, update the count
    if (totalSamplesStat) {
      let currentSamples = parseInt(totalSamplesStat.textContent) || 0;
      currentSamples += 1;
      totalSamplesStat.textContent = currentSamples;
    }
    
    // Force a page reload after a short delay
    setTimeout(() => {
      window.location.reload(true);
    }, 1500);
  };
  
  // Submit soil sample data
  const submitSoilSample = async (formData) => {
    try {
      const userId = document.querySelector('.dashboard-content').dataset.userId;
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      const response = await fetch(`/dashboard/${userId}/soil-analysis?_=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create a new soil object with random values
        const newSoil = {
          id: data.soilId,
          name: formData.sampleName,
          phLevel: (Math.random() * (8.5 - 5.5) + 5.5),
          waterLevel: (Math.random() * 100),
          soilHealth: (Math.random() * 100),
          nitrogenLevel: (Math.random() * 100),
          phosphorusLevel: (Math.random() * 100),
          potassiumLevel: (Math.random() * 100)
        };
        
        // Update dashboard stats
        updateDashboardStats(newSoil);
        
        return data.soilId;
      } else {
        throw new Error(data.message || 'Failed to submit sample');
      }
    } catch (error) {
      console.error('Error submitting soil sample:', error);
      return null;
    }
  };
  
  // Handle quick analyze button click
  if (quickAnalyzeBtn) {
    quickAnalyzeBtn.addEventListener('click', () => {
      showModal(quickAnalysisModal);
    });
  }
  
  // Handle submit first sample button click
  if (submitFirstSampleBtn) {
    submitFirstSampleBtn.addEventListener('click', () => {
      showModal(quickAnalysisModal);
    });
  }
  
  // Handle cancel quick analysis
  if (cancelQuickAnalysisBtn) {
    cancelQuickAnalysisBtn.addEventListener('click', () => {
      hideModal(quickAnalysisModal);
    });
  }
  
  // Handle quick sample form submission
  if (quickSampleForm) {
    quickSampleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate form inputs
      if (!quickSampleNameInput.value.trim()) {
        alert('Please enter a sample name');
        return;
      }
      
      // Hide quick analysis modal and show audio recording modal
      hideModal(quickAnalysisModal);
      showModal(audioRecordingModal);
      
      // Initialize and start audio wave animation
      const wave = initAudioWave();
      const waveAnimation = animateWaves(wave);
      
      // Start timer countdown
      timerInterval = startTimer();
      
      // Simulate recording for 5 seconds
      setTimeout(async () => {
        // Stop recording animation
        clearInterval(waveAnimation);
        clearInterval(timerInterval);
        
        // Hide recording modal and show processing modal
        hideModal(audioRecordingModal);
        showModal(processingModal);
        
        // Reset progress
        processingProgress.style.width = '0%';
        
        // Simulate processing
        await simulateProcessing();
        
        // Submit the form data
        const formData = {
          sampleName: quickSampleNameInput.value,
          location: quickLocationInput.value,
          notes: quickNotesInput.value
        };
        
        // Submit the sample
        soilResultId = await submitSoilSample(formData);
        
        // Hide processing modal and show result
        hideModal(processingModal);
        showModal(resultModal);
        
      }, 5000); // 5 seconds of recording
    });
  }
  
  // Cancel recording
  if (cancelRecordingBtn) {
    cancelRecordingBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      hideModal(audioRecordingModal);
    });
  }
  
  // View sample details
  if (viewSampleBtn) {
    viewSampleBtn.addEventListener('click', () => {
      if (soilResultId) {
        const userId = document.querySelector('.dashboard-content').dataset.userId;
        
        // Option to view details or stay on dashboard
        const viewDashboard = confirm('Sample analyzed successfully! Would you like to stay on the dashboard?\n\nClick OK to stay on dashboard or Cancel to view detailed sample report.');
        
        if (viewDashboard) {
          hideModal(resultModal);
          // Page will be reloaded by the updateDashboardStats function
        } else {
          // Use cache busting on redirect
          const timestamp = new Date().getTime();
          window.location.href = `/dashboard/${userId}/soil/${soilResultId}?_=${timestamp}`;
        }
      } else {
        hideModal(resultModal);
      }
    });
  }
  
  // Close all modals on overlay click
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        clearInterval(timerInterval);
        hideModal(quickAnalysisModal);
        hideModal(audioRecordingModal);
        hideModal(processingModal);
        hideModal(resultModal);
      }
    });
  }
});
