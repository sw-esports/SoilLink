// Homepage animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Feature cards animation using Intersection Observer
    const featureCards = document.querySelectorAll('.feature-card');
    
    if (featureCards.length > 0) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    // Add staggered animation delay
                    const delay = Array.from(featureCards).indexOf(entry.target) * 100;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
            });
        }, observerOptions);
        
        featureCards.forEach(card => {
            observer.observe(card);
        });
    }
    
    // Steps animation
    const stepElements = document.querySelectorAll('.step');
    
    if (stepElements.length > 0) {
        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-step');
                    const delay = Array.from(stepElements).indexOf(entry.target) * 150;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
            });
        }, { threshold: 0.2 });
        
        stepElements.forEach(step => {
            stepObserver.observe(step);
        });
    }
    
    // Hero call-to-action button hover effect
    const ctaButtons = document.querySelectorAll('.btn-primary');
    
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
