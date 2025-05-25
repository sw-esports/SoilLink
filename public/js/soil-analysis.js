/**
 * Soil Analysis Audio Recording and Processing Simulation
 */
document.addEventListener('DOMContentLoaded', () => {
  const submitSampleBtn = document.getElementById('submit-sample-btn');
  const audioRecordingModal = document.getElementById('audio-recording-modal');
  const audioWaveContainer = document.getElementById('audio-wave');
  const processingModal = document.getElementById('processing-modal');
  const resultModal = document.getElementById('result-modal');
  const sampleForm = document.getElementById('sample-form');
  const sampleNameInput = document.getElementById('sample-name');
  const locationInput = document.getElementById('location');
  const notesInput = document.getElementById('notes');
  const modalOverlay = document.getElementById('modal-overlay');
  const cancelBtn = document.getElementById('cancel-recording');
  const viewSampleBtn = document.getElementById('view-sample-btn');
  const processingProgress = document.getElementById('processing-progress');
  const processingStep = document.getElementById('processing-step');
  
  let soilResultId = null;
  let audioWave = null;
  
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
        path.setAttribute('d', d);
      }
      
      frame++;
    }, 30);
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
    // Submit soil sample data
  const submitSoilSample = async (formData) => {
    try {
      // Get user ID from the container instead of body
      const container = document.getElementById('soil-analysis-container');
      const userId = container ? container.dataset.userId : null;
      
      if (!userId) {
        console.error('User ID not found');
        alert('Error: Could not determine user ID. Please refresh the page and try again.');
        return null;
      }
      
      console.log('Submitting soil sample for user:', userId);
      
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
        return data.soilId;
      } else {
        throw new Error(data.message || 'Failed to submit sample');
      }
    } catch (error) {
      console.error('Error submitting soil sample:', error);
      return null;
    }
  };
  
  // Handle form submission
  if (submitSampleBtn) {
    submitSampleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Validate form inputs
      if (!sampleNameInput.value.trim()) {
        alert('Please enter a sample name');
        return;
      }
      
      // Show audio recording modal
      showModal(audioRecordingModal);
      
      // Initialize and start audio wave animation
      const wave = initAudioWave();
      const waveAnimation = animateWaves(wave);
      
      // Simulate recording for 5 seconds
      setTimeout(async () => {
        // Stop recording animation
        clearInterval(waveAnimation);
        
        // Hide recording modal and show processing modal
        hideModal(audioRecordingModal);
        showModal(processingModal);
        
        // Reset progress
        processingProgress.style.width = '0%';
        
        // Simulate processing
        await simulateProcessing();
        
        // Submit the form data
        const formData = {
          sampleName: sampleNameInput.value,
          location: locationInput.value,
          notes: notesInput.value
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
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideModal(audioRecordingModal);
    });
  }
    // View sample details
  if (viewSampleBtn) {
    viewSampleBtn.addEventListener('click', () => {
      if (soilResultId) {
        // Get userId from the container
        const container = document.getElementById('soil-analysis-container');
        const userId = container ? container.dataset.userId : null;
        
        if (!userId) {
          console.error('User ID not found');
          alert('Error: Could not determine user ID. Please refresh the page and try again.');
          hideModal(resultModal);
          return;
        }
        
        // Add timestamp for cache busting
        const timestamp = new Date().getTime();
        window.location.href = `/dashboard/${userId}/soil/${soilResultId}?_=${timestamp}`;
      } else {
        hideModal(resultModal);
        
        // Refresh the page to show the latest data
        setTimeout(() => {
          window.location.reload(true);
        }, 500);
      }
    });
  }
  
  // Close all modals on overlay click
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        hideModal(audioRecordingModal);
        hideModal(processingModal);
        hideModal(resultModal);
      }
    });
  }
});
