/**
 * component.js
 * Handles loading and injecting shared UI components like Navbar and Modals.
 */

async function loadComponent(url, placeholderId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const html = await response.text();
        document.getElementById(placeholderId).innerHTML = html;
    } catch (error) {
        console.error("Error loading component:", error);
    }
}

async function initSharedComponents() {
    // Create placeholders if they don't exist
    if (!document.getElementById('navbar-placeholder')) {
        const navDiv = document.createElement('div');
        navDiv.id = 'navbar-placeholder';
        document.body.prepend(navDiv);
    }
    
    if (!document.getElementById('modals-placeholder')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'modals-placeholder';
        document.body.appendChild(modalDiv);
    }

    // Load components
    await Promise.all([
        loadComponent('includes/navbar.html', 'navbar-placeholder'),
        loadComponent('includes/modals.html', 'modals-placeholder')
    ]);

    // Dispatch custom event to notify that components are ready
    window.dispatchEvent(new CustomEvent('componentsLoaded'));
}

// Initialize on page load
initSharedComponents();
