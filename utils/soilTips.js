/**
 * Tips utility for soil analysis
 * Provides random tips based on soil health and parameters
 */

const soilTips = [
  "Increase organic matter in your soil by adding compost or well-rotted manure.",
  "Use mulch to help retain moisture and suppress weeds in your garden.",
  "Test your soil pH regularly to ensure it's appropriate for your plants.",
  "Practice crop rotation to prevent soil nutrient depletion.",
  "Consider using cover crops to improve soil structure and prevent erosion.",
  "Avoid working wet soil as it can damage soil structure.",
  "Add lime to raise pH if your soil is too acidic.",
  "Use sulfur to lower pH if your soil is too alkaline.",
  "Ensure proper drainage to prevent waterlogged soil and root rot.",
  "Reduce tilling to preserve soil structure and beneficial organisms.",
  "Introduce beneficial microbes with compost tea or commercial products.",
  "Implement no-till or minimum-till practices to preserve soil ecology.",
  "Balance nitrogen application to avoid excessive vegetative growth.",
  "Use slow-release fertilizers to provide nutrients over time.",
  "Consider installing a drip irrigation system to optimize water usage.",
  "Plant legumes to fix nitrogen naturally in your soil.",
  "Use organic pest control methods to protect soil health and beneficial insects.",
  "Collect rainwater for irrigation to reduce chemical content in water.",
  "Add earthworms to your soil to improve aeration and decomposition.",
  "Test for soil compaction and aerate if necessary.",
  "Apply potassium-rich amendments for stronger plant cell walls and disease resistance.",
  "Balance calcium and magnesium levels for optimal plant growth.",
  "Use rock dust or kelp meal to add trace minerals to your soil.",
  "Implement erosion control methods on sloped areas of your garden.",
  "Allow leaf litter to decompose naturally where appropriate.",
  "Consider biochar as a long-term soil amendment to increase carbon sequestration.",
  "Maintain a healthy soil food web by avoiding chemicals that harm beneficial organisms.",
  "Use compost tea as a natural fertilizer and disease suppressor.",
  "Plant deep-rooted cover crops to break up compacted subsoil.",
  "Practice polyculture to improve soil biodiversity and resilience."
];

/**
 * Get a random soil tip
 * @returns {string} Random soil tip
 */
const getRandomTip = () => {
  const randomIndex = Math.floor(Math.random() * soilTips.length);
  return soilTips[randomIndex];
};

/**
 * Get multiple unique random tips
 * @param {number} count Number of tips to return
 * @returns {Array} Array of unique tips
 */
const getMultipleTips = (count = 3) => {
  const selectedTips = [];
  const availableTips = [...soilTips];
  
  // Get up to count tips or all available tips if count > available
  const tipCount = Math.min(count, availableTips.length);
  
  for (let i = 0; i < tipCount; i++) {
    const randomIndex = Math.floor(Math.random() * availableTips.length);
    selectedTips.push(availableTips[randomIndex]);
    availableTips.splice(randomIndex, 1); // Remove selected tip
  }
  
  return selectedTips;
};

module.exports = {
  getRandomTip,
  getMultipleTips
};
