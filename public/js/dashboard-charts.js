// Dashboard chart rendering using Chart.js
// Make sure Chart.js is loaded in your layout or dashboard page

document.addEventListener('DOMContentLoaded', function () {
  // Example: Soil pH trend chart
  const ctxPh = document.getElementById('phTrendChart');
  if (ctxPh) {
    new Chart(ctxPh, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Soil pH',
          data: [6.2, 6.5, 6.7, 6.4, 6.8, 7.0],
          borderColor: '#43a047',
          backgroundColor: 'rgba(67,160,71,0.1)',
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#43a047',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: false, min: 5.5, max: 7.5 }
        }
      }
    });
  }

  // Example: Nutrient index bar chart
  const ctxNutrient = document.getElementById('nutrientBarChart');
  if (ctxNutrient) {
    new Chart(ctxNutrient, {
      type: 'bar',
      data: {
        labels: ['N', 'P', 'K', 'Ca', 'Mg'],
        datasets: [{
          label: 'Nutrient Index',
          data: [80, 65, 90, 70, 60],
          backgroundColor: [
            '#43a047', '#66bb6a', '#ffd54f', '#8d6e63', '#a5d6a7'
          ],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }
});
