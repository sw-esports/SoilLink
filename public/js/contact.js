// Contact page functionality
document.addEventListener('DOMContentLoaded', function() {
    // FAQ toggle functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.faq-toggle i');
        
        if (question && answer && icon) {
            question.addEventListener('click', function() {
                // Toggle answer visibility
                const isVisible = answer.style.display === 'block';
                answer.style.display = isVisible ? 'none' : 'block';
                
                // Toggle icon
                icon.classList.toggle('fa-plus');
                icon.classList.toggle('fa-minus');
                
                // Toggle active class
                item.classList.toggle('active');
            });
        }
    });
    
    // Contact form submission handler
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const name = contactForm.querySelector('input[name="name"]');
            const email = contactForm.querySelector('input[name="email"]');
            const message = contactForm.querySelector('textarea[name="message"]');
            
            if (!name?.value.trim() || !email?.value.trim() || !message?.value.trim()) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value.trim())) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // In a real application, this would submit to the server
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }
});
