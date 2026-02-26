/**
 * Typing Animation Module
 * Handles the typewriter effect for the hero title
 */

// Configuration constants
const TYPING_SPEED = 200; // Milliseconds per character typed
const ERASING_SPEED = 80; // Milliseconds per character erased
const DELAY_BEFORE_ERASE = 800; // Pause after typing a word, before erasing
const DELAY_BEFORE_TYPE_NEXT = 500; // Pause after erasing, before typing the next word

// DOM Cache
let typingElement;

// State variables
let currentIndex = 0; // Which string in typedTexts are we typing
let charIndex = 0; // Which character are we currently typing/erasing

// List of "names" (or phrases) to type and erase
const typedTexts = ['Ioannis', 'Yohannis'];

/**
 * Handles type.
 */
function type() {
  const currentString = typedTexts[currentIndex];

  if (charIndex < currentString.length) {
    typingElement.textContent += currentString.charAt(charIndex);
    charIndex++;
    setTimeout(type, TYPING_SPEED);
  } else {
    // Finished typing one word/phrase, wait then erase
    setTimeout(erase, DELAY_BEFORE_ERASE);
  }
}

/**
 * Handles erase.
 */
function erase() {
  if (charIndex > 0) {
    // Erase one character
    typingElement.textContent = typedTexts[currentIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(erase, ERASING_SPEED);
  } else {
    // Finished erasing, move to the next string
    currentIndex = (currentIndex + 1) % typedTexts.length;
    setTimeout(type, DELAY_BEFORE_TYPE_NEXT);
  }
}

/**
 * Handles initTypingAnimation.
 */
function initTypingAnimation() {
  // Initialize DOM element
  typingElement = document.getElementById('typing');

  // Start the typing animation
  type();
}

// Export functions
window.TypingModule = {
  initTypingAnimation,
};
