// recordrtc-loader.js
// Loads RecordRTC if running on an Android device

(function() {
  // Function to detect Android
  function isAndroidDevice() {
    return /Android/i.test(navigator.userAgent);
  }
  
  // Only load RecordRTC on Android devices
  if (isAndroidDevice()) {
    console.log('[RecordRTC Loader] Android device detected, loading RecordRTC');
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/RecordRTC/5.6.2/RecordRTC.min.js';
    script.async = true;
    script.defer = true;
    
    // Add success and error handlers
    script.onload = function() {
      console.log('[RecordRTC Loader] RecordRTC loaded successfully for Android');
    };
    
    script.onerror = function() {
      console.error('[RecordRTC Loader] Failed to load RecordRTC');
    };
    
    // Append to document head
    document.head.appendChild(script);
  } else {
    console.log('[RecordRTC Loader] Not an Android device, skipping RecordRTC loading');
  }
})(); 