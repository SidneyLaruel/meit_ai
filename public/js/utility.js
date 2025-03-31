// utility.js - This file contains helpful utility functions used across the application
// This line writes a message to the developer console to confirm this file has been loaded
console.log('utility.js module loaded');

// Create the UtilityManager object that contains all our utility functions
export const UtilityManager = {
  // This function checks if the user is on a mobile device
  isMobileDevice() {
    // Check if the user agent string contains mobile device identifiers
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  // This function checks if the user is using Safari browser
  isSafari() {
    // Get the user agent string (which tells us what browser the user is using)
    const ua = navigator.userAgent;
    // Check for Safari, making sure to exclude Chrome, Edge, and other webkit browsers
    // This is a more robust way to detect Safari than just looking for "Safari" in the user agent
    return /^((?!chrome|android|crios|fxios|edg|chromium).)*safari/i.test(ua) || 
           (!!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/) && 
            /Apple Computer/.test(navigator.vendor));
  },

  // This function checks if the user is using Opera browser
  isOpera() {
    // Check if the browser is Opera by looking for Opera-specific identifiers
    return !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0 || navigator.userAgent.indexOf('Opera') >= 0;
  },

  // Show a toast notification
  showToast(message, duration = 4000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.position = 'fixed';
      toastContainer.style.bottom = '20px';
      toastContainer.style.left = '50%';
      toastContainer.style.transform = 'translateX(-50%)';
      toastContainer.style.zIndex = '1000';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Style the toast
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    toast.style.color = 'white';
    toast.style.padding = '10px 15px';
    toast.style.borderRadius = '4px';
    toast.style.marginTop = '10px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger reflow to enable transition
    void toast.offsetWidth;
    
    // Show toast
    toast.style.opacity = '1';
    
    // Set timer to remove toast
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toastContainer.removeChild(toast);
        // Remove container if empty
        if (toastContainer.children.length === 0) {
          document.body.removeChild(toastContainer);
        }
      }, 300); // Wait for fade out animation
    }, duration);
    
    return toast;
  },

  // This function adds an event listener and returns a function to remove it
  // This helps prevent memory leaks by making it easy to clean up event listeners
  addEventListenerWithCleanup(element, event, handler) {
    // Add the event listener to the element
    element.addEventListener(event, handler);
    // Return a function that, when called, will remove this event listener
    return () => element.removeEventListener(event, handler);
  },

  // This function updates the user interface (currently just a placeholder)
  updateUI() {
    // Create a document fragment (a lightweight container for DOM elements)
    const fragment = document.createDocumentFragment();
    // Here you would add elements to the fragment
    // Then add the fragment to the body (which is more efficient than adding elements one by one)
    document.body.appendChild(fragment);
  },

  // This function creates a notification that appears briefly and then fades away
  createNotification(id, className, text, duration = 2000) {
    // Find an existing notification element with this ID, or create a new one
    const notification = document.getElementById(id) || this.createNotificationElement(id, className);
    // Set the text of the notification
    notification.textContent = text;
    // Make the notification visible
    notification.style.opacity = '1';

    // After the specified duration (default 2 seconds), fade out the notification
    setTimeout(() => {
      notification.style.opacity = '0';
    }, duration);

    // Return the notification element in case it's needed
    return notification;
  },

  // This function creates a new notification element
  createNotificationElement(id, className) {
    // Create a new div element
    const notification = document.createElement('div');
    // Set its ID so we can find it later
    notification.id = id;
    // Set its CSS class for styling
    notification.className = className;
    // Add it to the page
    document.body.appendChild(notification);
    // Return the created element
    return notification;
  },

  // This function scrolls the chat to the bottom
  scrollToBottom(instant = false) {
    // Find the scroll anchor element (an element at the bottom of the chat)
    const scrollAnchor = document.getElementById('scrollAnchor');
    if (scrollAnchor) {
      // Scroll to make this element visible
      // If instant is true, jump instantly; otherwise, scroll smoothly
      scrollAnchor.scrollIntoView({ 
        behavior: instant ? 'instant' : 'smooth', 
        block: 'end' // Align with the bottom of the viewport
      });
    }
  }
};

// Export showToast as a global function for easier access from other modules
window.showToast = UtilityManager.showToast.bind(UtilityManager);